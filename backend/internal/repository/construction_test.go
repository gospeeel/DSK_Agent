package repository

import (
	"testing"
	"time"

	"backend/internal/domain"
)

type nullableBuildingRow struct{}

func (nullableBuildingRow) Scan(dest ...any) error {
	planned := time.Date(2027, 3, 8, 0, 0, 0, 0, time.UTC)
	*dest[0].(*int) = 1
	*dest[1].(*int) = 1
	*dest[2].(*string) = "г. Москва, ул. Тестовая, д. 10"
	*dest[3].(*string) = "Центральный"
	*dest[4].(**float64) = nil
	*dest[5].(**float64) = nil
	*dest[6].(*int) = 20
	*dest[7].(**time.Time) = &planned
	*dest[8].(**time.Time) = nil
	*dest[9].(*domain.BuildingStatus) = domain.BuildingStatusConstruction
	*dest[10].(*domain.WallMaterial) = domain.WallMaterialMonolith
	return nil
}

func TestScanBuildingAcceptsNullableDatabaseColumnsInQueryOrder(t *testing.T) {
	building, err := scanBuilding(nullableBuildingRow{})
	if err != nil {
		t.Fatalf("scan building: %v", err)
	}
	if building.ID != 1 || building.ResidentialComplexID != 1 {
		t.Fatalf("unexpected identifiers: %#v", building)
	}
	if building.District != "Центральный" || building.FloorsCount != 20 {
		t.Fatalf("columns were scanned out of order: %#v", building)
	}
	if building.Latitude != 0 || building.Longitude != 0 || building.ActualDate != nil {
		t.Fatalf("nullable columns were not handled safely: %#v", building)
	}
	if building.PlannedDate == nil || building.PlannedDate.Format("2006-01-02") != "2027-03-08" {
		t.Fatalf("planned_date was not scanned: %#v", building.PlannedDate)
	}
}
