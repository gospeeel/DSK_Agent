package broker

import (
	"context"
	"errors"
	"testing"
	"time"

	"backend/internal/domain"
	"backend/internal/repository"
)

type workflowTestDependencies struct {
	deals           *fakeDealReader
	construction    *fakeConstructionReader
	dealsByBuilding *fakeDealsByBuildingReader
	competitors     *fakeCompetitorReader
	recommendations *fakeRecommendationWriter
	offers          *fakeOfferWorkflow
}

func newWorkflowDispatcher(deps workflowTestDependencies) *BackendRPCDispatcher {
	if deps.deals == nil {
		deps.deals = &fakeDealReader{deal: &domain.Deal{ID: 10}}
	}
	if deps.construction == nil {
		deps.construction = defaultConstructionReader()
	}
	if deps.dealsByBuilding == nil {
		deps.dealsByBuilding = &fakeDealsByBuildingReader{deals: []*domain.Deal{}}
	}
	if deps.competitors == nil {
		deps.competitors = &fakeCompetitorReader{items: []*domain.Competitor{}}
	}
	if deps.recommendations == nil {
		deps.recommendations = &fakeRecommendationWriter{}
	}
	if deps.offers == nil {
		deps.offers = &fakeOfferWorkflow{}
	}
	return NewBackendRPCDispatcher(
		deps.deals, &fakeClientReader{}, &fakeApartmentReader{},
		&fakeDealMessagesReader{},
		&fakeClientPreferencesWriter{values: map[int]*domain.ClientPreferences{}},
		deps.construction, deps.dealsByBuilding, deps.competitors, deps.recommendations,
		deps.offers,
	)
}

func TestBuildingGetReturnsOnlyFactualFields(t *testing.T) {
	planned := time.Date(2027, 6, 1, 0, 0, 0, 0, time.UTC)
	dispatcher := newWorkflowDispatcher(workflowTestDependencies{
		construction: &fakeConstructionReader{
			building: &domain.Building{ID: 40, ResidentialComplexID: 50, District: "Central", PlannedDate: &planned},
			complex:  &domain.ResidentialComplex{ID: 50, Name: "Alpha"},
		},
	})
	response := dispatcher.Dispatch(context.Background(), BuildingGetRoutingKey,
		rpcBody("req_building", "building.get", map[string]any{"building_id": 40}))
	data, ok := response.Data.(buildingRPCData)
	if !response.Success || !ok || data.ID != 40 || data.Name != "Alpha" || data.District != "Central" || data.PlannedDelivery == nil || *data.PlannedDelivery != "2027-06-01" {
		t.Fatalf("unexpected building response: %#v", response)
	}
	if response.RequestID != "req_building" {
		t.Fatalf("request_id changed: %q", response.RequestID)
	}
}

func TestBuildingGetValidationNotFoundAndIncomplete(t *testing.T) {
	cases := []struct {
		name         string
		payload      any
		construction *fakeConstructionReader
		code         string
	}{
		{"invalid", map[string]any{"building_id": "40"}, defaultConstructionReader(), "VALIDATION_ERROR"},
		{"not found", map[string]any{"building_id": 999}, &fakeConstructionReader{buildingErr: repository.ErrBuildingNotFound}, "BUILDING_NOT_FOUND"},
		{"no district", map[string]any{"building_id": 40}, &fakeConstructionReader{building: &domain.Building{ID: 40}}, "BUILDING_DATA_INCOMPLETE"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			response := newWorkflowDispatcher(workflowTestDependencies{construction: tc.construction}).Dispatch(
				context.Background(), BuildingGetRoutingKey, rpcBody("req", "building.get", tc.payload))
			if response.Error == nil || response.Error.Code != tc.code {
				t.Fatalf("want %s, got %#v", tc.code, response)
			}
		})
	}
}

func TestCompetitorListSuccessValidationAndError(t *testing.T) {
	reader := &fakeCompetitorReader{items: []*domain.Competitor{{ID: 1, ProjectName: "Beta", District: "Central"}}}
	dispatcher := newWorkflowDispatcher(workflowTestDependencies{competitors: reader})
	response := dispatcher.Dispatch(context.Background(), CompetitorListRoutingKey,
		rpcBody("req_comp", "competitor.list", map[string]any{"district": " Central "}))
	data, ok := response.Data.(competitorListRPCData)
	if !response.Success || !ok || len(data.Competitors) != 1 || response.RequestID != "req_comp" {
		t.Fatalf("unexpected competitor response: %#v", response)
	}
	invalid := dispatcher.Dispatch(context.Background(), CompetitorListRoutingKey,
		rpcBody("req", "competitor.list", map[string]any{"district": " "}))
	if invalid.Error == nil || invalid.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("expected validation error, got %#v", invalid)
	}
	failing := newWorkflowDispatcher(workflowTestDependencies{competitors: &fakeCompetitorReader{err: errors.New("db")}})
	failed := failing.Dispatch(context.Background(), CompetitorListRoutingKey,
		rpcBody("req", "competitor.list", map[string]any{"district": "Central"}))
	if failed.Error == nil || failed.Error.Code != "INTERNAL_ERROR" {
		t.Fatalf("expected internal error, got %#v", failed)
	}
}

func TestConstructionEventsUsesExplicitRiskFacts(t *testing.T) {
	risk := "high"
	delay := 45
	completion := 70
	dispatcher := newWorkflowDispatcher(workflowTestDependencies{
		construction: &fakeConstructionReader{
			building: &domain.Building{ID: 40},
			progress: []*domain.ConstructionProgress{
				{StageName: domain.ProgressStageFrame, DelayReason: "Materials delayed", RiskLevel: &risk, DelayDays: &delay, CompletionPercentage: &completion},
				{StageName: domain.ProgressStageRoofing},
			},
		},
	})
	response := dispatcher.Dispatch(context.Background(), ConstructionEventsGetRoutingKey,
		rpcBody("req_events", "construction.events.get", map[string]any{"building_id": 40}))
	data, ok := response.Data.(constructionEventsRPCData)
	if !response.Success || !ok || len(data.Events) != 1 || data.Events[0].RiskLevel != "high" || data.Events[0].DelayDays == nil || *data.Events[0].DelayDays != 45 || data.Events[0].CompletionPercentage == nil || *data.Events[0].CompletionPercentage != 70 {
		t.Fatalf("unexpected events response: %#v", response)
	}
}

func TestConstructionEventsPreservesNullCompletionPercentage(t *testing.T) {
	risk := "medium"
	dispatcher := newWorkflowDispatcher(workflowTestDependencies{
		construction: &fakeConstructionReader{
			building: &domain.Building{ID: 40},
			progress: []*domain.ConstructionProgress{
				{StageName: domain.ProgressStageRoofing, DelayReason: "No progress value", RiskLevel: &risk},
			},
		},
	})
	response := dispatcher.Dispatch(context.Background(), ConstructionEventsGetRoutingKey,
		rpcBody("req_events_null", "construction.events.get", map[string]any{"building_id": 40}))
	data, ok := response.Data.(constructionEventsRPCData)
	if !response.Success || !ok || len(data.Events) != 1 || data.Events[0].CompletionPercentage != nil {
		t.Fatalf("null completion_percentage was not preserved: %#v", response)
	}
}

func TestConstructionEventsValidationNotFoundAndServiceError(t *testing.T) {
	invalid := newWorkflowDispatcher(workflowTestDependencies{}).Dispatch(context.Background(), ConstructionEventsGetRoutingKey,
		rpcBody("req", "construction.events.get", map[string]any{"building_id": "40"}))
	if invalid.Error == nil || invalid.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("expected validation error, got %#v", invalid)
	}
	notFound := newWorkflowDispatcher(workflowTestDependencies{construction: &fakeConstructionReader{buildingErr: repository.ErrBuildingNotFound}}).Dispatch(
		context.Background(), ConstructionEventsGetRoutingKey,
		rpcBody("req", "construction.events.get", map[string]any{"building_id": 999}))
	if notFound.Error == nil || notFound.Error.Code != "BUILDING_NOT_FOUND" {
		t.Fatalf("expected not found, got %#v", notFound)
	}
	serviceError := newWorkflowDispatcher(workflowTestDependencies{construction: &fakeConstructionReader{building: &domain.Building{ID: 40}, progressErr: context.DeadlineExceeded}}).Dispatch(
		context.Background(), ConstructionEventsGetRoutingKey,
		rpcBody("req", "construction.events.get", map[string]any{"building_id": 40}))
	if serviceError.Error == nil || serviceError.Error.Code != "BACKEND_UNAVAILABLE" {
		t.Fatalf("expected unavailable, got %#v", serviceError)
	}
}

func TestDealListByBuildingPreservesBackendStatuses(t *testing.T) {
	dispatcher := newWorkflowDispatcher(workflowTestDependencies{
		dealsByBuilding: &fakeDealsByBuildingReader{deals: []*domain.Deal{
			{ID: 10, Status: domain.DealStatusPending}, {ID: 11, Status: domain.DealStatusCompleted},
		}},
	})
	response := dispatcher.Dispatch(context.Background(), DealListByBuildingRoutingKey,
		rpcBody("req_deals", "deal.list_by_building", map[string]any{"building_id": 40}))
	data, ok := response.Data.(dealsByBuildingRPCData)
	if !response.Success || !ok || len(data.Deals) != 2 || data.Deals[0].Status != domain.DealStatusPending || data.Deals[1].Status != domain.DealStatusCompleted {
		t.Fatalf("unexpected deals response: %#v", response)
	}
}

func TestDealListByBuildingValidationNotFoundAndError(t *testing.T) {
	invalid := newWorkflowDispatcher(workflowTestDependencies{}).Dispatch(context.Background(), DealListByBuildingRoutingKey,
		rpcBody("req", "deal.list_by_building", map[string]any{"building_id": 0}))
	if invalid.Error == nil || invalid.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("expected validation error, got %#v", invalid)
	}
	notFound := newWorkflowDispatcher(workflowTestDependencies{construction: &fakeConstructionReader{buildingErr: repository.ErrBuildingNotFound}}).Dispatch(
		context.Background(), DealListByBuildingRoutingKey,
		rpcBody("req", "deal.list_by_building", map[string]any{"building_id": 999}))
	if notFound.Error == nil || notFound.Error.Code != "BUILDING_NOT_FOUND" {
		t.Fatalf("expected not found, got %#v", notFound)
	}
	failing := newWorkflowDispatcher(workflowTestDependencies{dealsByBuilding: &fakeDealsByBuildingReader{err: errors.New("db")}})
	failed := failing.Dispatch(context.Background(), DealListByBuildingRoutingKey,
		rpcBody("req", "deal.list_by_building", map[string]any{"building_id": 40}))
	if failed.Error == nil || failed.Error.Code != "INTERNAL_ERROR" {
		t.Fatalf("expected internal error, got %#v", failed)
	}
}

func TestRecommendationCreateSuccessRetryKeyValidationAndErrors(t *testing.T) {
	writer := &fakeRecommendationWriter{}
	dispatcher := newWorkflowDispatcher(workflowTestDependencies{recommendations: writer})
	response := dispatcher.Dispatch(context.Background(), RecommendationCreateRoutingKey,
		rpcBody("req_recommendation", "recommendation.create", map[string]any{
			"deal_id": 10, "kind": "construction_risk", "recommendation": "Call the client",
		}))
	data, ok := response.Data.(recommendationCreatedRPCData)
	if !response.Success || !ok || data.RecommendationID != 91 || !data.Created || writer.requestID != "req_recommendation" {
		t.Fatalf("unexpected recommendation response: %#v", response)
	}
	repeated := dispatcher.Dispatch(context.Background(), RecommendationCreateRoutingKey,
		rpcBody("req_recommendation", "recommendation.create", map[string]any{
			"deal_id": 10, "kind": "construction_risk", "recommendation": "Call the client",
		}))
	repeatedData, ok := repeated.Data.(recommendationCreatedRPCData)
	if !repeated.Success || !ok || repeatedData.RecommendationID != data.RecommendationID {
		t.Fatalf("retry did not preserve recommendation: %#v", repeated)
	}

	invalid := dispatcher.Dispatch(context.Background(), RecommendationCreateRoutingKey,
		rpcBody("req", "recommendation.create", map[string]any{"deal_id": "10", "kind": "", "recommendation": ""}))
	if invalid.Error == nil || invalid.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("expected validation error, got %#v", invalid)
	}

	notFound := newWorkflowDispatcher(workflowTestDependencies{deals: &fakeDealReader{err: repository.ErrDealNotFound}}).Dispatch(
		context.Background(), RecommendationCreateRoutingKey,
		rpcBody("req", "recommendation.create", map[string]any{"deal_id": 999, "kind": "construction_risk", "recommendation": "Text"}))
	if notFound.Error == nil || notFound.Error.Code != "DEAL_NOT_FOUND" {
		t.Fatalf("expected deal not found, got %#v", notFound)
	}

	failing := newWorkflowDispatcher(workflowTestDependencies{recommendations: &fakeRecommendationWriter{err: errors.New("db")}})
	failed := failing.Dispatch(context.Background(), RecommendationCreateRoutingKey,
		rpcBody("req", "recommendation.create", map[string]any{"deal_id": 10, "kind": "construction_risk", "recommendation": "Text"}))
	if failed.Error == nil || failed.Error.Code != "INTERNAL_ERROR" {
		t.Fatalf("expected internal error, got %#v", failed)
	}
}
