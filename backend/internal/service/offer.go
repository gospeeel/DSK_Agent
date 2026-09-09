package service

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"backend/internal/domain"
	"backend/internal/repository"
)

var (
	ErrInvalidDiscount   = errors.New("invalid discount")
	ErrInvalidOfferState = errors.New("invalid offer state")
	ErrOfferForbidden    = errors.New("offer operation forbidden")
	ErrInvalidPrice      = errors.New("invalid apartment price")
)

type DiscountPolicy struct {
	ManagerMaxBasisPoints    int64
	SupervisorMaxBasisPoints int64
}

type offerDealReader interface {
	GetDealByID(ctx context.Context, id int) (*domain.Deal, error)
}

type offerUserReader interface {
	GetUserByID(ctx context.Context, id int) (*domain.User, error)
}

type offerStore interface {
	GetApartmentPrice(ctx context.Context, apartmentID int) (int64, error)
	Create(ctx context.Context, requestID string, offer *domain.Offer) (*domain.Offer, error)
	GetByID(ctx context.Context, id int) (*domain.Offer, error)
	GetByRequestID(ctx context.Context, requestID string) (*domain.Offer, error)
	MarkPendingApproval(ctx context.Context, id int) (*domain.Offer, error)
}

type OfferService interface {
	Calculate(ctx context.Context, dealID, requestedBy int, discountPercent string) (*domain.OfferCalculation, error)
	Create(ctx context.Context, requestID string, dealID, createdBy int, discountPercent, generatedText string) (*domain.Offer, error)
	RequestApproval(ctx context.Context, offerID, requestedBy int) (*domain.Offer, error)
	Get(ctx context.Context, offerID int) (*domain.Offer, error)
}

type offerService struct {
	deals  offerDealReader
	users  offerUserReader
	store  offerStore
	policy DiscountPolicy
}

func NewOfferService(
	deals offerDealReader,
	users offerUserReader,
	store offerStore,
	managerMaxDiscount float64,
	supervisorMaxDiscount float64,
) (OfferService, error) {
	manager, err := percentStringToBasisPoints(strconv.FormatFloat(managerMaxDiscount, 'f', -1, 64))
	if err != nil {
		return nil, err
	}
	supervisor, err := percentStringToBasisPoints(strconv.FormatFloat(supervisorMaxDiscount, 'f', -1, 64))
	if err != nil {
		return nil, err
	}
	if supervisor < manager {
		return nil, errors.New("supervisor discount limit must not be lower than manager limit")
	}
	return &offerService{
		deals:  deals,
		users:  users,
		store:  store,
		policy: DiscountPolicy{ManagerMaxBasisPoints: manager, SupervisorMaxBasisPoints: supervisor},
	}, nil
}

func (s *offerService) Calculate(
	ctx context.Context,
	dealID int,
	actorID int,
	discountPercent string,
) (*domain.OfferCalculation, error) {
	discount, err := percentStringToBasisPoints(discountPercent)
	if err != nil {
		return nil, ErrInvalidDiscount
	}
	deal, user, err := s.authorizeDeal(ctx, dealID, actorID)
	if err != nil {
		return nil, err
	}
	if deal.ApartmentID <= 0 {
		return nil, repository.ErrApartmentNotFound
	}
	maxDiscount, err := s.maxDiscount(user.Role)
	if err != nil {
		return nil, err
	}
	basePrice, err := s.store.GetApartmentPrice(ctx, deal.ApartmentID)
	if err != nil {
		return nil, err
	}
	if basePrice <= 0 {
		return nil, ErrInvalidPrice
	}
	discountAmount := roundedRatio(basePrice, discount, 10000)
	return &domain.OfferCalculation{
		DealID:             deal.ID,
		BasePrice:          basePrice,
		DiscountPercent:    formatBasisPoints(discount),
		DiscountAmount:     discountAmount,
		FinalPrice:         basePrice - discountAmount,
		MaxAllowedDiscount: formatBasisPoints(maxDiscount),
		RequiresApproval:   discount > maxDiscount,
	}, nil
}

func (s *offerService) Create(
	ctx context.Context,
	requestID string,
	dealID int,
	actorID int,
	discountPercent string,
	generatedText string,
) (*domain.Offer, error) {
	// Authorize before serving an idempotent result so a reused request_id cannot
	// disclose or reuse an offer belonging to another actor/deal.
	calculation, err := s.Calculate(ctx, dealID, actorID, discountPercent)
	if err != nil {
		return nil, err
	}
	existing, err := s.store.GetByRequestID(ctx, requestID)
	if err == nil {
		if existing.DealID != dealID || existing.CreatedBy != actorID {
			return nil, ErrOfferForbidden
		}
		return existing, nil
	}
	if !errors.Is(err, repository.ErrOfferNotFound) {
		return nil, err
	}
	status := domain.OfferStatusApproved
	if calculation.RequiresApproval {
		status = domain.OfferStatusDraft
	}
	return s.store.Create(ctx, requestID, &domain.Offer{
		DealID:           dealID,
		CreatedBy:        actorID,
		BasePrice:        calculation.BasePrice,
		DiscountPercent:  calculation.DiscountPercent,
		FinalPrice:       calculation.FinalPrice,
		GeneratedText:    strings.TrimSpace(generatedText),
		Status:           status,
		ApprovalRequired: calculation.RequiresApproval,
	})
}

func (s *offerService) RequestApproval(ctx context.Context, offerID, actorID int) (*domain.Offer, error) {
	user, err := s.users.GetUserByID(ctx, actorID)
	if err != nil {
		return nil, err
	}
	offer, err := s.store.GetByID(ctx, offerID)
	if err != nil {
		return nil, err
	}
	deal, err := s.deals.GetDealByID(ctx, offer.DealID)
	if err != nil {
		return nil, err
	}
	if err := authorizeOfferActor(user, deal); err != nil {
		return nil, ErrOfferForbidden
	}
	if !offer.ApprovalRequired {
		return nil, ErrInvalidOfferState
	}
	if offer.Status == domain.OfferStatusPendingApproval {
		return offer, nil
	}
	if offer.Status != domain.OfferStatusDraft {
		return nil, ErrInvalidOfferState
	}
	updated, err := s.store.MarkPendingApproval(ctx, offerID)
	if errors.Is(err, repository.ErrOfferNotFound) {
		current, getErr := s.store.GetByID(ctx, offerID)
		if getErr == nil && current.Status == domain.OfferStatusPendingApproval {
			return current, nil
		}
	}
	return updated, err
}

func (s *offerService) authorizeDeal(
	ctx context.Context,
	dealID int,
	actorID int,
) (*domain.Deal, *domain.User, error) {
	user, err := s.users.GetUserByID(ctx, actorID)
	if err != nil {
		return nil, nil, err
	}
	deal, err := s.deals.GetDealByID(ctx, dealID)
	if err != nil {
		return nil, nil, err
	}
	if err := authorizeOfferActor(user, deal); err != nil {
		return nil, nil, err
	}
	return deal, user, nil
}

func authorizeOfferActor(user *domain.User, deal *domain.Deal) error {
	switch user.Role {
	case domain.RoleSupervisor:
		return nil
	case domain.RoleManager:
		if deal.EmployeeID == user.ID {
			return nil
		}
	}
	return ErrOfferForbidden
}

func (s *offerService) Get(ctx context.Context, offerID int) (*domain.Offer, error) {
	return s.store.GetByID(ctx, offerID)
}

func (s *offerService) maxDiscount(role domain.Role) (int64, error) {
	switch role {
	case domain.RoleManager:
		return s.policy.ManagerMaxBasisPoints, nil
	case domain.RoleSupervisor:
		return s.policy.SupervisorMaxBasisPoints, nil
	default:
		return 0, ErrOfferForbidden
	}
}

func percentStringToBasisPoints(value string) (int64, error) {
	value = strings.TrimSpace(value)
	if value == "" || strings.HasPrefix(value, "-") {
		return 0, ErrInvalidDiscount
	}
	parts := strings.Split(value, ".")
	if len(parts) > 2 || len(parts[0]) == 0 {
		return 0, ErrInvalidDiscount
	}
	whole, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return 0, ErrInvalidDiscount
	}
	fraction := ""
	if len(parts) == 2 {
		fraction = parts[1]
		if len(fraction) > 2 {
			return 0, ErrInvalidDiscount
		}
	}
	for len(fraction) < 2 {
		fraction += "0"
	}
	fractionValue := int64(0)
	if fraction != "" {
		fractionValue, err = strconv.ParseInt(fraction, 10, 64)
		if err != nil {
			return 0, ErrInvalidDiscount
		}
	}
	basisPoints := whole*100 + fractionValue
	if basisPoints < 0 || basisPoints > 10000 {
		return 0, ErrInvalidDiscount
	}
	return basisPoints, nil
}

func formatBasisPoints(value int64) string {
	whole, fraction := value/100, value%100
	if fraction == 0 {
		return strconv.FormatInt(whole, 10)
	}
	if fraction%10 == 0 {
		return strconv.FormatInt(whole, 10) + "." + strconv.FormatInt(fraction/10, 10)
	}
	return strconv.FormatInt(whole, 10) + "." + fmtTwoDigits(fraction)
}

func fmtTwoDigits(value int64) string {
	if value < 10 {
		return "0" + strconv.FormatInt(value, 10)
	}
	return strconv.FormatInt(value, 10)
}

func roundedRatio(value, numerator, denominator int64) int64 {
	return (value*numerator + denominator/2) / denominator
}
