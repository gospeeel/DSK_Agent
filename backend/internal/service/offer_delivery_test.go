package service

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain"
)

type fakeOfferDeliveryRepository struct {
	stored bool
	status string
}

func (f *fakeOfferDeliveryRepository) SaveDocument(context.Context, int, []byte, string) error {
	f.stored = true
	return nil
}
func (*fakeOfferDeliveryRepository) CreateDelivery(context.Context, int, string) (*domain.OfferDelivery, error) {
	return &domain.OfferDelivery{ID: 9, OfferID: 4, Status: "pending"}, nil
}
func (f *fakeOfferDeliveryRepository) FinishDelivery(_ context.Context, _ int, sent bool, message string) (*domain.OfferDelivery, error) {
	if sent {
		f.status = "sent"
	} else {
		f.status = "failed"
	}
	return &domain.OfferDelivery{ID: 9, Status: f.status}, nil
}

type fakeOfferAttachmentSender struct{ err error }

func (f fakeOfferAttachmentSender) Send(string, string, string, string, []byte) error { return f.err }

func TestOfferDeliveryPersistsPDFAndConfirmedStatus(t *testing.T) {
	repository := new(fakeOfferDeliveryRepository)
	service := NewOfferDeliveryService(repository, &fakeOfferDealReader{deal: &domain.Deal{UserID: 8}}, &fakeOfferUserReader{users: map[int]*domain.User{8: {ID: 8, Name: "Клиент", Email: "client@example.test"}}}, fakeOfferAttachmentSender{})
	result, err := service.Send(context.Background(), &domain.Offer{ID: 4, Status: domain.OfferStatusApproved}, []byte("pdf"))
	if err != nil || !repository.stored || result.Status != "sent" {
		t.Fatalf("unexpected delivery: %#v err=%v", result, err)
	}
}

func TestOfferDeliveryRecordsFailure(t *testing.T) {
	repository := new(fakeOfferDeliveryRepository)
	want := errors.New("smtp failed")
	service := NewOfferDeliveryService(repository, &fakeOfferDealReader{deal: &domain.Deal{UserID: 8}}, &fakeOfferUserReader{users: map[int]*domain.User{8: {ID: 8, Email: "client@example.test"}}}, fakeOfferAttachmentSender{err: want})
	result, err := service.Send(context.Background(), &domain.Offer{ID: 4, Status: domain.OfferStatusApproved}, []byte("pdf"))
	if !errors.Is(err, want) || result.Status != "failed" {
		t.Fatalf("unexpected failed delivery: %#v err=%v", result, err)
	}
}
