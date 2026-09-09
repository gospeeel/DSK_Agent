package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
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

	var userIDStr *string
	var userIDInt *int
	senderType := "client"

	if user, ok := r.Context().Value("user").(*domain.User); ok && user != nil {
		idStr := strconv.Itoa(user.ID)
		userIDStr = &idStr
		userIDInt = &user.ID
		if user.Role == domain.RoleManager || user.Role == domain.RoleSupervisor {
			senderType = "manager"
		}
	}

	// Build RabbitMQ RPC payload
	payload := domain.AgentChatPayload{
		UserID:    userIDStr,
		SessionID: req.SessionID,
		DealID:    req.DealID,
		Message:   req.Message,
	}

	// If session_id is a valid integer, record user message in chat
	var sessionIDInt int
	var hasValidSession bool
	if req.SessionID != nil {
		if id, err := strconv.Atoi(*req.SessionID); err == nil {
			sessionIDInt = id
			hasValidSession = true
			_, _ = h.chatService.SendMessage(r.Context(), sessionIDInt, userIDInt, senderType, req.Message)
		}
	}

	// Send RPC to Agent Service via RabbitMQ
	respData, err := h.aiService.SendChatRequest(r.Context(), payload)
	if err != nil {
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

	// If session_id is valid, record AI response in chat as sender_type = "ai"
	if hasValidSession && respData != nil && respData.Message != "" {
		_, _ = h.chatService.SendMessage(r.Context(), sessionIDInt, nil, "ai", respData.Message)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(respData)
}
