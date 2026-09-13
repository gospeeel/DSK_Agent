import React, { useState } from 'react';
import { Sparkles, Search, Send, Bot, Check, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import { aiApi } from '../../api/ai';
import { DialogAnalysisResult, ReplyAssistResult, AIChatResponse } from '../../types';
import { formatPrice } from '../../lib/utils';

interface ManagerAIPanelProps {
  dealId?: number;
  sessionId: number;
  onApplyReplyText: (text: string) => void;
}

export const ManagerAIPanel: React.FC<ManagerAIPanelProps> = ({
  dealId,
  sessionId,
  onApplyReplyText,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [analysisResult, setAnalysisResult] = useState<DialogAnalysisResult | null>(null);
  const [replyAssistResult, setReplyAssistResult] = useState<ReplyAssistResult | null>(null);
  const [aiAssistantAnswer, setAiAssistantAnswer] = useState<string | null>(null);
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);

  const formatAiError = (err: any, defaultMsg: string) => {
    if (err.status === 502 || err.message?.includes('502')) {
      return 'AI-ассистент недоступен: укажите действующий ключ GIGACHAT_CREDENTIALS в .env файле.';
    }
    if (err.status === 503 || err.status === 504) {
      return 'Таймаут или недоступность AI-сервиса. Попробуйте повторить запрос позже.';
    }
    return err.message || defaultMsg;
  };

  // 1. Analyze Dialog
  const handleAnalyze = async () => {
    if (!dealId) {
      setErrorMsg('Для глубокого AI-анализа требуется связанная сделка или обращение.');
      return;
    }
    setErrorMsg(null);
    setLoadingAction('analyze');
    try {
      const res = await aiApi.analyzeDialog(dealId);
      setAnalysisResult(res);
      setReplyAssistResult(null);
    } catch (err: any) {
      setErrorMsg(formatAiError(err, 'Ошибка выполнения AI анализа'));
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Draft Reply Assist
  const handleReplyAssist = async () => {
    if (!dealId) {
      setErrorMsg('Для генерации ответа создайте или выберите сделку обращения.');
      return;
    }
    setErrorMsg(null);
    setLoadingAction('reply');
    try {
      const res = await aiApi.replyAssist(dealId);
      setReplyAssistResult(res);
      setAnalysisResult(null);
    } catch (err: any) {
      setErrorMsg(formatAiError(err, 'Ошибка генерации ответа'));
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Ask AI General Question
  const handleAskAssistant = async (messageText?: string) => {
    const textToSend = messageText || customAiPrompt.trim();
    if (!textToSend) return;

    setErrorMsg(null);
    setLoadingAction('ask');
    try {
      const res: AIChatResponse = await aiApi.askAssistant({
        session_id: sessionId,
        deal_id: dealId,
        message: textToSend,
      });
      setAiAssistantAnswer(res.message);
      setCustomAiPrompt('');
      setShowPromptInput(false);
    } catch (err: any) {
      setErrorMsg(formatAiError(err, 'Ошибка обращения к AI-ассистенту'));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-lg border border-slate-800">
      
      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-dsk-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Помощник:
          </span>

          <button
            onClick={handleAnalyze}
            disabled={loadingAction !== null}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
            title="Извлечь подтверждённые факты, бюджет и возражения клиента"
          >
            {loadingAction === 'analyze' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3 text-dsk-400" />}
            Анализ диалога
          </button>

          <button
            onClick={handleReplyAssist}
            disabled={loadingAction !== null}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-dsk-600 hover:bg-dsk-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Сгенерировать черновик профессионального ответа"
          >
            {loadingAction === 'reply' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
            Черновик ответа
          </button>
        </div>

        <button
          onClick={() => setShowPromptInput(!showPromptInput)}
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {showPromptInput ? 'Скрыть вопрос' : 'Спросить AI'}
        </button>
      </div>

      {/* Optional Custom AI prompt input */}
      {showPromptInput && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            value={customAiPrompt}
            onChange={(e) => setCustomAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAssistant()}
            placeholder="Спросить про сроки, риски ERP, скидки или конкурентов..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-dsk-400"
          />
          <button
            onClick={() => handleAskAssistant()}
            disabled={loadingAction === 'ask' || !customAiPrompt.trim()}
            className="px-3 py-1.5 bg-dsk-600 hover:bg-dsk-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
          >
            {loadingAction === 'ask' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Спросить'}
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="mt-2 p-2 bg-rose-950/80 border border-rose-800 rounded-lg text-[11px] text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Reply Assist Proposal */}
      {replyAssistResult && (
        <div className="mt-3 p-3 bg-slate-800/90 border border-dsk-500/40 rounded-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-dsk-300 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />
              Предложенный черновик ответа:
            </span>
            <button
              onClick={() => onApplyReplyText(replyAssistResult.suggested_reply)}
              className="px-2.5 py-1 bg-dsk-500 hover:bg-dsk-400 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <Check className="w-3 h-3" />
              Вставить в поле ввода
            </button>
          </div>
          <p className="text-xs text-slate-100 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-750 select-text">
            {replyAssistResult.suggested_reply}
          </p>
        </div>
      )}

      {/* Dialog Analysis Card */}
      {analysisResult && (
        <div className="mt-3 p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-750 pb-1.5">
            <span className="font-semibold text-slate-200">Факты и потребности клиента:</span>
            <button
              onClick={() => setAnalysisResult(null)}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Закрыть
            </button>
          </div>

          {analysisResult.client_needs && (
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-900/50 p-2 rounded-lg">
              {analysisResult.client_needs.rooms && <div>Комнат: {analysisResult.client_needs.rooms}</div>}
              {analysisResult.client_needs.budget_max && (
                <div>Бюджет до: {formatPrice(analysisResult.client_needs.budget_max)}</div>
              )}
              {analysisResult.client_needs.district && <div>Район: {analysisResult.client_needs.district}</div>}
              {analysisResult.client_needs.preferred_finishing && (
                <div>Отделка: {analysisResult.client_needs.preferred_finishing}</div>
              )}
            </div>
          )}

          {analysisResult.summary && (
            <p className="text-[11px] text-slate-300 leading-normal">{analysisResult.summary}</p>
          )}

          {analysisResult.objections && analysisResult.objections.length > 0 && (
            <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-900/60 p-2 rounded-lg">
              <span className="font-semibold block mb-0.5">Возражения клиента:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {analysisResult.objections.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* AI Assistant Answer Card */}
      {aiAssistantAnswer && (
        <div className="mt-3 p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Ответ AI-ассистента:
            </span>
            <button
              onClick={() => setAiAssistantAnswer(null)}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Скрыть
            </button>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed select-text bg-slate-900/60 p-2.5 rounded-lg border border-slate-750">
            {aiAssistantAnswer}
          </p>
        </div>
      )}

    </div>
  );
};
