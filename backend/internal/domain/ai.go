package domain

// HTTP request from frontend
type AIChatRequest struct {
	Message   string `json:"message"`
	SessionID *int   `json:"session_id,omitempty"`
	DealID    *int   `json:"deal_id,omitempty"`
}

// RabbitMQ RPC request payload
type AgentChatPayload struct {
	UserID    int    `json:"user_id"`
	SessionID int    `json:"session_id"`
	DealID    *int   `json:"deal_id"`
	Message   string `json:"message"`
}

// RabbitMQ RPC request envelope
type AgentChatRequestEnvelope struct {
	RequestID string           `json:"request_id"`
	Action    string           `json:"action"`
	Payload   AgentChatPayload `json:"payload"`
}

// Agent Service RPC response data
type AgentChatResponseData struct {
	Message string `json:"message"`
	Agent   string `json:"agent"`
	Intent  string `json:"intent"`
}

type AgentChatError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// RabbitMQ RPC response envelope
type AgentChatResponseEnvelope struct {
	RequestID string                 `json:"request_id"`
	Success   bool                   `json:"success"`
	Data      *AgentChatResponseData `json:"data"`
	Error     *AgentChatError        `json:"error"`
}
