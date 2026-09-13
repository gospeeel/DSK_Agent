package handler

import (
	"testing"

	"backend/internal/domain"
)

func intPointer(value int) *int { return &value }

func TestChatSessionAccessByRole(t *testing.T) {
	assigned := &domain.ChatSession{UserID: intPointer(7), EmployeeID: intPointer(11), ApartmentID: intPointer(101)}
	unassignedApartment := &domain.ChatSession{UserID: intPointer(7), ApartmentID: intPointer(101)}
	unassignedGeneral := &domain.ChatSession{UserID: intPointer(7), ApartmentID: nil}

	cases := []struct {
		name   string
		user   *domain.User
		read   bool
		manage bool
	}{
		{"client owns session", &domain.User{ID: 7, Role: domain.RoleUser}, true, false},
		{"other client denied", &domain.User{ID: 8, Role: domain.RoleUser}, false, false},
		{"assigned manager", &domain.User{ID: 11, Role: domain.RoleManager}, true, true},
		{"other manager denied", &domain.User{ID: 12, Role: domain.RoleManager}, false, false},
		{"supervisor", &domain.User{ID: 20, Role: domain.RoleSupervisor}, true, true},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			if got := canReadSession(test.user, assigned); got != test.read {
				t.Fatalf("read=%v, want %v", got, test.read)
			}
			if got := canManageSession(test.user, assigned); got != test.manage {
				t.Fatalf("manage=%v, want %v", got, test.manage)
			}
		})
	}
	if !canReadSession(&domain.User{ID: 12, Role: domain.RoleManager}, unassignedApartment) {
		t.Fatal("unassigned apartment session must remain visible in the manager queue")
	}
	if canManageSession(&domain.User{ID: 12, Role: domain.RoleManager}, unassignedApartment) {
		t.Fatal("manager must take an unassigned apartment session before writing")
	}
	if !canManageSession(&domain.User{ID: 12, Role: domain.RoleManager}, unassignedGeneral) {
		t.Fatal("manager must be able to answer general questions directly without taking")
	}
}
