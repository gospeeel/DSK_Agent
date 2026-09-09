package service

import (
	"context"
	"errors"
	"math"

	"backend/internal/domain"
	"backend/internal/repository"
)

var (
	ErrInvalidDealData = errors.New("invalid deal data: base price must be greater than 0 and discount between 0 and 100")
)

type DealService interface {
	CreateDeal(ctx context.Context, req domain.CreateDealRequest, employeeID int) (*domain.Deal, error)
	GetDealByID(ctx context.Context, id int) (*domain.Deal, error)
	GetDeals(ctx context.Context, userID *int, employeeID *int, status *domain.DealStatus) ([]*domain.Deal, error)
	UpdateDealStatus(ctx context.Context, id int, req domain.UpdateDealStatusRequest) (*domain.Deal, error)
}

type dealService struct {
	dealRepo repository.DealRepository
}

func NewDealService(dealRepo repository.DealRepository) DealService {
	return &dealService{dealRepo: dealRepo}
}

func roundPrice(val float64) float64 {
	return math.Round(val*100) / 100
}

func (s *dealService) CreateDeal(ctx context.Context, req domain.CreateDealRequest, employeeID int) (*domain.Deal, error) {
	if req.BasePrice <= 0 || req.PercentDiscount < 0 || req.PercentDiscount > 100 {
		return nil, ErrInvalidDealData
	}

	totalPrice := roundPrice(req.BasePrice * (1.0 - req.PercentDiscount/100.0))

	deal := &domain.Deal{
		UserID:          req.UserID,
		EmployeeID:      employeeID,
		ApartmentID:     req.ApartmentID,
		BasePrice:       req.BasePrice,
		PercentDiscount: req.PercentDiscount,
		TotalPrice:      totalPrice,
	}

	return s.dealRepo.CreateDeal(ctx, deal)
}

func (s *dealService) GetDealByID(ctx context.Context, id int) (*domain.Deal, error) {
	return s.dealRepo.GetDealByID(ctx, id)
}

func (s *dealService) GetDeals(ctx context.Context, userID *int, employeeID *int, status *domain.DealStatus) ([]*domain.Deal, error) {
	return s.dealRepo.GetDeals(ctx, userID, employeeID, status)
}

func (s *dealService) UpdateDealStatus(ctx context.Context, id int, req domain.UpdateDealStatusRequest) (*domain.Deal, error) {
	existing, err := s.dealRepo.GetDealByID(ctx, id)
	if err != nil {
		return nil, err
	}

	var discount *float64
	var totalPrice *float64

	if req.PercentDiscount != nil {
		d := *req.PercentDiscount
		if d < 0 || d > 100 {
			return nil, ErrInvalidDealData
		}
		discount = &d
		tp := roundPrice(existing.BasePrice * (1.0 - d/100.0))
		totalPrice = &tp
	}

	return s.dealRepo.UpdateDealStatus(ctx, id, req.Status, discount, totalPrice)
}
