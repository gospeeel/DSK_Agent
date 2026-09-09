package broker

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain"
	"backend/internal/repository"
	"backend/internal/service"
)

func TestOfferCalculateRPCSuccessAndIntegerIDs(t *testing.T) {
	offers := &fakeOfferWorkflow{calculation: &domain.OfferCalculation{
		DealID: 10, BasePrice: 14200000, DiscountPercent: "7",
		DiscountAmount: 994000, FinalPrice: 13206000,
		MaxAllowedDiscount: "5", RequiresApproval: true,
	}}
	dispatcher := newWorkflowDispatcher(workflowTestDependencies{offers: offers})
	response := dispatcher.Dispatch(context.Background(), OfferCalculateRoutingKey,
		rpcBody("req_offer_calc", "offer.calculate", map[string]any{
			"deal_id": 10, "requested_by": 15, "discount_percent": 7,
		}))
	data, ok := response.Data.(offerCalculationRPCData)
	if !response.Success || !ok || data.FinalPrice != 13206000 || !data.RequiresApproval {
		t.Fatalf("unexpected calculate response: %#v", response)
	}
	if response.RequestID != "req_offer_calc" || offers.dealID != 10 || offers.userID != 15 || offers.discount != "7" {
		t.Fatalf("transport or integer IDs changed: %#v", offers)
	}
}

func TestOfferCreateRPCPreservesRequestID(t *testing.T) {
	offers := &fakeOfferWorkflow{offer: &domain.Offer{ID: 51, Status: domain.OfferStatusDraft}}
	dispatcher := newWorkflowDispatcher(workflowTestDependencies{offers: offers})
	response := dispatcher.Dispatch(context.Background(), OfferCreateRoutingKey,
		rpcBody("req_offer_create", "offer.create", map[string]any{
			"deal_id": 10, "created_by": 15, "discount_percent": 7, "generated_text": "Offer",
		}))
	data, ok := response.Data.(offerCreatedRPCData)
	if !response.Success || !ok || data.OfferID != 51 || data.Status != domain.OfferStatusDraft || offers.requestID != "req_offer_create" {
		t.Fatalf("unexpected create response: %#v", response)
	}
}

func TestOfferRequestApprovalAndGetRPC(t *testing.T) {
	offers := &fakeOfferWorkflow{offer: &domain.Offer{ID: 51, DealID: 10, Status: domain.OfferStatusPendingApproval}}
	dispatcher := newWorkflowDispatcher(workflowTestDependencies{offers: offers})
	approval := dispatcher.Dispatch(context.Background(), OfferRequestApprovalRoutingKey,
		rpcBody("req_approval", "offer.request_approval", map[string]any{"offer_id": 51, "requested_by": 15}))
	approvalData, ok := approval.Data.(offerApprovalRPCData)
	if !approval.Success || !ok || approvalData.Status != domain.OfferStatusPendingApproval {
		t.Fatalf("unexpected approval response: %#v", approval)
	}
	lookup := dispatcher.Dispatch(context.Background(), OfferGetRoutingKey,
		rpcBody("req_get", "offer.get", map[string]any{"offer_id": 51}))
	data, ok := lookup.Data.(offerGetRPCData)
	if !lookup.Success || !ok || data.DealID != 10 {
		t.Fatalf("unexpected get response: %#v", lookup)
	}
}

func TestOfferRPCValidationAndErrors(t *testing.T) {
	cases := []struct {
		name       string
		routingKey string
		action     string
		payload    any
	}{
		{"calculate", OfferCalculateRoutingKey, "offer.calculate", map[string]any{"deal_id": "10", "requested_by": 15, "discount_percent": 1}},
		{"create", OfferCreateRoutingKey, "offer.create", map[string]any{"deal_id": 10, "created_by": 15, "discount_percent": 1, "generated_text": ""}},
		{"approval", OfferRequestApprovalRoutingKey, "offer.request_approval", map[string]any{"offer_id": 0, "requested_by": 15}},
		{"get", OfferGetRoutingKey, "offer.get", map[string]any{"offer_id": "51"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			response := newWorkflowDispatcher(workflowTestDependencies{}).Dispatch(
				context.Background(), tc.routingKey, rpcBody("req", tc.action, tc.payload))
			if response.Error == nil || response.Error.Code != "VALIDATION_ERROR" {
				t.Fatalf("expected validation error, got %#v", response)
			}
		})
	}

	errorCases := []struct {
		err  error
		code string
	}{
		{repository.ErrOfferNotFound, "OFFER_NOT_FOUND"},
		{repository.ErrDealNotFound, "DEAL_NOT_FOUND"},
		{repository.ErrApartmentNotFound, "APARTMENT_NOT_FOUND"},
		{repository.ErrUserNotFound, "USER_NOT_FOUND"},
		{service.ErrInvalidDiscount, "INVALID_DISCOUNT"},
		{service.ErrInvalidOfferState, "INVALID_OFFER_STATE"},
		{service.ErrOfferForbidden, "FORBIDDEN"},
		{context.DeadlineExceeded, "BACKEND_UNAVAILABLE"},
		{errors.New("database secret"), "INTERNAL_ERROR"},
	}
	for _, tc := range errorCases {
		response := newWorkflowDispatcher(workflowTestDependencies{offers: &fakeOfferWorkflow{err: tc.err}}).Dispatch(
			context.Background(), OfferGetRoutingKey, rpcBody("req", "offer.get", map[string]any{"offer_id": 51}))
		if response.Error == nil || response.Error.Code != tc.code {
			t.Fatalf("want %s for %v, got %#v", tc.code, tc.err, response)
		}
	}
}
