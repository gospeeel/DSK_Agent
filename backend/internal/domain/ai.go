package domain

// HTTP request from frontend
type AIChatRequest struct {
	Message   string  `json:"message"`
	SessionID *string `json:"session_id,omitempty"`
	DealID    *string `json:"deal_id,omitempty"`
}

// RabbitMQ RPC request payload
type AgentChatPayload struct {
	UserID    *string `json:"user_id"`
	SessionID *string `json:"session_id"`
	DealID    *string `json:"deal_id"`
	Message   string  `json:"message"`
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

// RabbitMQ RPC response envelope
type AgentChatResponseEnvelope struct {
	RequestID string                 `json:"request_id"`
	Success   bool                   `json:"success"`
	Data      *AgentChatResponseData `json:"data"`
	Error     interface{}            `json:"error"`
}
