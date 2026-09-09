package repository

import (
	"context"
	"errors"

	"backend/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrDealNotFound = errors.New("deal not found")

type DealRepository interface {
	CreateDeal(ctx context.Context, deal *domain.Deal) (*domain.Deal, error)
	GetDealByID(ctx context.Context, id int) (*domain.Deal, error)
	GetDeals(ctx context.Context, userID *int, employeeID *int, status *domain.DealStatus) ([]*domain.Deal, error)
	UpdateDealStatus(ctx context.Context, id int, status domain.DealStatus, discount *float64, totalPrice *float64) (*domain.Deal, error)
	GetDealsByBuildingID(ctx context.Context, buildingID int) ([]*domain.Deal, error)
}

func (r *dealRepository) GetDealsByBuildingID(ctx context.Context, buildingID int) ([]*domain.Deal, error) {
	query := `
		SELECT d.id, d.id_user, d.id_employee, d.id_apartment, d.id_chat_session,
		       d.base_price, d.percent_discount, d.total_price, d.status,
		       d.created_at, d.updated_at
		FROM deals d
		JOIN apartments a ON a.id = d.id_apartment
		WHERE a.building_id = $1
		ORDER BY d.id
	`
	rows, err := r.db.Query(ctx, query, buildingID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	deals := make([]*domain.Deal, 0)
	for rows.Next() {
		var deal domain.Deal
		if err := rows.Scan(
			&deal.ID, &deal.UserID, &deal.EmployeeID, &deal.ApartmentID,
			&deal.ChatSessionID, &deal.BasePrice, &deal.PercentDiscount,
			&deal.TotalPrice, &deal.Status, &deal.CreatedAt, &deal.UpdatedAt,
		); err != nil {
			return nil, err
		}
		deals = append(deals, &deal)
	}
	return deals, rows.Err()
}

type dealRepository struct {
	db *pgxpool.Pool
}

func NewDealRepository(db *pgxpool.Pool) DealRepository {
	return &dealRepository{db: db}
}

func (r *dealRepository) CreateDeal(ctx context.Context, deal *domain.Deal) (*domain.Deal, error) {
	query := `
		INSERT INTO deals (id_user, id_employee, id_apartment, id_chat_session, base_price, percent_discount, total_price, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING id, id_user, id_employee, id_apartment, id_chat_session, base_price, percent_discount, total_price, status, created_at, updated_at
	`
	var d domain.Deal
	err := r.db.QueryRow(ctx, query,
		deal.UserID,
		deal.EmployeeID,
		deal.ApartmentID,
		deal.ChatSessionID,
		deal.BasePrice,
		deal.PercentDiscount,
		deal.TotalPrice,
		domain.DealStatusPending,
	).Scan(
		&d.ID,
		&d.UserID,
		&d.EmployeeID,
		&d.ApartmentID,
		&d.ChatSessionID,
		&d.BasePrice,
		&d.PercentDiscount,
		&d.TotalPrice,
		&d.Status,
		&d.CreatedAt,
		&d.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *dealRepository) GetDealByID(ctx context.Context, id int) (*domain.Deal, error) {
	query := `
		SELECT 
			d.id, d.id_user, d.id_employee, d.id_apartment, d.id_chat_session,
			d.base_price, d.percent_discount, d.total_price, d.status, 
			d.created_at, d.updated_at,
			u.name AS user_name,
			e.name AS employee_name,
			a.number AS apartment_number
		FROM deals d
		LEFT JOIN users u ON d.id_user = u.id
		LEFT JOIN users e ON d.id_employee = e.id
		LEFT JOIN apartments a ON d.id_apartment = a.id
		WHERE d.id = $1
	`
	var d domain.Deal
	err := r.db.QueryRow(ctx, query, id).Scan(
		&d.ID,
		&d.UserID,
		&d.EmployeeID,
		&d.ApartmentID,
		&d.ChatSessionID,
		&d.BasePrice,
		&d.PercentDiscount,
		&d.TotalPrice,
		&d.Status,
		&d.CreatedAt,
		&d.UpdatedAt,
		&d.UserName,
		&d.EmployeeName,
		&d.ApartmentNumber,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDealNotFound
		}
		return nil, err
	}
	return &d, nil
}

func (r *dealRepository) GetDeals(ctx context.Context, userID *int, employeeID *int, status *domain.DealStatus) ([]*domain.Deal, error) {
	query := `
		SELECT 
			d.id, d.id_user, d.id_employee, d.id_apartment, d.id_chat_session,
			d.base_price, d.percent_discount, d.total_price, d.status, 
			d.created_at, d.updated_at,
			u.name AS user_name,
			e.name AS employee_name,
			a.number AS apartment_number
		FROM deals d
		LEFT JOIN users u ON d.id_user = u.id
		LEFT JOIN users e ON d.id_employee = e.id
		LEFT JOIN apartments a ON d.id_apartment = a.id
		WHERE ($1::int IS NULL OR d.id_user = $1)
		  AND ($2::int IS NULL OR d.id_employee = $2)
		  AND ($3::text IS NULL OR d.status::text = $3)
		ORDER BY d.updated_at DESC
	`
	var statusStr *string
	if status != nil {
		s := string(*status)
		statusStr = &s
	}

	rows, err := r.db.Query(ctx, query, userID, employeeID, statusStr)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deals []*domain.Deal
	for rows.Next() {
		var d domain.Deal
		err := rows.Scan(
			&d.ID,
			&d.UserID,
			&d.EmployeeID,
			&d.ApartmentID,
			&d.ChatSessionID,
			&d.BasePrice,
			&d.PercentDiscount,
			&d.TotalPrice,
			&d.Status,
			&d.CreatedAt,
			&d.UpdatedAt,
			&d.UserName,
			&d.EmployeeName,
			&d.ApartmentNumber,
		)
		if err != nil {
			return nil, err
		}
		deals = append(deals, &d)
	}

	if deals == nil {
		deals = []*domain.Deal{}
	}

	return deals, nil
}

func (r *dealRepository) UpdateDealStatus(ctx context.Context, id int, status domain.DealStatus, discount *float64, totalPrice *float64) (*domain.Deal, error) {
	query := `
		UPDATE deals 
		SET status = $1,
		    percent_discount = COALESCE($2, percent_discount),
		    total_price = COALESCE($3, total_price),
		    updated_at = NOW()
		WHERE id = $4
		RETURNING id, id_user, id_employee, id_apartment, id_chat_session, base_price, percent_discount, total_price, status, created_at, updated_at
	`
	var d domain.Deal
	err := r.db.QueryRow(ctx, query, status, discount, totalPrice, id).Scan(
		&d.ID,
		&d.UserID,
		&d.EmployeeID,
		&d.ApartmentID,
		&d.ChatSessionID,
		&d.BasePrice,
		&d.PercentDiscount,
		&d.TotalPrice,
		&d.Status,
		&d.CreatedAt,
		&d.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDealNotFound
		}
		return nil, err
	}
	return &d, nil
}
