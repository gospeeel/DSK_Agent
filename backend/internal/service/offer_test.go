package service

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain"
	"backend/internal/repository"
)

type fakeOfferDealReader struct {
	deal *domain.Deal
	err  error
}

func (f *fakeOfferDealReader) GetDealByID(context.Context, int) (*domain.Deal, error) {
	return f.deal, f.err
}

type fakeOfferUserReader struct {
	users map[int]*domain.User
	err   error
}

func (f *fakeOfferUserReader) GetUserByID(_ context.Context, id int) (*domain.User, error) {
	if f.err != nil {
		return nil, f.err
	}
	user := f.users[id]
	if user == nil {
		return nil, repository.ErrUserNotFound
	}
	return user, nil
}

type fakeOfferStore struct {
	price      int64
	buildingID int
	priceErr   error
	units      map[int]*domain.AncillaryUnit
	offers     map[int]*domain.Offer
	requests   map[string]*domain.Offer
	nextID     int
}

func newFakeOfferStore(price int64) *fakeOfferStore {
	return &fakeOfferStore{
		price: price, buildingID: 20, units: map[int]*domain.AncillaryUnit{}, offers: map[int]*domain.Offer{}, requests: map[string]*domain.Offer{}, nextID: 1,
	}
}

func (f *fakeOfferStore) GetApartmentOfferData(context.Context, int) (int64, int, error) {
	return f.price, f.buildingID, f.priceErr
}

func (f *fakeOfferStore) GetAncillaryUnit(_ context.Context, id int) (*domain.AncillaryUnit, error) {
	if unit := f.units[id]; unit != nil {
		return unit, nil
	}
	return nil, repository.ErrAncillaryUnitNotFound
}

func (f *fakeOfferStore) Create(_ context.Context, requestID string, offer *domain.Offer) (*domain.Offer, error) {
	if existing := f.requests[requestID]; existing != nil {
		return existing, nil
	}
	copy := *offer
	copy.ID = f.nextID
	f.nextID++
	f.offers[copy.ID] = &copy
	f.requests[requestID] = &copy
	return &copy, nil
}

func (f *fakeOfferStore) GetByID(_ context.Context, id int) (*domain.Offer, error) {
	if offer := f.offers[id]; offer != nil {
		return offer, nil
	}
	return nil, repository.ErrOfferNotFound
}

func (f *fakeOfferStore) GetByRequestID(_ context.Context, requestID string) (*domain.Offer, error) {
	if offer := f.requests[requestID]; offer != nil {
		return offer, nil
	}
	return nil, repository.ErrOfferNotFound
}

func (f *fakeOfferStore) List(_ context.Context, createdBy *int) ([]*domain.Offer, error) {
	items := make([]*domain.Offer, 0)
	for _, offer := range f.offers {
		if createdBy == nil || offer.CreatedBy == *createdBy {
			items = append(items, offer)
		}
	}
	return items, nil
}

func (f *fakeOfferStore) MarkPendingApproval(_ context.Context, id int) (*domain.Offer, error) {
	offer := f.offers[id]
	if offer == nil || offer.Status != domain.OfferStatusDraft || !offer.ApprovalRequired {
		return nil, repository.ErrOfferNotFound
	}
	offer.Status = domain.OfferStatusPendingApproval
	return offer, nil
}

func (f *fakeOfferStore) Decide(_ context.Context, id, supervisorID int, approve bool, reason string) (*domain.Offer, error) {
	offer := f.offers[id]
	if offer == nil || offer.Status != domain.OfferStatusPendingApproval {
		return nil, repository.ErrOfferNotFound
	}
	if approve {
		offer.Status = domain.OfferStatusApproved
		offer.ApprovedBy = &supervisorID
	} else {
		offer.Status = domain.OfferStatusRejected
		offer.RejectedBy = &supervisorID
		offer.RejectionReason = &reason
	}
	return offer, nil
}

func newTestOfferService(role domain.Role, price int64) (*offerService, *fakeOfferStore) {
	store := newFakeOfferStore(price)
	return &offerService{
		deals:  &fakeOfferDealReader{deal: &domain.Deal{ID: 10, EmployeeID: 15, ApartmentID: 30}},
		users:  &fakeOfferUserReader{users: map[int]*domain.User{15: {ID: 15, Role: role}}},
		store:  store,
		policy: DiscountPolicy{ManagerMaxBasisPoints: 500, SupervisorMaxBasisPoints: 1500},
	}, store
}

func TestOfferCalculateManagerWithinAndOverLimit(t *testing.T) {
	service, _ := newTestOfferService(domain.RoleManager, 14200000)
	within, err := service.Calculate(context.Background(), 10, 15, "5")
	if err != nil || within.RequiresApproval || within.FinalPrice != 13490000 || within.DiscountAmount != 710000 {
		t.Fatalf("unexpected within-limit calculation: %#v err=%v", within, err)
	}
	over, err := service.Calculate(context.Background(), 10, 15, "7")
	if err != nil || !over.RequiresApproval || over.FinalPrice != 13206000 || over.MaxAllowedDiscount != "5" {
		t.Fatalf("unexpected over-limit calculation: %#v err=%v", over, err)
	}
}

func TestOfferCalculationAndSavedOfferIncludeAncillaryUnits(t *testing.T) {
	service, store := newTestOfferService(domain.RoleManager, 14_200_000)
	parkingID, storageID := 41, 42
	store.units[parkingID] = &domain.AncillaryUnit{
		ID: parkingID, BuildingID: 20, Kind: domain.AncillaryKindParking,
		Number: "P-041", Price: 1_250_000, Status: domain.ApartmentStatusFree,
	}
	store.units[storageID] = &domain.AncillaryUnit{
		ID: storageID, BuildingID: 20, Kind: domain.AncillaryKindStorage,
		Number: "K-018", Price: 480_000, Status: domain.ApartmentStatusFree,
	}
	selection := domain.OfferSelection{ParkingUnitID: &parkingID, StorageUnitID: &storageID}

	calculation, err := service.Calculate(context.Background(), 10, 15, "5", selection)
	if err != nil || calculation.ApartmentPrice != 14_200_000 || calculation.BasePrice != 15_930_000 ||
		calculation.DiscountAmount != 796_500 || calculation.FinalPrice != 15_133_500 {
		t.Fatalf("unexpected ancillary calculation: %#v err=%v", calculation, err)
	}

	created, err := service.Create(context.Background(), "with_ancillary", 10, 15, "5", "Text", selection)
	if err != nil || created.ParkingUnitID == nil || *created.ParkingUnitID != parkingID ||
		created.ParkingPrice != 1_250_000 || created.StorageUnitID == nil ||
		*created.StorageUnitID != storageID || created.StoragePrice != 480_000 {
		t.Fatalf("saved offer lost ancillary snapshot: %#v err=%v", created, err)
	}
}

func TestOfferRejectsUnavailableOrForeignAncillaryUnit(t *testing.T) {
	service, store := newTestOfferService(domain.RoleManager, 1_000_000)
	unitID := 41
	cases := []*domain.AncillaryUnit{
		{ID: unitID, BuildingID: 99, Kind: domain.AncillaryKindParking, Price: 1, Status: domain.ApartmentStatusFree},
		{ID: unitID, BuildingID: 20, Kind: domain.AncillaryKindStorage, Price: 1, Status: domain.ApartmentStatusFree},
		{ID: unitID, BuildingID: 20, Kind: domain.AncillaryKindParking, Price: 1, Status: domain.ApartmentStatusBooked},
	}
	for _, unit := range cases {
		store.units[unitID] = unit
		_, err := service.Calculate(context.Background(), 10, 15, "0", domain.OfferSelection{ParkingUnitID: &unitID})
		if !errors.Is(err, ErrInvalidAncillary) {
			t.Fatalf("expected invalid ancillary unit for %#v, got %v", unit, err)
		}
	}
}

func TestOfferCalculateUsesBuildingDiscountPolicy(t *testing.T) {
	service, _ := newTestOfferService(domain.RoleManager, 1_000_000)
	service.policyReader = fakeDiscountPolicyReader{value: "2.5"}
	calculation, err := service.Calculate(context.Background(), 10, 15, "3")
	if err != nil || !calculation.RequiresApproval || calculation.MaxAllowedDiscount != "2.5" {
		t.Fatalf("unexpected building policy calculation: %#v err=%v", calculation, err)
	}
}

func TestOfferCalculateSupervisorZeroAndRounding(t *testing.T) {
	service, _ := newTestOfferService(domain.RoleSupervisor, 101)
	zero, err := service.Calculate(context.Background(), 10, 15, "0")
	if err != nil || zero.FinalPrice != 101 || zero.RequiresApproval {
		t.Fatalf("unexpected zero calculation: %#v err=%v", zero, err)
	}
	calculation, err := service.Calculate(context.Background(), 10, 15, "10.50")
	if err != nil || calculation.DiscountAmount != 11 || calculation.FinalPrice != 90 || calculation.RequiresApproval {
		t.Fatalf("unexpected rounded supervisor calculation: %#v err=%v", calculation, err)
	}
}

func TestOfferCalculateValidationAndDependencies(t *testing.T) {
	service, store := newTestOfferService(domain.RoleManager, 100)
	for _, discount := range []string{"-1", "100.01", "1.234", "invalid"} {
		if _, err := service.Calculate(context.Background(), 10, 15, discount); !errors.Is(err, ErrInvalidDiscount) {
			t.Fatalf("expected invalid discount for %q, got %v", discount, err)
		}
	}
	service.deals = &fakeOfferDealReader{err: repository.ErrDealNotFound}
	if _, err := service.Calculate(context.Background(), 10, 15, "1"); !errors.Is(err, repository.ErrDealNotFound) {
		t.Fatalf("expected deal not found, got %v", err)
	}
	service.deals = &fakeOfferDealReader{deal: &domain.Deal{ID: 10, EmployeeID: 15, ApartmentID: 30}}
	service.users = &fakeOfferUserReader{err: repository.ErrUserNotFound}
	if _, err := service.Calculate(context.Background(), 10, 15, "1"); !errors.Is(err, repository.ErrUserNotFound) {
		t.Fatalf("expected user not found, got %v", err)
	}
	service.users = &fakeOfferUserReader{users: map[int]*domain.User{15: {ID: 15, Role: domain.RoleManager}}}
	store.priceErr = repository.ErrApartmentNotFound
	if _, err := service.Calculate(context.Background(), 10, 15, "1"); !errors.Is(err, repository.ErrApartmentNotFound) {
		t.Fatalf("expected apartment not found, got %v", err)
	}
	store.priceErr, store.price = nil, 0
	if _, err := service.Calculate(context.Background(), 10, 15, "1"); !errors.Is(err, ErrInvalidPrice) {
		t.Fatalf("expected invalid price, got %v", err)
	}
}

func TestOfferAuthorizationManagerOwnDealCreatesAsAuthenticatedActor(t *testing.T) {
	service, _ := newTestOfferService(domain.RoleManager, 1000000)

	calculation, err := service.Calculate(context.Background(), 10, 15, "5")
	if err != nil || calculation.DealID != 10 {
		t.Fatalf("own-deal calculation failed: %#v err=%v", calculation, err)
	}
	created, err := service.Create(context.Background(), "req_owner", 10, 15, "5", "Text")
	if err != nil || created.CreatedBy != 15 {
		t.Fatalf("offer must be created by verified actor 15: %#v err=%v", created, err)
	}
}

func TestOfferAuthorizationManagerCannotUseAnotherManagersDeal(t *testing.T) {
	service, store := newTestOfferService(domain.RoleManager, 1000000)
	service.deals = &fakeOfferDealReader{deal: &domain.Deal{ID: 10, EmployeeID: 2, ApartmentID: 30}}

	if _, err := service.Calculate(context.Background(), 10, 15, "5"); !errors.Is(err, ErrOfferForbidden) {
		t.Fatalf("expected calculate forbidden, got %v", err)
	}
	if _, err := service.Create(context.Background(), "req_foreign", 10, 15, "5", "Text"); !errors.Is(err, ErrOfferForbidden) {
		t.Fatalf("expected create forbidden, got %v", err)
	}
	if len(store.offers) != 0 {
		t.Fatalf("foreign manager created an offer: %#v", store.offers)
	}
}

func TestOfferAuthorizationSupervisorCanUseAnyDeal(t *testing.T) {
	service, _ := newTestOfferService(domain.RoleSupervisor, 1000000)
	service.deals = &fakeOfferDealReader{deal: &domain.Deal{ID: 10, EmployeeID: 2, ApartmentID: 30}}

	created, err := service.Create(context.Background(), "req_supervisor", 10, 15, "5", "Text")
	if err != nil || created.CreatedBy != 15 {
		t.Fatalf("supervisor create failed: %#v err=%v", created, err)
	}
}

func TestOfferAuthorizationClientIsForbidden(t *testing.T) {
	service, store := newTestOfferService(domain.RoleUser, 1000000)

	if _, err := service.Calculate(context.Background(), 10, 15, "5"); !errors.Is(err, ErrOfferForbidden) {
		t.Fatalf("expected client calculate forbidden, got %v", err)
	}
	if _, err := service.Create(context.Background(), "req_client", 10, 15, "5", "Text"); !errors.Is(err, ErrOfferForbidden) {
		t.Fatalf("expected client create forbidden, got %v", err)
	}
	if len(store.offers) != 0 {
		t.Fatalf("client created an offer: %#v", store.offers)
	}
}

func TestOfferCreateIdempotencyCannotSubstituteActor(t *testing.T) {
	service, _ := newTestOfferService(domain.RoleSupervisor, 1000000)
	created, err := service.Create(context.Background(), "req_actor", 10, 15, "5", "Text")
	if err != nil {
		t.Fatal(err)
	}
	service.users = &fakeOfferUserReader{users: map[int]*domain.User{1: {ID: 1, Role: domain.RoleSupervisor}}}

	if _, err := service.Create(context.Background(), "req_actor", 10, 1, "5", "Text"); !errors.Is(err, ErrOfferForbidden) {
		t.Fatalf("expected substituted actor to be forbidden, got %v", err)
	}
	if created.CreatedBy != 15 {
		t.Fatalf("stored creator changed: %#v", created)
	}
}

func TestOfferCreateRecalculatesStatusAndIsIdempotent(t *testing.T) {
	service, store := newTestOfferService(domain.RoleManager, 1000000)
	approved, err := service.Create(context.Background(), "req_approved", 10, 15, "5", "Offer text")
	if err != nil || approved.Status != domain.OfferStatusApproved || approved.ApprovalRequired {
		t.Fatalf("unexpected approved offer: %#v err=%v", approved, err)
	}
	draft, err := service.Create(context.Background(), "req_draft", 10, 15, "7", "Offer text")
	if err != nil || draft.Status != domain.OfferStatusDraft || !draft.ApprovalRequired || draft.FinalPrice != 930000 {
		t.Fatalf("unexpected draft offer: %#v err=%v", draft, err)
	}
	repeated, err := service.Create(context.Background(), "req_draft", 10, 15, "1", "Changed input")
	if err != nil || repeated.ID != draft.ID || len(store.offers) != 2 || repeated.DiscountPercent != "7" {
		t.Fatalf("idempotent create failed: %#v err=%v", repeated, err)
	}
}

func TestOfferRequestApprovalTransitionsAndRepeats(t *testing.T) {
	service, _ := newTestOfferService(domain.RoleManager, 1000000)
	draft, _ := service.Create(context.Background(), "req", 10, 15, "7", "Text")
	pending, err := service.RequestApproval(context.Background(), draft.ID, 15)
	if err != nil || pending.Status != domain.OfferStatusPendingApproval {
		t.Fatalf("transition failed: %#v err=%v", pending, err)
	}
	repeated, err := service.RequestApproval(context.Background(), draft.ID, 15)
	if err != nil || repeated.Status != domain.OfferStatusPendingApproval {
		t.Fatalf("idempotent request failed: %#v err=%v", repeated, err)
	}
}

func TestOfferRequestApprovalRejectsInvalidStateMissingAndForbidden(t *testing.T) {
	service, store := newTestOfferService(domain.RoleManager, 1000000)
	approved, _ := service.Create(context.Background(), "approved", 10, 15, "1", "Text")
	if _, err := service.RequestApproval(context.Background(), approved.ID, 15); !errors.Is(err, ErrInvalidOfferState) {
		t.Fatalf("expected invalid state, got %v", err)
	}
	if _, err := service.RequestApproval(context.Background(), 999, 15); !errors.Is(err, repository.ErrOfferNotFound) {
		t.Fatalf("expected offer not found, got %v", err)
	}
	draft, _ := service.Create(context.Background(), "draft", 10, 15, "7", "Text")
	service.users = &fakeOfferUserReader{users: map[int]*domain.User{16: {ID: 16, Role: domain.RoleManager}}}
	if _, err := service.RequestApproval(context.Background(), draft.ID, 16); !errors.Is(err, ErrOfferForbidden) {
		t.Fatalf("expected forbidden, got %v", err)
	}
	store.offers[draft.ID].Status = domain.OfferStatusRejected
	service.users = &fakeOfferUserReader{users: map[int]*domain.User{15: {ID: 15, Role: domain.RoleManager}}}
	if _, err := service.RequestApproval(context.Background(), draft.ID, 15); !errors.Is(err, ErrInvalidOfferState) {
		t.Fatalf("expected rejected state error, got %v", err)
	}
}

func TestOfferRequestApprovalChecksDealOwnershipAndSupervisorOverride(t *testing.T) {
	service, store := newTestOfferService(domain.RoleManager, 1000000)
	draft, err := service.Create(context.Background(), "approval_owner", 10, 15, "7", "Text")
	if err != nil {
		t.Fatal(err)
	}

	service.deals = &fakeOfferDealReader{deal: &domain.Deal{ID: 10, EmployeeID: 2, ApartmentID: 30}}
	if _, err := service.RequestApproval(context.Background(), draft.ID, 15); !errors.Is(err, ErrOfferForbidden) {
		t.Fatalf("manager must not request approval for another manager's deal: %v", err)
	}
	if store.offers[draft.ID].Status != domain.OfferStatusDraft {
		t.Fatalf("forbidden request changed offer status: %#v", store.offers[draft.ID])
	}

	service.users = &fakeOfferUserReader{users: map[int]*domain.User{16: {ID: 16, Role: domain.RoleSupervisor}}}
	pending, err := service.RequestApproval(context.Background(), draft.ID, 16)
	if err != nil || pending.Status != domain.OfferStatusPendingApproval {
		t.Fatalf("supervisor approval request failed: %#v err=%v", pending, err)
	}
}

func TestOfferRequestApprovalRejectsClient(t *testing.T) {
	service, store := newTestOfferService(domain.RoleManager, 1000000)
	draft, err := service.Create(context.Background(), "approval_client", 10, 15, "7", "Text")
	if err != nil {
		t.Fatal(err)
	}
	service.users = &fakeOfferUserReader{users: map[int]*domain.User{20: {ID: 20, Role: domain.RoleUser}}}

	if _, err := service.RequestApproval(context.Background(), draft.ID, 20); !errors.Is(err, ErrOfferForbidden) {
		t.Fatalf("expected client approval request forbidden, got %v", err)
	}
	if store.offers[draft.ID].Status != domain.OfferStatusDraft {
		t.Fatalf("client changed offer status: %#v", store.offers[draft.ID])
	}
}

func TestOfferGetFoundAndNotFound(t *testing.T) {
	service, _ := newTestOfferService(domain.RoleManager, 1000000)
	created, _ := service.Create(context.Background(), "req", 10, 15, "0", "Text")
	got, err := service.Get(context.Background(), created.ID)
	if err != nil || got.ID != created.ID {
		t.Fatalf("get failed: %#v err=%v", got, err)
	}
	if _, err := service.Get(context.Background(), 999); !errors.Is(err, repository.ErrOfferNotFound) {
		t.Fatalf("expected not found, got %v", err)
	}
}

func TestOfferListAndDecisionRespectRoles(t *testing.T) {
	service, _ := newTestOfferService(domain.RoleManager, 1000000)
	draft, err := service.Create(context.Background(), "decision", 10, 15, "7", "Text")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := service.RequestApproval(context.Background(), draft.ID, 15); err != nil {
		t.Fatal(err)
	}
	items, err := service.ListForActor(context.Background(), &domain.User{ID: 15, Role: domain.RoleManager})
	if err != nil || len(items) != 1 {
		t.Fatalf("unexpected manager list: %#v err=%v", items, err)
	}
	if _, err := service.Decide(context.Background(), draft.ID, &domain.User{ID: 15, Role: domain.RoleManager}, true, ""); !errors.Is(err, ErrOfferForbidden) {
		t.Fatalf("manager decision must be forbidden: %v", err)
	}
	approved, err := service.Decide(context.Background(), draft.ID, &domain.User{ID: 20, Role: domain.RoleSupervisor}, true, "")
	if err != nil || approved.Status != domain.OfferStatusApproved || approved.ApprovedBy == nil || *approved.ApprovedBy != 20 {
		t.Fatalf("unexpected supervisor decision: %#v err=%v", approved, err)
	}
}

func TestPercentPolicyValidation(t *testing.T) {
	if _, err := percentStringToBasisPoints("7.25"); err != nil {
		t.Fatal(err)
	}
	if _, err := NewOfferService(&fakeOfferDealReader{}, &fakeOfferUserReader{}, newFakeOfferStore(1), -1, 15); err == nil {
		t.Fatal("expected invalid policy")
	}
	if _, err := NewOfferService(&fakeOfferDealReader{}, &fakeOfferUserReader{}, newFakeOfferStore(1), 10, 5); err == nil {
		t.Fatal("expected supervisor policy lower than manager to fail")
	}
}
