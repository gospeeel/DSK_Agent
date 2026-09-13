import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Building2, Check, Clock, UserCheck, Shield, FileText, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { ChatSession, Message, Apartment, Deal } from '../../types';
import { chatsApi } from '../../api/chats';
import { apartmentsApi } from '../../api/apartments';
import { dealsApi } from '../../api/deals';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatPrice, getRoomsLabel } from '../../lib/utils';
import { ManagerAIPanel } from './ManagerAIPanel';
import { CreateDealModal } from './CreateDealModal';

interface ChatRoomProps {
  sessionId: number;
  onSessionUpdated?: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ sessionId, onSessionUpdated }) => {
  const { user } = useAuth();
  const isStaff = user?.role === 'manager' || user?.role === 'supervisor';

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [relatedDeal, setRelatedDeal] = useState<Deal | null>(null);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [showDealModal, setShowDealModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessionData = async () => {
    try {
      const sess = await chatsApi.getSession(sessionId, isStaff);
      setSession(sess);

      // Fetch apartment if attached
      if (sess.id_apartment) {
        try {
          const apt = await apartmentsApi.getApartment(sess.id_apartment);
          setApartment(apt);
        } catch {
          // ignore
        }
      }

      // If staff, look for related deal
      if (isStaff) {
        try {
          const allDeals = await dealsApi.getAllDeals();
          const deal = allDeals.find((d) => d.id_chat_session === sessionId);
          if (deal) setRelatedDeal(deal);
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.warn('Error loading session:', e);
    } finally {
      setLoadingSession(false);
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = await chatsApi.getMessages(sessionId, isStaff);
      setMessages(msgs || []);
    } catch (e) {
      console.warn('Error loading messages:', e);
    }
  };

  useEffect(() => {
    loadSessionData();
    loadMessages();
    const interval = setInterval(loadMessages, 3500);
    return () => clearInterval(interval);
  }, [sessionId, isStaff]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await chatsApi.sendMessage(sessionId, content, isStaff);
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();
      onSessionUpdated?.();
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(content); // restore on error
    } finally {
      setSending(false);
    }
  };

  const handleTakeSession = async () => {
    try {
      const updated = await chatsApi.takeSession(sessionId);
      setSession(updated);
      onSessionUpdated?.();
    } catch (e) {
      console.error('Failed to take session:', e);
    }
  };

  if (loadingSession && !session) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-white rounded-3xl border border-slate-200">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-dsk-600" />
          <p className="text-xs">Загрузка диалога...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-soft overflow-hidden">
      
      {/* Top Chat Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-dsk-100 text-dsk-700 flex items-center justify-center font-bold text-sm shadow-sm border border-dsk-200">
            {isStaff ? (
              <UserIcon className="w-5 h-5" />
            ) : (
              <Building2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {isStaff
                  ? session?.guest_name || `Клиент #${session?.id_user || 'Гость'}`
                  : 'Менеджер отдела продаж ДСК'}
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  session?.status === 'in_progress'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : session?.status === 'open'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {session?.status === 'in_progress'
                  ? 'В работе'
                  : session?.status === 'open'
                  ? 'Ожидает менеджера'
                  : 'Завершён'}
              </span>
            </div>

            {/* Apartment or Subject Subtitle */}
            {apartment ? (
              <p className="text-xs text-dsk-700 font-medium flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                Интересует: кв. №{apartment.number}, {getRoomsLabel(apartment.rooms)} ({formatPrice(apartment.price)})
              </p>
            ) : (
              <p className="text-xs text-slate-400">Общие вопросы по подбору и покупке</p>
            )}
          </div>
        </div>

        {/* Manager Header Actions */}
        {isStaff && (
          <div className="flex items-center gap-2">
            {session?.status === 'open' && (
              <button
                onClick={handleTakeSession}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Взять обращение
              </button>
            )}

            <button
              onClick={() => setShowDealModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-dsk-600 hover:bg-dsk-700 transition-colors shadow-sm shadow-dsk-600/20 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              {relatedDeal ? `Сделка #${relatedDeal.id}` : 'Оформить сделку'}
            </button>
          </div>
        )}
      </div>

      {/* Staff AI Assistant Bar (Only for Manager / Supervisor) */}
      {isStaff && (
        <div className="p-3 border-b border-slate-100 bg-slate-900/5">
          <ManagerAIPanel
            sessionId={sessionId}
            dealId={relatedDeal?.id}
            onApplyReplyText={(replyText) => setInputText(replyText)}
          />
        </div>
      )}

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <p className="text-sm font-medium">Диалог начат</p>
            <p className="text-xs mt-1">Задайте любой интересующий вас вопрос по объекту или условиям покупки</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe =
              (!isStaff && msg.sender_type === 'client') ||
              (isStaff && msg.sender_type === 'manager');

            const isAI = msg.sender_type === 'ai';
            const isSystem = msg.sender_type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[11px] font-medium max-w-md text-center">
                    {msg.content}
                  </div>
                </div>
              );
            }

            if (isAI) {
              return (
                <div key={msg.id} className="flex justify-start my-2">
                  <div className="max-w-[85%] bg-purple-50 border border-purple-200 text-purple-900 p-3.5 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-purple-700">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Консультант
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <span className="text-[10px] text-purple-400 block text-right">
                      {formatDateTime(msg.sended_at)}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {isMe
                      ? 'Вы'
                      : msg.sender_type === 'manager'
                      ? 'Менеджер ДСК'
                      : 'Клиент'}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {formatDateTime(msg.sended_at)}
                  </span>
                </div>

                <div
                  className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                    isMe
                      ? 'bg-dsk-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isStaff
              ? 'Напишите ответ клиенту (или используйте черновик AI)...'
              : 'Задайте вопрос по квартире или условиям покупки...'
          }
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-dsk-500 focus:bg-white transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="p-3 bg-dsk-600 hover:bg-dsk-700 text-white rounded-2xl transition-colors shadow-md shadow-dsk-600/20 disabled:opacity-40 shrink-0"
          title="Отправить сообщение"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      {/* Modal: Create Deal from Chat */}
      {showDealModal && session && (
        <CreateDealModal
          session={session}
          apartment={apartment}
          onClose={() => setShowDealModal(false)}
          onSuccess={(deal) => {
            setRelatedDeal(deal);
            setShowDealModal(false);
            onSessionUpdated?.();
          }}
        />
      )}

    </div>
  );
};
