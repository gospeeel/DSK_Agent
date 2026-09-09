package handler

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/internal/domain"
	"backend/internal/service"
	amqp "github.com/rabbitmq/amqp091-go"
)

type fakeAIService struct {
	payload  domain.AgentChatPayload
	response *domain.AgentChatResponseData
	err      error
}

func (f *fakeAIService) SendChatRequest(_ context.Context, payload domain.AgentChatPayload) (*domain.AgentChatResponseData, error) {
	f.payload = payload
	return f.response, f.err
}

func (*fakeAIService) NewRabbitMQChannel() (*amqp.Channel, error) { return nil, nil }
func (*fakeAIService) Close() error                               { return nil }

type fakeAIChatService struct{}

func (*fakeAIChatService) CreateSession(context.Context, domain.CreateChatSessionRequest, *int) (*domain.ChatSession, error) {
	return nil, nil
}
func (*fakeAIChatService) GetSessionByID(context.Context, int) (*domain.ChatSession, error) {
	return nil, nil
}
func (*fakeAIChatService) GetSessions(context.Context, *int, *int, *domain.ChatSessionStatus) ([]*domain.ChatSession, error) {
	return nil, nil
}
func (*fakeAIChatService) TakeSession(context.Context, int, int) error { return nil }
func (*fakeAIChatService) CloseSession(context.Context, int) error     { return nil }
func (*fakeAIChatService) RejectSession(context.Context, int, int, string) (*domain.ChatSessionRejection, error) {
	return nil, nil
}
func (*fakeAIChatService) SendMessage(context.Context, int, *int, string, string) (*domain.Message, error) {
	return nil, nil
}
func (*fakeAIChatService) GetMessages(context.Context, int, *int) ([]*domain.Message, error) {
	return nil, nil
}

func TestAIChatUsesAuthenticatedActorAndIgnoresClaimedIDs(t *testing.T) {
	ai := &fakeAIService{response: &domain.AgentChatResponseData{
		Message: "ok", Agent: "offer", Intent: "create_offer",
	}}
	handler := NewAIHandler(ai, &fakeAIChatService{})
	request := httptest.NewRequest(http.MethodPost, "/api/ai/chat", bytes.NewBufferString(`{
		"message":"Сформируй коммерческое предложение",
		"session_id":1,
		"deal_id":10,
		"user_id":2,
		"created_by":2,
		"requested_by":2
	}`))
	request = request.WithContext(context.WithValue(request.Context(), "user", &domain.User{
		ID: 1, Role: domain.RoleManager,
	}))
	response := httptest.NewRecorder()

	handler.Chat(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("unexpected status %d: %s", response.Code, response.Body.String())
	}
	if ai.payload.UserID != 1 {
		t.Fatalf("frontend substituted actor: got %d, want authenticated actor 1", ai.payload.UserID)
	}
}

func TestAIChatMapsAgentForbiddenToHTTPForbidden(t *testing.T) {
	ai := &fakeAIService{err: &service.AgentRPCError{Code: "FORBIDDEN", Message: "not owner"}}
	handler := NewAIHandler(ai, &fakeAIChatService{})
	request := httptest.NewRequest(http.MethodPost, "/api/ai/chat", bytes.NewBufferString(`{
		"message":"Сформируй коммерческое предложение",
		"session_id":1,
		"deal_id":10
	}`))
	request = request.WithContext(context.WithValue(request.Context(), "user", &domain.User{
		ID: 1, Role: domain.RoleManager,
	}))
	response := httptest.NewRecorder()

	handler.Chat(response, request)

	if response.Code != http.StatusForbidden || response.Body.String() != "FORBIDDEN\n" {
		t.Fatalf("unexpected forbidden response: status=%d body=%q", response.Code, response.Body.String())
	}
}
