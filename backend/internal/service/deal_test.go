package service

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain"
)

type fakeDealRepository struct {
	price         float64
	apartment     domain.ApartmentStatus
	canCreate     bool
	created       *domain.Deal
	existing      *domain.Deal
	updatedStatus domain.DealStatus
}

type fakeDiscountPolicyReader struct {
	value string
	err   error
}

func (f fakeDiscountPolicyReader) GetActiveMax(context.Context, int, domain.Role) (string, error) {
	return f.value, f.err
}

func (f *fakeDealRepository) CreateDeal(_ context.Context, deal *domain.Deal) (*domain.Deal, error) {
	copy := *deal
	copy.ID = 1
	f.created = &copy
	return &copy, nil
}
func (f *fakeDealRepository) GetDealByID(context.Context, int) (*domain.Deal, error) {
	return f.existing, nil
}
func (*fakeDealRepository) GetDeals(context.Context, *int, *int, *domain.DealStatus) ([]*domain.Deal, error) {
	return nil, nil
}
func (f *fakeDealRepository) UpdateDealStatus(_ context.Context, _ int, status domain.DealStatus, _ *float64, _ *float64) (*domain.Deal, error) {
	f.updatedStatus = status
	return f.existing, nil
}
func (*fakeDealRepository) GetDealsByBuildingID(context.Context, int) ([]*domain.Deal, error) {
	return nil, nil
}
func (f *fakeDealRepository) GetApartmentSaleData(context.Context, int) (float64, domain.ApartmentStatus, error) {
	return f.price, f.apartment, nil
}
func (f *fakeDealRepository) CanCreateDealForUser(context.Context, *domain.User, int, *int) (bool, error) {
	return f.canCreate, nil
}

func TestCreateDealUsesCatalogPriceAndRoleLimit(t *testing.T) {
	repo := &fakeDealRepository{price: 12_000_000, apartment: domain.ApartmentStatusFree, canCreate: true}
	service := NewDealService(repo, 5, 15)
	actor := &domain.User{ID: 11, Role: domain.RoleManager}
	deal, err := service.CreateDeal(context.Background(), domain.CreateDealRequest{UserID: 7, ApartmentID: 4, PercentDiscount: 5}, actor)
	if err != nil || deal.BasePrice != 12_000_000 || deal.TotalPrice != 11_400_000 || deal.EmployeeID != 11 {
		t.Fatalf("unexpected trusted-price deal: %#v, err=%v", deal, err)
	}
	_, err = service.CreateDeal(context.Background(), domain.CreateDealRequest{UserID: 7, ApartmentID: 4, PercentDiscount: 5.01}, actor)
	if !errors.Is(err, ErrDiscountApprovalRequired) {
		t.Fatalf("expected approval requirement, got %v", err)
	}
}

func TestCreateDealUsesBuildingDiscountPolicyBeforeFallback(t *testing.T) {
	repo := &fakeDealRepository{price: 10_000_000, apartment: domain.ApartmentStatusFree, canCreate: true}
	service := NewDealService(repo, 5, 15, fakeDiscountPolicyReader{value: "3.5"})
	actor := &domain.User{ID: 11, Role: domain.RoleManager}
	_, err := service.CreateDeal(context.Background(), domain.CreateDealRequest{UserID: 7, ApartmentID: 4, PercentDiscount: 4}, actor)
	if !errors.Is(err, ErrDiscountApprovalRequired) {
		t.Fatalf("expected building policy to require approval, got %v", err)
	}
}

func TestCreateDealChecksClientAndApartmentAvailability(t *testing.T) {
	actor := &domain.User{ID: 11, Role: domain.RoleManager}
	repo := &fakeDealRepository{price: 12_000_000, apartment: domain.ApartmentStatusFree}
	service := NewDealService(repo, 5, 15)
	_, err := service.CreateDeal(context.Background(), domain.CreateDealRequest{UserID: 7, ApartmentID: 4}, actor)
	if !errors.Is(err, ErrDealForbidden) {
		t.Fatalf("expected inaccessible client to be rejected, got %v", err)
	}
	repo.canCreate = true
	repo.apartment = domain.ApartmentStatusBooked
	_, err = service.CreateDeal(context.Background(), domain.CreateDealRequest{UserID: 7, ApartmentID: 4}, actor)
	if !errors.Is(err, ErrApartmentUnavailable) {
		t.Fatalf("expected unavailable apartment to be rejected, got %v", err)
	}
}

func TestUpdateDealStatusChecksOwnershipAndEnum(t *testing.T) {
	repo := &fakeDealRepository{existing: &domain.Deal{ID: 1, EmployeeID: 11, BasePrice: 1_000_000}}
	service := NewDealService(repo, 5, 15)
	_, err := service.UpdateDealStatus(context.Background(), 1, domain.UpdateDealStatusRequest{Status: domain.DealStatusContract}, &domain.User{ID: 12, Role: domain.RoleManager})
	if !errors.Is(err, ErrDealForbidden) {
		t.Fatalf("expected foreign manager to be rejected, got %v", err)
	}
	_, err = service.UpdateDealStatus(context.Background(), 1, domain.UpdateDealStatusRequest{Status: "unknown"}, &domain.User{ID: 11, Role: domain.RoleManager})
	if !errors.Is(err, ErrInvalidDealData) {
		t.Fatalf("expected invalid status, got %v", err)
	}
}
