import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Loader2, X } from 'lucide-react';
import { dealsApi } from '../../api/deals';
import { AssistantChatContext } from '../../context/AssistantContext';
import { Deal } from '../../types';
import { ManagerAIPanel } from './ManagerAIPanel';

interface GlobalAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: AssistantChatContext | null;
  onApplyReply: (text: string, sessionId: number) => boolean;
}

export const GlobalAIAssistantModal: React.FC<GlobalAIAssistantModalProps> = ({
  isOpen,
  onClose,
  activeContext,
  onApplyReply,
}) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [loadingDeals, setLoadingDeals] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingDeals(true);
    dealsApi
      .getAllDeals()
      .then((items) => setDeals(items))
      .catch(() => setDeals([]))
      .finally(() => setLoadingDeals(false));
  }, [isOpen]);

  const contexts = useMemo(() => {
    const result: AssistantChatContext[] = [];
    if (activeContext) result.push(activeContext);
    for (const deal of deals) {
      if (!deal.id_chat_session || result.some((item) => item.sessionId === deal.id_chat_session)) continue;
      result.push({
        sessionId: deal.id_chat_session,
        dealId: deal.id,
        clientName: deal.user_name,
        apartmentNumber: deal.apartment_number,
        basePrice: deal.base_price,
      });
    }
    return result;
  }, [activeContext, deals]);

  useEffect(() => {
    if (!isOpen) return;
    const preferredSessionId = activeContext?.sessionId ?? contexts[0]?.sessionId ?? null;
    setSelectedSessionId((current) =>
      current && contexts.some((item) => item.sessionId === current) ? current : preferredSessionId,
    );
  }, [activeContext?.sessionId, contexts, isOpen]);

  if (!isOpen) return null;

  const selectedContext = contexts.find((item) => item.sessionId === selectedSessionId) ?? null;
  const canInsertIntoActiveChat = Boolean(
    selectedContext && activeContext?.sessionId === selectedContext.sessionId,
  );
  const handleApplyReply = canInsertIntoActiveChat && selectedContext
    ? (text: string) => {
        if (onApplyReply(text, selectedContext.sessionId)) onClose();
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex h-[min(900px,94vh)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-dsk-600 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">AI-ассистент</h2>
              <p className="text-[11px] text-slate-500">Отдельный рабочий чат сотрудника</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            {loadingDeals && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <label htmlFor="assistant-context" className="hidden text-[10px] font-semibold text-slate-500 sm:block">
              Контекст:
            </label>
            <select
              id="assistant-context"
              value={selectedSessionId ?? ''}
              onChange={(event) => setSelectedSessionId(Number(event.target.value))}
              disabled={contexts.length === 0}
              className="min-w-0 max-w-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-dsk-300 disabled:opacity-50"
            >
              {contexts.length === 0 && <option value="">Нет доступного диалога</option>}
              {contexts.map((context) => (
                <option key={context.sessionId} value={context.sessionId}>
                  {context.clientName || `Диалог #${context.sessionId}`}
                  {context.dealId ? ` · Сделка #${context.dealId}` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Закрыть AI-ассистент"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 p-3 sm:p-4">
          {selectedContext ? (
            <ManagerAIPanel
              sessionId={selectedContext.sessionId}
              dealId={selectedContext.dealId}
              clientName={selectedContext.clientName}
              apartmentNumber={selectedContext.apartmentNumber}
              basePrice={selectedContext.basePrice}
              onApplyReplyText={handleApplyReply}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div className="max-w-md">
                <Bot className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">Нет доступного контекста диалога</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Откройте клиентский диалог или выберите сделку с привязанной chat session. Backend требует действующий session_id, поэтому AI-запрос не отправляется с вымышленным ID.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
