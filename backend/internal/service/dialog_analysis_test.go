package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"backend/internal/domain"
	"backend/internal/repository"
)

type fakeDialogDealReader struct {
	deal *domain.Deal
	err  error
}

func (f *fakeDialogDealReader) GetDealByID(context.Context, int) (*domain.Deal, error) {
	return f.deal, f.err
}

type fakeDialogMessageReader struct {
	messages []*domain.Message
	err      error
	session  int
}

func (f *fakeDialogMessageReader) GetMessagesBySessionID(_ context.Context, sessionID int) ([]*domain.Message, error) {
	f.session = sessionID
	return f.messages, f.err
}

func newTestDialogAnalysisService(deal *domain.Deal, messages []*domain.Message) *dialogAnalysisService {
	return &dialogAnalysisService{
		deals:    &fakeDialogDealReader{deal: deal},
		messages: &fakeDialogMessageReader{messages: messages},
	}
}

func TestGetDealMessagesMapsDirectionsSortsAndLimits(t *testing.T) {
	sessionID := 7
	base := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)
	reader := &fakeDialogMessageReader{messages: []*domain.Message{
		{ID: 4, SenderType: "ai", Content: "skip", SendedAt: base.Add(4 * time.Minute)},
		{ID: 3, SenderType: domain.SenderTypeClient, Content: "third", SendedAt: base.Add(3 * time.Minute)},
		{ID: 1, SenderType: domain.SenderTypeClient, Content: "first", SendedAt: base.Add(time.Minute)},
		{ID: 2, SenderType: domain.SenderTypeManager, Content: "second", SendedAt: base.Add(2 * time.Minute)},
	}}
	service := &dialogAnalysisService{
		deals:    &fakeDialogDealReader{deal: &domain.Deal{ID: 10, ChatSessionID: &sessionID}},
		messages: reader,
	}

	got, err := service.GetDealMessages(context.Background(), 10, 2)
	if err != nil {
		t.Fatal(err)
	}
	if reader.session != sessionID {
		t.Fatalf("used session %d, want %d", reader.session, sessionID)
	}
	if len(got) != 2 || got[0].ID != 2 || got[1].ID != 3 {
		t.Fatalf("unexpected chronological limited result: %#v", got)
	}
	if got[0].Direction != "manager_to_client" || got[1].Direction != "client_to_manager" {
		t.Fatalf("unexpected direction mapping: %#v", got)
	}
	if got[0].Body != "second" {
		t.Fatalf("content was not mapped to body: %#v", got[0])
	}
}

func TestGetDealMessagesEmptyForUnlinkedOrEmptyDeal(t *testing.T) {
	service := newTestDialogAnalysisService(&domain.Deal{ID: 10}, nil)
	got, err := service.GetDealMessages(context.Background(), 10, 30)
	if err != nil || got == nil || len(got) != 0 {
		t.Fatalf("expected non-nil empty messages, got %#v, err=%v", got, err)
	}

	sessionID := 7
	service = newTestDialogAnalysisService(&domain.Deal{ID: 10, ChatSessionID: &sessionID}, []*domain.Message{})
	got, err = service.GetDealMessages(context.Background(), 10, 30)
	if err != nil || got == nil || len(got) != 0 {
		t.Fatalf("expected non-nil empty messages, got %#v, err=%v", got, err)
	}
}

func TestGetDealMessagesReturnsDealNotFound(t *testing.T) {
	service := &dialogAnalysisService{
		deals:    &fakeDialogDealReader{err: repository.ErrDealNotFound},
		messages: &fakeDialogMessageReader{},
	}
	_, err := service.GetDealMessages(context.Background(), 999, 30)
	if !errors.Is(err, repository.ErrDealNotFound) {
		t.Fatalf("expected ErrDealNotFound, got %v", err)
	}
}
