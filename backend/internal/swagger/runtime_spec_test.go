package swagger

import (
	"encoding/json"
	"testing"
)

func TestRuntimeSpecsAreValidAndCoverRegisteredAPIRoutes(t *testing.T) {
	tests := []struct {
		name        string
		raw         []byte
		methodCount int
	}{
		{name: "user", raw: UserSpec, methodCount: 25},
		{name: "staff", raw: StaffSpec, methodCount: 38},

	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var doc map[string]any
			if err := json.Unmarshal(tt.raw, &doc); err != nil {
				t.Fatalf("invalid OpenAPI JSON: %v", err)
			}
			paths := doc["paths"].(map[string]any)
			count := 0
			for _, rawPath := range paths {
				for method := range rawPath.(map[string]any) {
					switch method {
					case "get", "post", "put", "delete", "patch":
						count++
					}
				}
			}
			if count != tt.methodCount {
				t.Fatalf("documented API methods = %d, want %d", count, tt.methodCount)
			}
		})
	}
}

func TestAIChatSwaggerUsesIntegerBusinessIDsAndRequiresAuth(t *testing.T) {
	for name, raw := range map[string][]byte{"user": UserSpec, "staff": StaffSpec} {
		t.Run(name, func(t *testing.T) {
			var doc map[string]any
			if err := json.Unmarshal(raw, &doc); err != nil {
				t.Fatal(err)
			}
			components := doc["components"].(map[string]any)
			schemas := components["schemas"].(map[string]any)
			request := schemas["AIChatRequest"].(map[string]any)
			properties := request["properties"].(map[string]any)
			for _, field := range []string{"session_id", "deal_id"} {
				if got := properties[field].(map[string]any)["type"]; got != "integer" {
					t.Errorf("%s type = %v, want integer", field, got)
				}
			}

			paths := doc["paths"].(map[string]any)
			chat := paths["/api/ai/chat"].(map[string]any)["post"].(map[string]any)
			if _, ok := chat["security"]; !ok {
				t.Error("AI chat operation must declare BearerAuth")
			}
		})
	}
}

func TestStaffSwaggerContainsConstructionCRUD(t *testing.T) {
	var doc map[string]any
	if err := json.Unmarshal(StaffSpec, &doc); err != nil {
		t.Fatal(err)
	}
	paths := doc["paths"].(map[string]any)
	expected := map[string][]string{
		"/api/complexes":                         {"get", "post"},
		"/api/complexes/{id}":                    {"get", "put", "delete"},
		"/api/complexes/{complexId}/buildings":   {"get"},
		"/api/buildings":                         {"post"},
		"/api/buildings/{id}":                    {"get", "put", "delete"},
		"/api/buildings/{buildingId}/apartments": {"get"},
		"/api/buildings/{buildingId}/progress":   {"get"},
		"/api/apartments":                        {"post"},
		"/api/apartments/{id}":                   {"get", "put", "delete"},
		"/api/progress":                          {"post"},
		"/api/progress/{id}":                     {"get", "put", "delete"},
	}
	for path, methods := range expected {
		pathObject, ok := paths[path].(map[string]any)
		if !ok {
			t.Errorf("missing path %s", path)
			continue
		}
		for _, method := range methods {
			if _, ok := pathObject[method]; !ok {
				t.Errorf("missing %s %s", method, path)
			}
		}
	}
}
