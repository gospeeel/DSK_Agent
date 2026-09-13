import React, { useState, useEffect } from 'react';
import { Bot, Send, X, Loader2, Sparkles, Layers } from 'lucide-react';
import { aiApi } from '../../api/ai';
import { dealsApi } from '../../api/deals';
import { Deal } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface GlobalAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDealId?: number;
}

interface AIChatHistoryItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  agent?: string;
  intent?: string;
  timestamp: string;
}

export const GlobalAIAssistantModal: React.FC<GlobalAIAssistantModalProps> = ({
  isOpen,
  onClose,
  defaultDealId,
}) => {
  const { user } = useAuth();
  const isStaff = user?.role === 'manager' || user?.role === 'supervisor';

  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<number | undefined>(defaultDealId);
  const [parkingUnitId, setParkingUnitId] = useState<string>('');
  const [storageUnitId, setStorageUnitId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<AIChatHistoryItem[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Здравствуйте! Я общий ИИ-ассистент ДСК (Агент-Роутер). Вы можете задавать мне вопросы по строительным регламентам, отделке, ипотечным программам и правилам компании, либо выбрать конкретную сделку для консультации по объекту.',
      agent: 'RouterAgent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      const fetchDeals = isStaff ? dealsApi.getAllDeals() : dealsApi.getMyDeals();
      fetchDeals
        .then((data) => setDeals(data))
        .catch(() => {});
      if (defaultDealId) {
        setSelectedDealId(defaultDealId);
      }
    }
  }, [isOpen, defaultDealId, isStaff]);

  if (!isOpen) return null;

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage.trim();
    if (!textToSend || isLoading) return;

    setErrorMsg(null);
    const userMsg: AIChatHistoryItem = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setIsLoading(true);

    try {
      const targetSessionId = selectedDealId
        ? (deals.find((d) => d.id === selectedDealId)?.id_chat_session || 1)
        : 1;

      const pId = parkingUnitId ? parseInt(parkingUnitId, 10) : undefined;
      const sId = storageUnitId ? parseInt(storageUnitId, 10) : undefined;

      const res = await aiApi.askAssistant(
        {
          session_id: targetSessionId,
          deal_id: selectedDealId,
          parking_unit_id: isNaN(pId as number) ? undefined : pId,
          storage_unit_id: isNaN(sId as number) ? undefined : sId,
          message: textToSend,
        },
        isStaff
      );

      const aiMsg: AIChatHistoryItem = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.message,
        agent: res.agent || 'RouterAgent',
        intent: res.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const msg = err.status === 502
        ? 'AI-сервер недоступен (проверьте GIGACHAT_CREDENTIALS в конфигурации).'
        : err.message || 'Ошибка обработки запроса ИИ.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Какие условия рассрочки и льготной ипотеки действуют?',
    'Какие типы отделки доступны в объектах ДСК?',
    'Как регламентируется согласование скидок выше 5%?',
    'Каковы сроки устранения строительных задержек по регламенту?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl border-2 border-zinc-900 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="h-16 px-6 border-b-2 border-zinc-900 flex items-center justify-between bg-[#FAF8F2] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-zinc-900">
                  ИИ-Ассистент Сотрудника (Роутер)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white border border-zinc-900 text-zinc-900">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-zinc-600 font-medium">
                Консультации по регламентам, общим вопросам и объектам ДСК
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border-2 border-zinc-900 hover:bg-zinc-100 text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-[#FAF8F2]/30">
          {chatHistory.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  {item.sender === 'user' ? 'Вы' : `ИИ-Ассистент [${item.agent || 'Router'}]`}
                </span>
                {item.intent && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-white border border-zinc-900 text-zinc-900 font-bold">
                    {item.intent}
                  </span>
                )}
                <span className="text-[10px] text-zinc-400">{item.timestamp}</span>
              </div>

              <div
                className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed border-2 ${
                  item.sender === 'user'
                    ? 'bg-zinc-900 text-white border-zinc-900 rounded-br-xs'
                    : 'bg-white border-zinc-900 text-zinc-900 rounded-bl-xs shadow-xs font-medium'
                }`}
              >
                <div className="whitespace-pre-wrap">{item.text}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 p-3.5 bg-white border-2 border-zinc-900 rounded-2xl max-w-sm text-xs font-bold text-zinc-900 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
              <span>ИИ обрабатывает запрос...</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border-2 border-zinc-900 text-rose-900 rounded-2xl text-xs font-bold shadow-xs">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="p-3 border-t-2 border-zinc-900 bg-[#FAF8F2] flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-extrabold text-zinc-900 uppercase tracking-wider whitespace-nowrap">
            Вопросы:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="text-xs font-bold px-3.5 py-1.5 bg-white border-2 border-zinc-900 rounded-xl text-zinc-900 hover:bg-zinc-100 transition-all whitespace-nowrap flex-shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3.5 border-t-2 border-zinc-900 bg-white flex items-center gap-2 flex-shrink-0">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Задайте вопрос ИИ по регламентам, ипотеке, строительству или объекту..."
            className="flex-1 h-11 px-4 bg-[#FAF8F2] border-2 border-zinc-900 rounded-xl text-xs font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="h-11 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-40 transition-all border-2 border-zinc-900 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Спросить</span>
          </button>
        </div>

      </div>
    </div>
  );
};
