package repository

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"backend/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrOfferNotFound = errors.New("offer not found")

type OfferRepository interface {
	GetApartmentPrice(ctx context.Context, apartmentID int) (int64, error)
	Create(ctx context.Context, requestID string, offer *domain.Offer) (*domain.Offer, error)
	GetByID(ctx context.Context, id int) (*domain.Offer, error)
	GetByRequestID(ctx context.Context, requestID string) (*domain.Offer, error)
	MarkPendingApproval(ctx context.Context, id int) (*domain.Offer, error)
}

type offerRepository struct {
	db *pgxpool.Pool
}

func NewOfferRepository(db *pgxpool.Pool) OfferRepository {
	return &offerRepository{db: db}
}

func (r *offerRepository) GetApartmentPrice(ctx context.Context, apartmentID int) (int64, error) {
	var raw string
	if err := r.db.QueryRow(ctx, `SELECT price::text FROM apartments WHERE id = $1`, apartmentID).Scan(&raw); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrApartmentNotFound
		}
		return 0, err
	}
	return decimalMoneyToInteger(raw)
}

func decimalMoneyToInteger(raw string) (int64, error) {
	parts := strings.SplitN(raw, ".", 2)
	whole, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return 0, err
	}
	if len(parts) == 1 || strings.TrimRight(parts[1], "0") == "" {
		return whole, nil
	}
	fraction := parts[1]
	if len(fraction) > 2 {
		fraction = fraction[:2]
	}
	for len(fraction) < 2 {
		fraction += "0"
	}
	kopecks, err := strconv.Atoi(fraction)
	if err != nil {
		return 0, err
	}
	if kopecks >= 50 {
		whole++
	}
	return whole, nil
}

func (r *offerRepository) Create(ctx context.Context, requestID string, offer *domain.Offer) (*domain.Offer, error) {
	query := `
		INSERT INTO offers (
			deal_id, created_by, base_price, discount_percent, final_price,
			generated_text, status, approval_required, request_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (request_id) DO NOTHING
		RETURNING id, deal_id, created_by, base_price, discount_percent::text,
		          final_price, generated_text, status, approval_required,
		          approved_by, approved_at, created_at, updated_at
	`
	created, err := scanOffer(r.db.QueryRow(ctx, query,
		offer.DealID, offer.CreatedBy, offer.BasePrice, offer.DiscountPercent,
		offer.FinalPrice, offer.GeneratedText, offer.Status,
		offer.ApprovalRequired, requestID,
	))
	if err == nil {
		return created, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	return r.GetByRequestID(ctx, requestID)
}

func (r *offerRepository) GetByID(ctx context.Context, id int) (*domain.Offer, error) {
	query := `
		SELECT id, deal_id, created_by, base_price, discount_percent::text,
		       final_price, generated_text, status, approval_required,
		       approved_by, approved_at, created_at, updated_at
		FROM offers WHERE id = $1
	`
	offer, err := scanOffer(r.db.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrOfferNotFound
	}
	return offer, err
}

func (r *offerRepository) GetByRequestID(ctx context.Context, requestID string) (*domain.Offer, error) {
	query := `
		SELECT id, deal_id, created_by, base_price, discount_percent::text,
		       final_price, generated_text, status, approval_required,
		       approved_by, approved_at, created_at, updated_at
		FROM offers WHERE request_id = $1
	`
	offer, err := scanOffer(r.db.QueryRow(ctx, query, requestID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrOfferNotFound
	}
	return offer, err
}

func (r *offerRepository) MarkPendingApproval(ctx context.Context, id int) (*domain.Offer, error) {
	query := `
		UPDATE offers SET status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND status = $3 AND approval_required = TRUE
		RETURNING id, deal_id, created_by, base_price, discount_percent::text,
		          final_price, generated_text, status, approval_required,
		          approved_by, approved_at, created_at, updated_at
	`
	offer, err := scanOffer(r.db.QueryRow(ctx, query, domain.OfferStatusPendingApproval, id, domain.OfferStatusDraft))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrOfferNotFound
	}
	return offer, err
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanOffer(row rowScanner) (*domain.Offer, error) {
	var offer domain.Offer
	err := row.Scan(
		&offer.ID, &offer.DealID, &offer.CreatedBy, &offer.BasePrice,
		&offer.DiscountPercent, &offer.FinalPrice, &offer.GeneratedText,
		&offer.Status, &offer.ApprovalRequired, &offer.ApprovedBy,
		&offer.ApprovedAt, &offer.CreatedAt, &offer.UpdatedAt,
	)
	return &offer, err
}
