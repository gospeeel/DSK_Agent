package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"backend/internal/domain"
	"backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type ChatHandler struct {
	chatService service.ChatService
}

func NewChatHandler(chatService service.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

func (h *ChatHandler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateChatSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var userID *int
	if user, ok := r.Context().Value("user").(*domain.User); ok && user != nil {
		userID = &user.ID
	}

	session, err := h.chatService.CreateSession(r.Context(), req, userID)
	if err != nil {
		if err == service.ErrInvalidSessionData {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(session)
}

func (h *ChatHandler) GetMySessions(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value("user").(*domain.User)
	if !ok || user == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	sessions, err := h.chatService.GetSessions(r.Context(), &user.ID, nil, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(sessions)
}

func (h *ChatHandler) GetAllSessions(w http.ResponseWriter, r *http.Request) {
	var statusFilter *domain.ChatSessionStatus
	statusParam := r.URL.Query().Get("status")
	if statusParam != "" {
		st := domain.ChatSessionStatus(statusParam)
		statusFilter = &st
	}

	var employeeFilter *int
	if empParam := r.URL.Query().Get("employee_id"); empParam != "" {
		if id, err := strconv.Atoi(empParam); err == nil {
			employeeFilter = &id
		}
	}

	sessions, err := h.chatService.GetSessions(r.Context(), nil, employeeFilter, statusFilter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(sessions)
}

func (h *ChatHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid session id", http.StatusBadRequest)
		return
	}

	session, err := h.chatService.GetSessionByID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(session)
}

func (h *ChatHandler) TakeSession(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value("user").(*domain.User)
	if !ok || user == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid session id", http.StatusBadRequest)
		return
	}

	if err := h.chatService.TakeSession(r.Context(), id, user.ID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	session, err := h.chatService.GetSessionByID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(session)
}

func (h *ChatHandler) CloseSession(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid session id", http.StatusBadRequest)
		return
	}

	if err := h.chatService.CloseSession(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "session closed successfully"})
}

func (h *ChatHandler) RejectSession(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value("user").(*domain.User)
	if !ok || user == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid session id", http.StatusBadRequest)
		return
	}

	var req domain.RejectSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	rejection, err := h.chatService.RejectSession(r.Context(), id, user.ID, req.Reason)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(rejection)
}

func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid session id", http.StatusBadRequest)
		return
	}

	var req domain.SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	senderType := "client"
	var userID *int
	if user, ok := r.Context().Value("user").(*domain.User); ok && user != nil {
		userID = &user.ID
		if user.Role == domain.RoleManager || user.Role == domain.RoleSupervisor {
			senderType = "manager"
		}
	}

	msg, err := h.chatService.SendMessage(r.Context(), id, userID, senderType, req.Content)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(msg)
}

func (h *ChatHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid session id", http.StatusBadRequest)
		return
	}

	var currentUserID *int
	if user, ok := r.Context().Value("user").(*domain.User); ok && user != nil {
		currentUserID = &user.ID
	}

	messages, err := h.chatService.GetMessages(r.Context(), id, currentUserID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(messages)
}
