package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"backend/internal/domain"
	"backend/internal/service"
)

type AIHandler struct {
	aiService   service.AIAgentService
	chatService service.ChatService
}

func NewAIHandler(aiService service.AIAgentService, chatService service.ChatService) *AIHandler {
	return &AIHandler{
		aiService:   aiService,
		chatService: chatService,
	}
}

func (h *AIHandler) Chat(w http.ResponseWriter, r *http.Request) {
	var req domain.AIChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	req.Message = strings.TrimSpace(req.Message)
	if req.Message == "" {
		http.Error(w, "message cannot be empty", http.StatusBadRequest)
		return
	}
	if req.SessionID == nil || *req.SessionID <= 0 {
		http.Error(w, "session_id must be a positive integer", http.StatusBadRequest)
		return
	}
	if req.DealID != nil && *req.DealID <= 0 {
		http.Error(w, "deal_id must be a positive integer or null", http.StatusBadRequest)
		return
	}

	var userID int
	senderType := "client"

	if user, ok := r.Context().Value("user").(*domain.User); ok && user != nil {
		userID = user.ID
		if user.Role == domain.RoleManager || user.Role == domain.RoleSupervisor {
			senderType = "manager"
		}
	}
	if userID <= 0 {
		http.Error(w, "authenticated user is required", http.StatusUnauthorized)
		return
	}

	// Build RabbitMQ RPC payload
	payload := domain.AgentChatPayload{
		UserID:    userID,
		SessionID: *req.SessionID,
		DealID:    req.DealID,
		Message:   req.Message,
	}

	// Record the manager message in the selected chat session.
	userIDForMessage := userID
	_, _ = h.chatService.SendMessage(
		r.Context(),
		*req.SessionID,
		&userIDForMessage,
		senderType,
		req.Message,
	)

	// Send RPC to Agent Service via RabbitMQ
	respData, err := h.aiService.SendChatRequest(r.Context(), payload)
	if err != nil {
		var agentError *service.AgentRPCError
		if errors.As(err, &agentError) && agentError.Code == "FORBIDDEN" {
			http.Error(w, "FORBIDDEN", http.StatusForbidden)
			return
		}
		if errors.Is(err, service.ErrRabbitMQUnavailable) {
			http.Error(w, "AI service unavailable: "+err.Error(), http.StatusServiceUnavailable)
			return
		}
		if errors.Is(err, service.ErrRPCResponseTimeout) {
			http.Error(w, "AI response timeout", http.StatusGatewayTimeout)
			return
		}
		http.Error(w, "AI service error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Record the AI response in the same chat session.
	if respData != nil && respData.Message != "" {
		_, _ = h.chatService.SendMessage(r.Context(), *req.SessionID, nil, "ai", respData.Message)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(respData)
}
