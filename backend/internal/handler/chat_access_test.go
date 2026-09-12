package handler

import (
	"testing"

	"backend/internal/domain"
)

func intPointer(value int) *int { return &value }

func TestChatSessionAccessByRole(t *testing.T) {
	assigned := &domain.ChatSession{UserID: intPointer(7), EmployeeID: intPointer(11)}
	unassigned := &domain.ChatSession{UserID: intPointer(7)}

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
	if !canReadSession(&domain.User{ID: 12, Role: domain.RoleManager}, unassigned) {
		t.Fatal("unassigned session must remain visible in the manager queue")
	}
	if canManageSession(&domain.User{ID: 12, Role: domain.RoleManager}, unassigned) {
		t.Fatal("manager must take an unassigned session before writing")
	}
}
