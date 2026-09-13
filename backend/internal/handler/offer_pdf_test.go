package handler

import (
	"bytes"
	"testing"
	"time"

	"backend/internal/domain"
)

func TestOfferPDFModelIncludesApartmentExtrasAndTerms(t *testing.T) {
	parkingID, storageID := 41, 42
	parkingNumber, storageNumber := "P-041", "K-018"
	parkingArea, storageArea := 13.5, 4.8
	readiness := 68
	createdAt := time.Date(2026, time.September, 13, 10, 30, 0, 0, time.UTC)
	document := &domain.OfferDocument{
		Offer: &domain.Offer{
			ID: 501, Version: 2, DealID: 101, BasePrice: 15_930_000,
			DiscountPercent: "3", FinalPrice: 15_452_100,
			ParkingUnitID: &parkingID, ParkingNumber: &parkingNumber, ParkingPrice: 1_250_000,
			StorageUnitID: &storageID, StorageNumber: &storageNumber, StoragePrice: 480_000,
			GeneratedText: "Индивидуальные условия для клиента.", CreatedAt: createdAt,
		},
		ClientName: "Анна Смирнова", ManagerName: "Михаил Петров",
		ApartmentID: 3001, ApartmentNumber: "181", ApartmentRooms: 2,
		ApartmentFloor: 10, ApartmentArea: 62.1, ApartmentFinishing: domain.FinishingTypeWhiteBox,
		ComplexName: "Квартал «Северный»", BuildingAddress: "Корпус 2",
		ReadinessPercent: &readiness, ParkingArea: &parkingArea, StorageArea: &storageArea,
	}

	model := newOfferPDFModel(document)
	if model.DocumentDate != "13 сентября 2026" || model.Finishing != "White box" {
		t.Fatalf("unexpected document metadata: %#v", model)
	}
	if len(model.Lines) != 3 {
		t.Fatalf("expected apartment and two optional units, got %#v", model.Lines)
	}
	if model.Lines[0].Name != "Квартира №181" || model.Lines[0].Price != 14_200_000 {
		t.Fatalf("unexpected apartment line: %#v", model.Lines[0])
	}
	if model.Lines[1].Name != "Машино-место P-041" || model.Lines[1].Description != "13,5 м²" {
		t.Fatalf("unexpected parking line: %#v", model.Lines[1])
	}
	if model.Lines[2].Name != "Кладовая K-018" || model.Lines[2].Description != "4,8 м²" {
		t.Fatalf("unexpected storage line: %#v", model.Lines[2])
	}
	if model.Discount != 477_900 || len(model.Conditions) < 4 {
		t.Fatalf("financial terms are incomplete: %#v", model)
	}

	pdf, err := buildOfferPDF(document)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.HasPrefix(pdf, []byte("%PDF-")) || len(pdf) < 10_000 {
		t.Fatalf("expected a complete PDF with embedded Cyrillic font, got %d bytes", len(pdf))
	}
}

func TestOfferPDFHidesUnconfirmedDeliveryDateWhenScheduleShifted(t *testing.T) {
	shift := 9
	forecast := time.Date(2027, time.April, 20, 0, 0, 0, 0, time.UTC)
	document := &domain.OfferDocument{
		Offer:        &domain.Offer{BasePrice: 1, FinalPrice: 1, CreatedAt: time.Now()},
		ForecastDate: &forecast, DeliveryShiftDays: &shift,
	}
	model := newOfferPDFModel(document)
	if model.Delivery != "Срок передачи определяется договором долевого участия" {
		t.Fatalf("unconfirmed exact date leaked into PDF: %q", model.Delivery)
	}
}
