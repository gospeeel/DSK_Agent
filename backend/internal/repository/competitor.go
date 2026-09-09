package repository

import (
	"context"

	"backend/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CompetitorRepository interface {
	ListByDistrict(ctx context.Context, district string) ([]*domain.Competitor, error)
}

type competitorRepository struct {
	db *pgxpool.Pool
}

func NewCompetitorRepository(db *pgxpool.Pool) CompetitorRepository {
	return &competitorRepository{db: db}
}

func (r *competitorRepository) ListByDistrict(ctx context.Context, district string) ([]*domain.Competitor, error) {
	query := `
		SELECT id, project_name, district, price_per_sqm, advantages, disadvantages
		FROM competitors
		WHERE LOWER(district) = LOWER($1)
		ORDER BY project_name, id
	`
	rows, err := r.db.Query(ctx, query, district)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]*domain.Competitor, 0)
	for rows.Next() {
		var item domain.Competitor
		if err := rows.Scan(&item.ID, &item.ProjectName, &item.District, &item.PricePerSqm, &item.Advantages, &item.Disadvantages); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	return items, rows.Err()
}
