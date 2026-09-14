import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Bot,
  Building2,
  Check,
  Copy,
  FileText,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  UserRound,
  UserRoundSearch,
} from 'lucide-react';
import { aiApi } from '../../api/ai';
import { DialogAnalysisResult, ReplyAssistResult } from '../../types';
import { formatPrice } from '../../lib/utils';

interface ManagerAIPanelProps {
  dealId?: number;
  sessionId: number;
  clientName?: string;
  apartmentNumber?: string;
  basePrice?: number;
  onApplyReplyText?: (text: string) => void;
}

type ChatMode = 'general' | 'negotiation' | 'risks' | 'offer' | 'analysis' | 'reply';
type MessageRole = 'user' | 'assistant' | 'system';

interface AIMessage {
  id: string;
  role: MessageRole;
  text: string;
  mode: ChatMode;
  createdAt: string;
  agent?: string;
  intent?: string;
  error?: boolean;
  analysis?: DialogAnalysisResult;
  replyAssist?: ReplyAssistResult;
}

interface ModeDefinition {
  id: ChatMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresDeal: boolean;
}

const modes: ModeDefinition[] = [
  { id: 'general', label: 'Общий', icon: Sparkles, requiresDeal: false },
  { id: 'negotiation', label: 'Переговоры', icon: MessageSquareText, requiresDeal: true },
  { id: 'risks', label: 'Риски', icon: BarChart3, requiresDeal: true },
  { id: 'offer', label: 'КП', icon: FileText, requiresDeal: true },
  { id: 'analysis', label: 'Анализ клиента', icon: UserRoundSearch, requiresDeal: true },
  { id: 'reply', label: 'Черновик ответа', icon: Bot, requiresDeal: true },
];

const modeHints: Record<ChatMode, string> = {
  general: 'Задайте любой вопрос AI-помощнику.',
  negotiation: 'Подготовьте аргументы или разберите возражение клиента.',
  risks: 'Оцените строительные риски и задайте уточняющие вопросы.',
  offer: 'Сформируйте КП или продолжите диалог о скидке.',
  analysis: 'Извлеките подтверждённые потребности клиента из переписки.',
  reply: 'Подготовьте ответ на последнее сообщение клиента.',
};

const quickActions: Partial<Record<ChatMode, Array<{ label: string; prompt: string }>>> = {
  negotiation: [
    {
      label: 'Возражение по цене',
      prompt: 'Клиент говорит, что у конкурента похожая квартира дешевле. Помоги подготовить аргументы для переговоров.',
    },
    {
      label: 'Сравнить с конкурентом',
      prompt: 'Сравни предложение по этой сделке с конкурентами и используй только подтверждённые факты.',
    },
    {
      label: 'Подготовить аргументы',
      prompt: 'Подготовь фактические аргументы для переговоров с клиентом по этой сделке.',
    },
    {
      label: 'Следующий ответ клиенту',
      prompt: 'Подготовь следующий короткий ответ клиенту с учётом этой сделки и переписки.',
    },
  ],
  risks: [
    {
      label: 'Проанализировать риски',
      prompt: 'Проанализируй риски по строительству для этой сделки.',
    },
    { label: 'Насколько критична задержка?', prompt: 'Насколько критична текущая задержка строительства?' },
    { label: 'Что сказать клиенту?', prompt: 'Что сказать клиенту о текущих строительных рисках?' },
  ],
  offer: [
    { label: 'Подобрать скидку', prompt: 'Сделай предложение с хорошей скидкой.' },
  ],
};

const modeAgentLabels: Record<string, string> = {
  general: 'Общий',
  negotiation: 'Переговоры',
  analytics: 'Аналитика',
  offer: 'КП',
};

const createMessageId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatAiError = (err: unknown, defaultMessage: string) => {
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: number }).status)
      : undefined;

  if (status === 401) return 'Сессия истекла. Войдите снова.';
  if (status === 403) return 'Нет доступа к этой сделке.';
  if (status === 404) return 'Данные сделки не найдены.';
  if (status === 409) return 'Операция недоступна в текущем состоянии.';
  if (status === 502) return 'AI не смог обработать запрос.';
  if (status === 503 || status === 504) return 'AI-сервис временно недоступен.';
  return err instanceof Error && err.message ? err.message : defaultMessage;
};

const formatInlineText = (text: string) =>
  text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={`${part}-${index}`} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      ),
    );

const FormattedAIText: React.FC<{ text: string }> = ({ text }) => (
  <div className="[overflow-wrap:anywhere]">
    {text.split('\n').map((line, index) => {
      if (!line.trim()) return <div key={`space-${index}`} className="h-2" aria-hidden="true" />;
      if (line.startsWith('### ')) {
        return (
          <h4 key={`heading-${index}`} className="mb-1 mt-2 text-sm font-bold text-slate-900 first:mt-0">
            {formatInlineText(line.slice(4))}
          </h4>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <div key={`list-${index}`} className="my-1 flex items-start gap-2">
            <span className="mt-[0.65em] h-1 w-1 shrink-0 rounded-full bg-dsk-500" />
            <p className="min-w-0 flex-1">{formatInlineText(line.slice(2))}</p>
          </div>
        );
      }
      return (
        <p key={`paragraph-${index}`} className="my-1 first:mt-0 last:mb-0">
          {formatInlineText(line)}
        </p>
      );
    })}
  </div>
);

export const ManagerAIPanel: React.FC<ManagerAIPanelProps> = ({
  dealId,
  sessionId,
  clientName,
  apartmentNumber,
  basePrice,
  onApplyReplyText,
}) => {
  const [mode, setMode] = useState<ChatMode>('general');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [discount, setDiscount] = useState('');
  const [loadingMode, setLoadingMode] = useState<ChatMode | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeSessionIdRef = useRef(sessionId);

  activeSessionIdRef.current = sessionId;

  useEffect(() => {
    setMode('general');
    setMessages([]);
    setInput('');
    setDiscount('');
    setLoadingMode(null);
    setCopiedMessageId(null);
  }, [sessionId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const history = historyRef.current;
      if (history) history.scrollTo({ top: history.scrollHeight, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, loadingMode]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }, [input]);

  const appendMessage = (message: Omit<AIMessage, 'id' | 'createdAt'>) => {
    setMessages((current) => [
      ...current,
      { ...message, id: createMessageId(), createdAt: new Date().toISOString() },
    ]);
  };

  const appendError = (targetMode: ChatMode, error: unknown, fallback: string) => {
    appendMessage({
      role: 'system',
      text: formatAiError(error, fallback),
      mode: targetMode,
      error: true,
    });
  };

  const buildModePrompt = (targetMode: ChatMode, text: string) => {
    if (targetMode === 'negotiation') return `Переговоры по текущей сделке. ${text}`;
    if (targetMode === 'risks') return `Анализ строительных рисков по текущей сделке. ${text}`;
    return text;
  };

  const handleChatSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || loadingMode || mode === 'analysis' || mode === 'reply') return;

    const requestedMode = mode;
    const requestedSessionId = sessionId;
    appendMessage({ role: 'user', text, mode: requestedMode });
    setInput('');
    setLoadingMode(requestedMode);

    try {
      const response = await aiApi.askAssistant({
        message: buildModePrompt(requestedMode, text),
        session_id: requestedSessionId,
        deal_id: dealId,
      });
      if (activeSessionIdRef.current !== requestedSessionId) return;
      appendMessage({
        role: 'assistant',
        text: response.message,
        agent: response.agent,
        intent: response.intent,
        mode: requestedMode,
      });
    } catch (error) {
      if (activeSessionIdRef.current === requestedSessionId) {
        appendError(requestedMode, error, 'Не удалось получить ответ AI.');
      }
    } finally {
      if (activeSessionIdRef.current === requestedSessionId) setLoadingMode(null);
    }
  };

  const handleAnalyze = async () => {
    if (!dealId || loadingMode) return;
    const requestedSessionId = sessionId;
    setLoadingMode('analysis');
    try {
      const result = await aiApi.analyzeDialog(dealId);
      if (activeSessionIdRef.current !== requestedSessionId) return;
      appendMessage({
        role: 'system',
        text: result.analysis?.summary || result.summary || 'Анализ клиента завершён.',
        mode: 'analysis',
        analysis: result,
      });
    } catch (error) {
      if (activeSessionIdRef.current === requestedSessionId) {
        appendError('analysis', error, 'Не удалось проанализировать клиента.');
      }
    } finally {
      if (activeSessionIdRef.current === requestedSessionId) setLoadingMode(null);
    }
  };

  const handleReplyAssist = async () => {
    if (!dealId || loadingMode) return;
    const requestedSessionId = sessionId;
    setLoadingMode('reply');
    try {
      const result = await aiApi.replyAssist(dealId);
      if (activeSessionIdRef.current !== requestedSessionId) return;
      appendMessage({
        role: 'system',
        text: result.suggested_reply,
        intent: result.analysis?.intent,
        mode: 'reply',
        replyAssist: result,
      });
    } catch (error) {
      if (activeSessionIdRef.current === requestedSessionId) {
        appendError('reply', error, 'Не удалось подготовить черновик ответа.');
      }
    } finally {
      if (activeSessionIdRef.current === requestedSessionId) setLoadingMode(null);
    }
  };

  const handleOfferCreate = () => {
    const value = discount.trim().replace(',', '.');
    const prompt = value
      ? `Сформируй коммерческое предложение со скидкой ${value}%.`
      : 'Сформируй коммерческое предложение.';
    void handleChatSend(prompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleChatSend();
    }
  };

  const copyReply = async (message: AIMessage) => {
    try {
      await navigator.clipboard.writeText(message.replyAssist?.suggested_reply ?? message.text);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(null), 1500);
    } catch {
      setCopiedMessageId(null);
    }
  };

  const selectedMode = modes.find((item) => item.id === mode) ?? modes[0];
  const modeRequiresMissingDeal = selectedMode.requiresDeal && !dealId;
  const isStructuredMode = mode === 'analysis' || mode === 'reply';

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <header className="shrink-0 border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-dsk-50 text-dsk-600 ring-1 ring-dsk-100">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">AI-ассистент</h3>
              <p className="text-[10px] text-slate-500">Выберите сценарий и продолжайте диалог</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {clientName && <ContextBadge icon={UserRound} text={clientName} />}
            {apartmentNumber && <ContextBadge icon={Building2} text={`Квартира №${apartmentNumber}`} />}
            {dealId && <ContextBadge icon={FileText} text={`Сделка #${dealId}`} />}
          </div>
        </div>

        <nav className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Режим AI-ассистента">
          {modes.map((item) => {
            const Icon = item.icon;
            const active = item.id === mode;
            const disabled = Boolean(loadingMode) || (item.requiresDeal && !dealId);
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => setMode(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition ${
                  active
                    ? 'bg-dsk-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-dsk-200 hover:bg-dsk-50'
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <Icon className="h-3 w-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div ref={historyRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-4 py-4 sm:px-5" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex h-full min-h-36 flex-col items-center justify-center px-6 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-dsk-500 shadow-sm ring-1 ring-slate-200">
              <selectedMode.icon className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-slate-800">{selectedMode.label}</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{modeHints[mode]}</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            copied={copiedMessageId === message.id}
            onApplyReplyText={onApplyReplyText}
            onCopy={() => void copyReply(message)}
          />
        ))}

        {loadingMode && (
          <div className="flex justify-start">
            <div>
              <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold text-slate-600">
                <Sparkles className="h-3 w-3 text-dsk-600" />
                AI-ассистент
              </div>
              <div className="flex h-10 items-center gap-1 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 shadow-sm" aria-label="AI думает">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-3.5 py-3 shadow-[0_-4px_14px_rgba(15,23,42,0.04)]">
        {modeRequiresMissingDeal ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Для этого диалога не найдена связанная сделка.
          </div>
        ) : (
          <>
            {quickActions[mode] && (
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
                {quickActions[mode]?.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    disabled={Boolean(loadingMode)}
                    onClick={() => void handleChatSend(action.prompt)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:border-dsk-200 hover:bg-dsk-50 hover:text-dsk-700 disabled:opacity-40"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {mode === 'offer' && (
              <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-2">
                {basePrice !== undefined && (
                  <span className="mr-auto text-[10px] text-slate-500">
                    Базовая цена: <strong className="text-slate-700">{formatPrice(basePrice)}</strong>
                  </span>
                )}
                <label htmlFor="ai-offer-discount" className="text-[10px] font-medium text-slate-600">Скидка:</label>
                <div className="relative w-20">
                  <input
                    id="ai-offer-discount"
                    type="text"
                    inputMode="decimal"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                    disabled={Boolean(loadingMode)}
                    placeholder="3"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 pr-6 text-xs font-semibold text-slate-800 outline-none focus:border-dsk-300"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                </div>
                <button
                  type="button"
                  onClick={handleOfferCreate}
                  disabled={Boolean(loadingMode)}
                  className="rounded-lg bg-dsk-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-dsk-700 disabled:opacity-40"
                >
                  Сформировать КП
                </button>
              </div>
            )}

            {mode === 'analysis' ? (
              <button
                type="button"
                onClick={() => void handleAnalyze()}
                disabled={Boolean(loadingMode)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-dsk-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-dsk-700 disabled:opacity-40"
              >
                {loadingMode === 'analysis' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundSearch className="h-4 w-4" />}
                Анализировать клиента
              </button>
            ) : mode === 'reply' ? (
              <button
                type="button"
                onClick={() => void handleReplyAssist()}
                disabled={Boolean(loadingMode)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-dsk-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-dsk-700 disabled:opacity-40"
              >
                {loadingMode === 'reply' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                Подготовить черновик
              </button>
            ) : (
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-dsk-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-dsk-100">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Введите сообщение..."
                  disabled={Boolean(loadingMode)}
                  className="min-h-[40px] max-h-24 flex-1 resize-none overflow-y-auto bg-transparent px-2.5 py-2.5 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => void handleChatSend()}
                  disabled={Boolean(loadingMode) || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dsk-600 text-white transition hover:bg-dsk-700 disabled:bg-slate-200 disabled:text-slate-400"
                  aria-label="Отправить сообщение AI"
                >
                  {loadingMode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            )}
          </>
        )}
      </footer>
    </section>
  );
};

const MessageItem: React.FC<{
  message: AIMessage;
  copied: boolean;
  onApplyReplyText?: (text: string) => void;
  onCopy: () => void;
}> = ({ message, copied, onApplyReplyText, onCopy }) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[74%]">
          <div className="rounded-2xl rounded-br-md bg-dsk-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.text}</p>
          </div>
          <MessageMeta message={message} align="right" />
        </div>
      </div>
    );
  }

  if (message.analysis) return <AnalysisMessage message={message} result={message.analysis} />;
  if (message.replyAssist) {
    return (
      <ReplyMessage
        message={message}
        result={message.replyAssist}
        copied={copied}
        onApplyReplyText={onApplyReplyText}
        onCopy={onCopy}
      />
    );
  }

  if (message.role === 'system') {
    return (
      <div className={`mx-auto flex max-w-[88%] items-start gap-2 rounded-xl border px-3.5 py-3 text-xs ${message.error ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-600'}`}>
        <AlertCircle className={`mt-0.5 h-4 w-4 shrink-0 ${message.error ? 'text-rose-500' : 'text-slate-400'}`} />
        <span>{message.text}</span>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="min-w-0 max-w-[82%]">
        <div className="mb-1.5 flex items-center gap-2 px-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dsk-50 text-dsk-600">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold text-slate-700">AI-ассистент</span>
          {message.agent && (
            <span className="rounded-full bg-dsk-50 px-2 py-0.5 text-[9px] font-semibold text-dsk-700">
              {modeAgentLabels[message.agent] ?? message.agent}
            </span>
          )}
        </div>
        <article className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3.5 text-[14px] leading-[1.6] text-slate-700 shadow-sm">
          <FormattedAIText text={message.text} />
          <MessageMeta message={message} />
        </article>
      </div>
    </div>
  );
};

const MessageMeta: React.FC<{ message: AIMessage; align?: 'left' | 'right' }> = ({
  message,
  align = 'left',
}) => (
  <div className={`mt-1 flex items-center gap-2 px-1 text-[9px] text-slate-400 ${align === 'right' ? 'justify-end' : ''}`}>
    <time dateTime={message.createdAt}>
      {new Date(message.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
    </time>
    {message.intent && <span>{message.intent}</span>}
  </div>
);

const AnalysisMessage: React.FC<{ message: AIMessage; result: DialogAnalysisResult }> = ({
  message,
  result,
}) => {
  const facts = result.analysis;
  const legacyFacts = result.client_needs;
  const importantFactors = facts?.important_factors ?? [];
  const objections = facts?.objections ?? result.objections ?? [];
  const summary = facts?.summary ?? result.summary;
  return (
    <article className="mx-auto max-w-[94%] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <UserRoundSearch className="h-4 w-4 text-dsk-600" />
          <h4 className="text-sm font-bold text-slate-900">Анализ клиента</h4>
        </div>
        <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${result.preferences_updated ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {result.preferences_updated ? 'Профиль обновлён' : 'Не сохранено'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {facts?.budget_min != null && <Fact label="Бюджет от" value={formatPrice(facts.budget_min)} />}
        {(facts?.budget_max ?? legacyFacts?.budget_max) != null && (
          <Fact label="Бюджет до" value={formatPrice((facts?.budget_max ?? legacyFacts?.budget_max)!)} />
        )}
        {(facts?.rooms ?? legacyFacts?.rooms) != null && (
          <Fact label="Комнат" value={String(facts?.rooms ?? legacyFacts?.rooms)} />
        )}
        {facts?.floor_min != null && <Fact label="Минимальный этаж" value={String(facts.floor_min)} />}
        {facts?.parking_required != null && <Fact label="Парковка" value={facts.parking_required ? 'Нужна' : 'Не обязательна'} />}
        {facts?.renovation_required != null && <Fact label="Ремонт" value={facts.renovation_required ? 'Нужен' : 'Не обязателен'} />}
        {(facts?.preferred_district ?? legacyFacts?.district) && (
          <Fact label="Район" value={(facts?.preferred_district ?? legacyFacts?.district)!} />
        )}
        {legacyFacts?.preferred_finishing && <Fact label="Отделка" value={legacyFacts.preferred_finishing} />}
      </div>
      {summary && <p className="mt-3 text-xs leading-relaxed text-slate-600">{summary}</p>}
      {importantFactors.length > 0 && <TagList title="Важные факторы" values={importantFactors} />}
      {objections.length > 0 && <TagList title="Возражения" values={objections} tone="amber" />}
      <MessageMeta message={message} />
    </article>
  );
};

const ReplyMessage: React.FC<{
  message: AIMessage;
  result: ReplyAssistResult;
  copied: boolean;
  onApplyReplyText?: (text: string) => void;
  onCopy: () => void;
}> = ({ message, result, copied, onApplyReplyText, onCopy }) => (
  <article className="mx-auto max-w-[94%] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <Bot className="h-4 w-4 text-dsk-600" />
      <h4 className="text-sm font-bold text-slate-900">Черновик ответа</h4>
      {result.analysis?.intent && <span className="text-[9px] text-slate-400">{result.analysis.intent}</span>}
    </div>
    {result.analysis?.summary && <p className="mb-3 text-[11px] leading-relaxed text-slate-500">{result.analysis.summary}</p>}
    <div className="rounded-xl bg-slate-50 p-3.5 text-[14px] leading-[1.6] text-slate-700">
      <FormattedAIText text={result.suggested_reply} />
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <MessageMeta message={message} />
      {onApplyReplyText && (
        <button
          type="button"
          onClick={() => onApplyReplyText(result.suggested_reply)}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-dsk-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-dsk-700"
        >
          <Check className="h-3.5 w-3.5" />
          Вставить в ответ клиенту
        </button>
      )}
      <button
        type="button"
        onClick={onCopy}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? 'Скопировано' : 'Скопировать'}
      </button>
    </div>
  </article>
);

const ContextBadge: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}> = ({ icon: Icon, text }) => (
  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">
    <Icon className="h-3 w-3 text-slate-400" />
    {text}
  </span>
);

const Fact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2">
    <span className="block text-[9px] uppercase tracking-wide text-slate-400">{label}</span>
    <span className="mt-0.5 block font-semibold text-slate-800">{value}</span>
  </div>
);

const TagList: React.FC<{ title: string; values: string[]; tone?: 'default' | 'amber' }> = ({
  title,
  values,
  tone = 'default',
}) => (
  <div className="mt-3">
    <p className="mb-1.5 text-[10px] font-semibold text-slate-500">{title}</p>
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className={`rounded-full px-2 py-1 text-[10px] ${tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
        >
          {value}
        </span>
      ))}
    </div>
  </div>
);
