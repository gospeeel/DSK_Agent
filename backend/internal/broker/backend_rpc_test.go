package broker

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"backend/internal/domain"
	"backend/internal/repository"
)

type fakeDealReader struct {
	deal *domain.Deal
	err  error
	id   int
}

func (f *fakeDealReader) GetDealByID(_ context.Context, id int) (*domain.Deal, error) {
	f.id = id
	return f.deal, f.err
}

type fakeClientReader struct {
	client *domain.User
	err    error
}

func (f *fakeClientReader) GetUser(_ context.Context, _ int) (*domain.User, error) {
	return f.client, f.err
}

type fakeApartmentReader struct {
	apartment *domain.Apartment
	err       error
}

type fakeDealMessagesReader struct {
	messages []domain.DealDialogMessage
	err      error
	dealID   int
	limit    int
}

func (f *fakeDealMessagesReader) GetDealMessages(_ context.Context, dealID, limit int) ([]domain.DealDialogMessage, error) {
	f.dealID, f.limit = dealID, limit
	return f.messages, f.err
}

type fakeClientPreferencesWriter struct {
	values map[int]*domain.ClientPreferences
	err    error
	calls  int
}

type fakeConstructionReader struct {
	building    *domain.Building
	complex     *domain.ResidentialComplex
	progress    []*domain.ConstructionProgress
	buildingErr error
	complexErr  error
	progressErr error
}

func (f *fakeConstructionReader) GetBuildingByID(context.Context, int) (*domain.Building, error) {
	return f.building, f.buildingErr
}

func (f *fakeConstructionReader) GetResidentialComplexByID(context.Context, int) (*domain.ResidentialComplex, error) {
	return f.complex, f.complexErr
}

func (f *fakeConstructionReader) GetProgressByBuildingID(context.Context, int) ([]*domain.ConstructionProgress, error) {
	return f.progress, f.progressErr
}

type fakeDealsByBuildingReader struct {
	deals []*domain.Deal
	err   error
}

func (f *fakeDealsByBuildingReader) GetDealsByBuildingID(context.Context, int) ([]*domain.Deal, error) {
	return f.deals, f.err
}

type fakeCompetitorReader struct {
	items []*domain.Competitor
	err   error
}

func (f *fakeCompetitorReader) ListByDistrict(context.Context, string) ([]*domain.Competitor, error) {
	return f.items, f.err
}

type fakeRecommendationWriter struct {
	item      *domain.Recommendation
	err       error
	requestID string
}

type fakeOfferWorkflow struct {
	calculation *domain.OfferCalculation
	offer       *domain.Offer
	err         error
	requestID   string
	dealID      int
	userID      int
	discount    string
}

func (f *fakeOfferWorkflow) Calculate(_ context.Context, dealID, userID int, discount string) (*domain.OfferCalculation, error) {
	f.dealID, f.userID, f.discount = dealID, userID, discount
	return f.calculation, f.err
}

func (f *fakeOfferWorkflow) Create(_ context.Context, requestID string, dealID, userID int, discount, _ string) (*domain.Offer, error) {
	f.requestID, f.dealID, f.userID, f.discount = requestID, dealID, userID, discount
	return f.offer, f.err
}

func (f *fakeOfferWorkflow) RequestApproval(_ context.Context, offerID, userID int) (*domain.Offer, error) {
	f.userID = userID
	if f.offer != nil {
		f.offer.ID = offerID
	}
	return f.offer, f.err
}

func (f *fakeOfferWorkflow) Get(_ context.Context, offerID int) (*domain.Offer, error) {
	if f.offer != nil {
		f.offer.ID = offerID
	}
	return f.offer, f.err
}

func (f *fakeRecommendationWriter) Create(_ context.Context, requestID string, recommendation *domain.Recommendation) (*domain.Recommendation, error) {
	f.requestID = requestID
	if f.item == nil {
		f.item = recommendation
		f.item.ID = 91
	}
	return f.item, f.err
}

func defaultConstructionReader() *fakeConstructionReader {
	return &fakeConstructionReader{
		building: &domain.Building{ID: 40, ResidentialComplexID: 50, District: "Central"},
		complex:  &domain.ResidentialComplex{ID: 50, Name: "Alpha"},
		progress: []*domain.ConstructionProgress{},
	}
}

func (f *fakeClientPreferencesWriter) UpdateClientPreferences(
	_ context.Context,
	id int,
	budgetMax *int64,
	preferences map[string]any,
) (*domain.ClientPreferences, error) {
	f.calls++
	if f.err != nil {
		return nil, f.err
	}
	current := f.values[id]
	if current == nil {
		current = &domain.ClientPreferences{ClientID: id, Preferences: map[string]any{}}
		f.values[id] = current
	}
	if budgetMax != nil {
		value := *budgetMax
		current.BudgetMax = &value
	}
	for key, value := range preferences {
		current.Preferences[key] = value
	}
	return current, nil
}

func (f *fakeApartmentReader) GetApartmentByID(_ context.Context, _ int) (*domain.Apartment, error) {
	return f.apartment, f.err
}

func testDispatcher(deals *fakeDealReader) *BackendRPCDispatcher {
	return NewBackendRPCDispatcher(
		deals,
		&fakeClientReader{client: &domain.User{ID: 15, Name: "Manager"}},
		&fakeApartmentReader{apartment: &domain.Apartment{ID: 30, BuildingID: 40}},
		&fakeDealMessagesReader{messages: []domain.DealDialogMessage{}},
		&fakeClientPreferencesWriter{values: map[int]*domain.ClientPreferences{}},
		defaultConstructionReader(),
		&fakeDealsByBuildingReader{deals: []*domain.Deal{}},
		&fakeCompetitorReader{items: []*domain.Competitor{}},
		&fakeRecommendationWriter{},
		&fakeOfferWorkflow{},
	)
}

func rpcBody(requestID, action string, payload any) []byte {
	body, err := json.Marshal(map[string]any{
		"request_id": requestID,
		"action":     action,
		"payload":    payload,
	})
	if err != nil {
		panic(err)
	}
	return body
}

func TestDispatchDealGetPreservesRequestIDAndIntegerID(t *testing.T) {
	deals := &fakeDealReader{deal: &domain.Deal{
		ID:          10,
		UserID:      20,
		ApartmentID: 30,
		Status:      domain.DealStatusPending,
	}}
	dispatcher := testDispatcher(deals)

	response := dispatcher.Dispatch(
		context.Background(),
		DealGetRoutingKey,
		rpcBody("req_backend_123", "deal.get", map[string]any{"deal_id": 10}),
	)

	if !response.Success {
		t.Fatalf("expected success response, got error: %#v", response.Error)
	}
	if response.RequestID != "req_backend_123" {
		t.Fatalf("request_id changed: %q", response.RequestID)
	}
	if deals.id != 10 {
		t.Fatalf("business ID was not passed as integer: %d", deals.id)
	}
	data, ok := response.Data.(dealRPCData)
	if !ok || data.ID != 10 || data.ClientID != 20 || data.ApartmentID != 30 {
		t.Fatalf("unexpected response data: %#v", response.Data)
	}
}

func TestDispatchRejectsActionRoutingKeyMismatch(t *testing.T) {
	dispatcher := testDispatcher(&fakeDealReader{})
	response := dispatcher.Dispatch(
		context.Background(),
		DealGetRoutingKey,
		rpcBody("req_1", "client.get", map[string]any{"deal_id": 10}),
	)

	if response.Success || response.Error == nil || response.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("expected VALIDATION_ERROR, got %#v", response)
	}
}

func TestDispatchRejectsStringBusinessID(t *testing.T) {
	dispatcher := testDispatcher(&fakeDealReader{})
	response := dispatcher.Dispatch(
		context.Background(),
		DealGetRoutingKey,
		rpcBody("req_1", "deal.get", map[string]any{"deal_id": "10"}),
	)

	if response.Success || response.Error == nil || response.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("expected VALIDATION_ERROR, got %#v", response)
	}
}

func TestDispatchMapsNotFoundError(t *testing.T) {
	dispatcher := testDispatcher(&fakeDealReader{err: repository.ErrDealNotFound})
	response := dispatcher.Dispatch(
		context.Background(),
		DealGetRoutingKey,
		rpcBody("req_404", "deal.get", map[string]any{"deal_id": 999}),
	)

	if response.Success || response.Error == nil || response.Error.Code != "DEAL_NOT_FOUND" {
		t.Fatalf("expected DEAL_NOT_FOUND, got %#v", response)
	}
	if response.RequestID != "req_404" {
		t.Fatalf("request_id changed: %q", response.RequestID)
	}
}

func TestDispatchClientGetSuccess(t *testing.T) {
	dispatcher := testDispatcher(&fakeDealReader{})
	response := dispatcher.Dispatch(
		context.Background(),
		ClientGetRoutingKey,
		rpcBody("req_client", "client.get", map[string]any{"client_id": 15}),
	)

	data, ok := response.Data.(clientRPCData)
	if !response.Success || !ok || data.ID != 15 || data.FullName != "Manager" {
		t.Fatalf("unexpected client response: %#v", response)
	}
}

func TestDispatchApartmentGetSuccess(t *testing.T) {
	dispatcher := testDispatcher(&fakeDealReader{})
	response := dispatcher.Dispatch(
		context.Background(),
		ApartmentGetRoutingKey,
		rpcBody("req_apartment", "apartment.get", map[string]any{"apartment_id": 30}),
	)

	data, ok := response.Data.(apartmentRPCData)
	if !response.Success || !ok || data.ID != 30 || data.BuildingID != 40 {
		t.Fatalf("unexpected apartment response: %#v", response)
	}
}

func TestDispatchMapsBackendUnavailable(t *testing.T) {
	dispatcher := testDispatcher(&fakeDealReader{err: context.DeadlineExceeded})
	response := dispatcher.Dispatch(
		context.Background(),
		DealGetRoutingKey,
		rpcBody("req_timeout", "deal.get", map[string]any{"deal_id": 10}),
	)

	if response.Error == nil || response.Error.Code != "BACKEND_UNAVAILABLE" {
		t.Fatalf("expected BACKEND_UNAVAILABLE, got %#v", response)
	}
}

func TestDispatchInvalidJSON(t *testing.T) {
	dispatcher := testDispatcher(&fakeDealReader{})
	response := dispatcher.Dispatch(context.Background(), DealGetRoutingKey, []byte("{invalid"))

	if response.Success || response.Error == nil || response.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("expected VALIDATION_ERROR, got %#v", response)
	}
}

func TestRPCResponsePublishingPreservesCorrelationID(t *testing.T) {
	publishing := newRPCResponsePublishing([]byte(`{"success":true}`), "corr_backend_123")
	if publishing.CorrelationId != "corr_backend_123" {
		t.Fatalf("correlation_id changed: %q", publishing.CorrelationId)
	}
	if publishing.ContentType != "application/json" {
		t.Fatalf("unexpected content type: %q", publishing.ContentType)
	}
}

func TestSupportedRoutingKeysAreExact(t *testing.T) {
	want := map[string]bool{
		"backend.deal.get":                  true,
		"backend.client.get":                true,
		"backend.apartment.get":             true,
		"backend.deal.messages.get":         true,
		"backend.client.update_preferences": true,
		"backend.building.get":              true,
		"backend.competitor.list":           true,
		"backend.construction.events.get":   true,
		"backend.deal.list_by_building":     true,
		"backend.recommendation.create":     true,
		"backend.offer.calculate":           true,
		"backend.offer.create":              true,
		"backend.offer.request_approval":    true,
		"backend.offer.get":                 true,
	}
	for _, routingKey := range supportedBackendRoutingKeys {
		if !want[routingKey] {
			t.Fatalf("unexpected routing key: %s", routingKey)
		}
		delete(want, routingKey)
	}
	if len(want) != 0 {
		t.Fatalf("missing routing keys: %#v", want)
	}
}

func TestDispatchDealMessagesGetSuccessAndEmpty(t *testing.T) {
	messages := &fakeDealMessagesReader{messages: []domain.DealDialogMessage{}}
	dispatcher := NewBackendRPCDispatcher(
		&fakeDealReader{},
		&fakeClientReader{},
		&fakeApartmentReader{},
		messages,
		&fakeClientPreferencesWriter{values: map[int]*domain.ClientPreferences{}},
		defaultConstructionReader(), &fakeDealsByBuildingReader{}, &fakeCompetitorReader{}, &fakeRecommendationWriter{},
		&fakeOfferWorkflow{},
	)
	response := dispatcher.Dispatch(context.Background(), DealMessagesGetRoutingKey,
		rpcBody("req_messages", "deal.messages.get", map[string]any{"deal_id": 10, "limit": 30}))
	data, ok := response.Data.(dealMessagesRPCData)
	if !response.Success || !ok || data.Messages == nil || len(data.Messages) != 0 {
		t.Fatalf("unexpected response: %#v", response)
	}
	if messages.dealID != 10 || messages.limit != 30 {
		t.Fatalf("unexpected call: deal=%d limit=%d", messages.dealID, messages.limit)
	}
}

func TestDispatchDealMessagesMapsDealNotFound(t *testing.T) {
	dispatcher := NewBackendRPCDispatcher(
		&fakeDealReader{}, &fakeClientReader{}, &fakeApartmentReader{},
		&fakeDealMessagesReader{err: repository.ErrDealNotFound},
		&fakeClientPreferencesWriter{values: map[int]*domain.ClientPreferences{}},
		defaultConstructionReader(), &fakeDealsByBuildingReader{}, &fakeCompetitorReader{}, &fakeRecommendationWriter{},
		&fakeOfferWorkflow{},
	)
	response := dispatcher.Dispatch(context.Background(), DealMessagesGetRoutingKey,
		rpcBody("req_messages", "deal.messages.get", map[string]any{"deal_id": 999, "limit": 30}))
	if response.Error == nil || response.Error.Code != "DEAL_NOT_FOUND" {
		t.Fatalf("expected DEAL_NOT_FOUND, got %#v", response)
	}
}

func TestDispatchClientPreferencesPartialRepeatedUpdate(t *testing.T) {
	writer := &fakeClientPreferencesWriter{values: map[int]*domain.ClientPreferences{}}
	dispatcher := NewBackendRPCDispatcher(
		&fakeDealReader{}, &fakeClientReader{}, &fakeApartmentReader{},
		&fakeDealMessagesReader{}, writer,
		defaultConstructionReader(), &fakeDealsByBuildingReader{}, &fakeCompetitorReader{}, &fakeRecommendationWriter{},
		&fakeOfferWorkflow{},
	)
	budget := int64(15000000)
	payload := map[string]any{
		"client_id":   20,
		"budget_max":  budget,
		"preferences": map[string]any{"rooms": 2, "parking": true},
	}
	for i := 0; i < 2; i++ {
		response := dispatcher.Dispatch(context.Background(), ClientUpdatePreferencesRoutingKey,
			rpcBody("req_update", "client.update_preferences", payload))
		data, ok := response.Data.(clientUpdatePreferencesRPCData)
		if !response.Success || !ok || !data.Updated || data.ClientID != 20 {
			t.Fatalf("unexpected update response: %#v", response)
		}
	}
	stored := writer.values[20]
	if writer.calls != 2 || stored.BudgetMax == nil || *stored.BudgetMax != budget || len(stored.Preferences) != 2 {
		t.Fatalf("repeated update was not idempotent: %#v", stored)
	}

	response := dispatcher.Dispatch(context.Background(), ClientUpdatePreferencesRoutingKey,
		rpcBody("req_partial", "client.update_preferences", map[string]any{
			"client_id": 20, "preferences": map[string]any{"floor_min": 7},
		}))
	if !response.Success || len(writer.values[20].Preferences) != 3 {
		t.Fatalf("partial update did not merge: %#v", response)
	}
}

func TestDispatchClientPreferencesNotFoundAndInvalid(t *testing.T) {
	dispatcher := NewBackendRPCDispatcher(
		&fakeDealReader{}, &fakeClientReader{}, &fakeApartmentReader{},
		&fakeDealMessagesReader{},
		&fakeClientPreferencesWriter{values: map[int]*domain.ClientPreferences{}, err: repository.ErrUserNotFound},
		defaultConstructionReader(), &fakeDealsByBuildingReader{}, &fakeCompetitorReader{}, &fakeRecommendationWriter{},
		&fakeOfferWorkflow{},
	)
	notFound := dispatcher.Dispatch(context.Background(), ClientUpdatePreferencesRoutingKey,
		rpcBody("req_missing", "client.update_preferences", map[string]any{
			"client_id": 999, "preferences": map[string]any{"rooms": 2},
		}))
	if notFound.Error == nil || notFound.Error.Code != "CLIENT_NOT_FOUND" {
		t.Fatalf("expected CLIENT_NOT_FOUND, got %#v", notFound)
	}

	invalidPayloads := []any{
		map[string]any{"client_id": 0, "preferences": map[string]any{"rooms": 2}},
		map[string]any{"client_id": 20, "preferences": map[string]any{}},
		map[string]any{"client_id": 20, "budget_max": -1, "preferences": map[string]any{}},
		map[string]any{"client_id": "20", "preferences": map[string]any{"rooms": 2}},
	}
	for _, payload := range invalidPayloads {
		response := dispatcher.Dispatch(context.Background(), ClientUpdatePreferencesRoutingKey,
			rpcBody("req_invalid", "client.update_preferences", payload))
		if response.Error == nil || response.Error.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR for %#v, got %#v", payload, response)
		}
	}
}

func TestInternalErrorsDoNotLeakDetails(t *testing.T) {
	dispatcher := testDispatcher(&fakeDealReader{err: errors.New("database password secret")})
	response := dispatcher.Dispatch(
		context.Background(),
		DealGetRoutingKey,
		rpcBody("req_error", "deal.get", map[string]any{"deal_id": 10}),
	)

	if response.Error == nil || response.Error.Code != "INTERNAL_ERROR" {
		t.Fatalf("expected INTERNAL_ERROR, got %#v", response)
	}
	if response.Error.Message != "Backend operation failed" {
		t.Fatalf("internal detail leaked: %q", response.Error.Message)
	}
}
