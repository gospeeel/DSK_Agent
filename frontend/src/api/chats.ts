import { api } from './client';
import { ChatSession, Message, ChatSessionStatus } from '../types';

export interface CreateChatSessionPayload {
  id_apartment?: number;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
}

export const chatsApi = {
  // Client creates session
  createSession: async (payload: CreateChatSessionPayload): Promise<ChatSession> => {
    return api.post<ChatSession>('/chat/sessions', payload, false);
  },

  // Client gets own sessions
  getMySessions: async (): Promise<ChatSession[]> => {
    return api.get<ChatSession[]>('/chat/sessions', false);
  },

  // Client gets session details
  getSession: async (id: number, isStaff = false): Promise<ChatSession> => {
    return api.get<ChatSession>(`/chat/sessions/${id}`, isStaff);
  },

  // Get messages
  getMessages: async (sessionId: number, isStaff = false): Promise<Message[]> => {
    return api.get<Message[]>(`/chat/sessions/${sessionId}/messages`, isStaff);
  },

  // Send message
  sendMessage: async (sessionId: number, content: string, isStaff = false): Promise<Message> => {
    return api.post<Message>(`/chat/sessions/${sessionId}/messages`, { content }, isStaff);
  },

  // Staff: Get all sessions
  getAllSessions: async (status?: ChatSessionStatus, employeeId?: number): Promise<ChatSession[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (employeeId) params.append('employee_id', employeeId.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<ChatSession[]>(`/chat/sessions${query}`, true);
  },

  // Staff takes session
  takeSession: async (sessionId: number): Promise<ChatSession> => {
    return api.post<ChatSession>(`/chat/sessions/${sessionId}/take`, {}, true);
  },

  // Staff closes session
  closeSession: async (sessionId: number): Promise<{ message: string }> => {
    return api.post<{ message: string }>(`/chat/sessions/${sessionId}/close`, {}, true);
  },

  // Staff rejects session
  rejectSession: async (sessionId: number, reason: string): Promise<any> => {
    return api.post(`/chat/sessions/${sessionId}/reject`, { reason }, true);
  },
};
