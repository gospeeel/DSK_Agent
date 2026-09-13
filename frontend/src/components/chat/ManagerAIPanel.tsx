import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Send, Bot, Check, HelpCircle, Loader2, AlertCircle, Copy, ArrowDownRight } from 'lucide-react';
import { aiApi } from '../../api/ai';
import { chatsApi } from '../../api/chats';
import { DialogAnalysisResult, ReplyAssistResult, AIChatResponse, ClientFacts } from '../../types';
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
  const [copied, setCopied] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<DialogAnalysisResult | null>(null);
  const [replyAssistResult, setReplyAssistResult] = useState<ReplyAssistResult | null>(null);
  const [aiAssistantAnswer, setAiAssistantAnswer] = useState<string | null>(null);
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);

  // Reset panel results when switching chat sessions
  useEffect(() => {
    setAnalysisResult(null);
    setReplyAssistResult(null);
    setAiAssistantAnswer(null);
    setErrorMsg(null);
    setShowPromptInput(false);
    setCustomAiPrompt('');
  }, [sessionId]);

  const formatAiError = (err: any, defaultMsg: string) => {
    if (err.message?.includes('NO_CLIENT_MESSAGES') || err.error?.code === 'NO_CLIENT_MESSAGES') {
      return 'В диалоге пока нет сообщений от клиента для проведения анализа. Дождитесь ответа клиента.';
    }
    if (err.status === 502 || err.message?.includes('502')) {
      return 'AI-сервис недоступен: укажите действующий ключ GIGACHAT_CREDENTIALS в .env файле.';
    }
    if (err.status === 503 || err.status === 504) {
      return 'Таймаут сервиса ИИ. Попробуйте повторить запрос позже.';
    }
    return err.message || defaultMsg;
  };

  // 1. Analyze Dialog (Summarization & Client Facts) on the open chat
  const handleAnalyze = async () => {
    setErrorMsg(null);
    setLoadingAction('analyze');
    try {
      if (dealId) {
        try {
          const result = await aiApi.analyzeDialog(dealId);
          setAnalysisResult(result);
          setAiAssistantAnswer(null);
          setReplyAssistResult(null);
          return;
        } catch (dealErr: any) {
          console.warn('Deal analysis endpoint error, falling back to chat dialog analysis:', dealErr);
        }
      }

      // Fallback or no dealId yet: analyze directly from chat messages
      const msgs = await chatsApi.getMessages(sessionId, true);
      if (!msgs || msgs.length === 0) {
        setErrorMsg('В текущем открытом диалоге пока нет сообщений для анализа.');
        return;
      }
      const clientMsgs = msgs.filter((m) => m.sender_type === 'client');
      if (clientMsgs.length === 0) {
        setErrorMsg('В текущем диалоге пока нет сообщений от клиента для анализа.');
        return;
      }
      const dialogText = msgs
        .map((m) => `${m.sender_type === 'client' ? 'Клиент' : m.sender_type === 'manager' ? 'Менеджер' : 'Система'}: ${m.content}`)
        .join('\n');

      const res = await aiApi.askAssistant({
        session_id: sessionId,
        deal_id: dealId,
        message: `Проанализируй следующую переписку из этого открытого диалога и сделай подробную выжимку (саммаризацию):\n\n${dialogText}\n\nВыдели:\n1. Ключевые потребности и пожелания клиента\n2. Бюджет и параметры квартиры\n3. Возражения или вопросы\n4. Текущий статус и договоренности.`,
      });

      setAnalysisResult({
        deal_id: dealId || 0,
        client_id: 0,
        analysis: {
          summary: res.message,
          important_factors: [],
          objections: [],
        },
        preferences_updated: false,
      });
      setAiAssistantAnswer(null);
      setReplyAssistResult(null);
    } catch (err: any) {
      setErrorMsg(formatAiError(err, 'Ошибка выполнения AI-анализа'));
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Draft Reply Assist on the open chat
  const handleReplyAssist = async () => {
    setErrorMsg(null);
    setLoadingAction('reply');
    try {
      if (dealId) {
        try {
          const result = await aiApi.replyAssist(dealId);
          setReplyAssistResult(result);
          setAnalysisResult(null);
          setAiAssistantAnswer(null);
          return;
        } catch (dealErr: any) {
          console.warn('Deal reply assist error, falling back to chat messages:', dealErr);
        }
      }

      // Fallback or no dealId yet: draft reply from recent chat messages
      const msgs = await chatsApi.getMessages(sessionId, true);
      if (!msgs || msgs.length === 0) {
        setErrorMsg('В текущем открытом диалоге пока нет сообщений для формирования ответа.');
        return;
      }
      const recentDialogText = msgs
        .slice(-8)
        .map((m) => `${m.sender_type === 'client' ? 'Клиент' : 'Менеджер'}: ${m.content}`)
        .join('\n');

      const res = await aiApi.askAssistant({
        session_id: sessionId,
        deal_id: dealId,
        message: `Предложи профессиональный, вежливый и емкий вариант ответа менеджера клиенту на основе переписки в этом открытом чате:\n\n${recentDialogText}`,
      });

      setReplyAssistResult({
        deal_id: dealId || 0,
        source: 'open_chat',
        suggested_reply: res.message,
        analysis: {
          intent: 'Консультация',
          summary: 'Ответ по открытому диалогу',
        },
      });
      setAnalysisResult(null);
      setAiAssistantAnswer(null);
    } catch (err: any) {
      setErrorMsg(formatAiError(err, 'Ошибка генерации ответа'));
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Ask AI Contextual Question
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
      setReplyAssistResult(null);
      setAnalysisResult(null);
    } catch (err: any) {
      setErrorMsg(formatAiError(err, 'Ошибка обращения к AI-ассистенту'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract analysis facts safely
  const clientFacts: ClientFacts | undefined = analysisResult?.analysis;
  const summaryText = clientFacts?.summary || analysisResult?.summary;

  return (
    <div className="bg-white border-2 border-zinc-900 rounded-2xl p-4 space-y-3 shadow-xs">
      
      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Ассистент:
          </span>

          <button
            onClick={handleAnalyze}
            disabled={loadingAction !== null}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-2 cursor-pointer ${
              analysisResult
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-900 border-zinc-900 hover:bg-[#FAF8F2]'
            } disabled:opacity-50`}
            title="Саммаризация диалога: потребности, бюджет, возражения"
          >
            {loadingAction === 'analyze' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5 text-zinc-700" />}
            Саммаризация диалога
          </button>

          <button
            onClick={handleReplyAssist}
            disabled={loadingAction !== null}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-2 cursor-pointer ${
              replyAssistResult
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-900 border-zinc-900 hover:bg-[#FAF8F2]'
            } disabled:opacity-50`}
            title="Сгенерировать контекстный ответ для клиента"
          >
            {loadingAction === 'reply' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            Предложить ответ
          </button>
        </div>

        <button
          onClick={() => setShowPromptInput(!showPromptInput)}
          className="px-3 py-1.5 rounded-xl bg-white border-2 border-zinc-900 hover:bg-[#FAF8F2] text-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
          Задать вопрос
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border-2 border-zinc-900 rounded-xl text-xs font-bold text-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Prompt Input Form */}
      {showPromptInput && (
        <div className="p-2 bg-[#FAF8F2] border-2 border-zinc-900 rounded-xl flex items-center gap-2">
          <input
            type="text"
            value={customAiPrompt}
            onChange={(e) => setCustomAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAskAssistant();
            }}
            placeholder="Спросите по объектам, условиям покупки, отделке или ипотеке..."
            className="flex-1 px-3 py-1.5 text-xs font-bold text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none placeholder-zinc-400"
          />
          <button
            onClick={() => handleAskAssistant()}
            disabled={loadingAction === 'ask' || !customAiPrompt.trim()}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 flex-shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {loadingAction === 'ask' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Спросить
          </button>
        </div>
      )}

      {/* 1. Results: Summarization and Client Analysis */}
      {analysisResult && (
        <div className="p-4 bg-[#FAF8F2] border-2 border-zinc-900 rounded-2xl space-y-3 text-xs shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-300 pb-2">
            <span className="font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              Саммаризация диалога и факты:
            </span>
            <span className="text-[11px] text-zinc-500 font-bold">
              {analysisResult.deal_id > 0 ? `Сделка #${analysisResult.deal_id}` : `Чат #${sessionId}`}
            </span>
          </div>

          {/* Summary Text */}
          {summaryText && (
            <div className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
              <span className="font-extrabold text-zinc-500 uppercase text-[10px] tracking-wider block mb-1">Выжимка (Summary):</span>
              <p className="text-zinc-900 font-medium leading-relaxed">{summaryText}</p>
            </div>
          )}

          {/* Extracted Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {clientFacts?.rooms !== undefined && clientFacts.rooms !== null && (
              <div className="p-2.5 bg-white rounded-xl border border-zinc-900">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Комнат</span>
                <span className="font-extrabold text-zinc-900">{clientFacts.rooms}-комн.</span>
              </div>
            )}
            {clientFacts?.budget_max !== undefined && clientFacts.budget_max !== null && (
              <div className="p-2.5 bg-white rounded-xl border border-zinc-900">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Бюджет до</span>
                <span className="font-extrabold text-zinc-900">{formatPrice(clientFacts.budget_max)}</span>
              </div>
            )}
            {clientFacts?.preferred_district && (
              <div className="p-2.5 bg-white rounded-xl border border-zinc-900">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Район</span>
                <span className="font-extrabold text-zinc-900">{clientFacts.preferred_district}</span>
              </div>
            )}
            {clientFacts?.purchase_timeline && (
              <div className="p-2.5 bg-white rounded-xl border border-zinc-900">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Срок покупки</span>
                <span className="font-extrabold text-zinc-900">{clientFacts.purchase_timeline}</span>
              </div>
            )}
            {clientFacts?.floor_min !== undefined && clientFacts.floor_min !== null && (
              <div className="p-2.5 bg-white rounded-xl border border-zinc-900">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Этаж</span>
                <span className="font-extrabold text-zinc-900">{clientFacts.floor_min}{clientFacts.floor_max ? ` - ${clientFacts.floor_max}` : ''}</span>
              </div>
            )}
          </div>

          {/* Important Factors & Objections */}
          {clientFacts?.important_factors && clientFacts.important_factors.length > 0 && (
            <div className="p-3 bg-white rounded-xl border border-zinc-900">
              <span className="font-extrabold text-zinc-500 uppercase text-[10px] tracking-wider block mb-1.5">Ключевые факторы клиента:</span>
              <div className="flex flex-wrap gap-1.5">
                {clientFacts.important_factors.map((factor, i) => (
                  <span key={i} className="px-2.5 py-0.5 bg-[#FAF8F2] border border-zinc-900 text-zinc-900 rounded-full text-[11px] font-bold">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {clientFacts?.objections && clientFacts.objections.length > 0 && (
            <div className="p-3 bg-[#FEF7EE] border-2 border-zinc-900 rounded-xl">
              <span className="font-extrabold text-amber-900 uppercase text-[10px] tracking-wider block mb-1">Выявленные возражения:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-950 font-medium">
                {clientFacts.objections.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 2. Results: Reply Assist */}
      {replyAssistResult && (
        <div className="p-4 bg-[#FAF8F2] border-2 border-zinc-900 rounded-2xl space-y-3 text-xs shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-300 pb-2">
            <span className="font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              Предложенный ответ клиенту:
            </span>
            {replyAssistResult.analysis?.intent && (
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-zinc-900 text-zinc-900 text-[10px] font-bold">
                {replyAssistResult.analysis.intent}
              </span>
            )}
          </div>

          <div className="p-3.5 bg-white border-2 border-zinc-900 rounded-xl">
            <p className="text-zinc-900 font-medium text-xs whitespace-pre-wrap leading-relaxed">
              {replyAssistResult.suggested_reply}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleCopy(replyAssistResult.suggested_reply)}
              className="px-3.5 py-1.5 bg-white border-2 border-zinc-900 hover:bg-zinc-100 text-zinc-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Скопировано' : 'Скопировать'}
            </button>

            <button
              onClick={() => onApplyReplyText(replyAssistResult.suggested_reply)}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl border-2 border-zinc-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Вставить в поле ввода
            </button>
          </div>
        </div>
      )}

      {/* 3. Results: AI Assistant Answer */}
      {aiAssistantAnswer && (
        <div className="p-4 bg-[#FAF8F2] border-2 border-zinc-900 rounded-2xl space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
            <span className="font-extrabold text-zinc-900 uppercase tracking-wider">Ответ ассистента:</span>
            <button
              onClick={() => setAiAssistantAnswer(null)}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 uppercase"
            >
              Закрыть
            </button>
          </div>
          <p className="text-zinc-900 whitespace-pre-wrap leading-relaxed font-medium">{aiAssistantAnswer}</p>
          <div className="flex justify-end">
            <button
              onClick={() => onApplyReplyText(aiAssistantAnswer)}
              className="px-3 py-1.5 bg-white border-2 border-zinc-900 hover:bg-zinc-100 text-zinc-900 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowDownRight className="w-3 h-3" />
              Вставить в чат
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
