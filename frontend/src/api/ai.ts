import { api } from './client';
import { DialogAnalysisResult, ReplyAssistResult, AIChatResponse } from '../types';

export const aiApi = {
  // Analyze dialog for customer facts, needs and objections
  analyzeDialog: async (dealId: number): Promise<DialogAnalysisResult> => {
    return api.post<DialogAnalysisResult>('/ai/dialog/analyze', { deal_id: dealId }, true);
  },

  // Assist manager with a drafted reply
  replyAssist: async (dealId: number, selectedText?: string): Promise<ReplyAssistResult> => {
    return api.post<ReplyAssistResult>(
      '/ai/dialog/reply-assist',
      { deal_id: dealId, selected_text: selectedText },
      true
    );
  },

  // Ask AI Assistant general questions or specific object assistance
  askAssistant: async (
    payload: {
      session_id: number;
      deal_id?: number;
      message: string;
      parking_unit_id?: number;
      storage_unit_id?: number;
    },
    isStaff = true
  ): Promise<AIChatResponse> => {
    return api.post<AIChatResponse>('/ai/chat', payload, isStaff);
  },
};
