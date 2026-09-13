import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Building2, Check, Clock, UserCheck, Shield, FileText, Loader2, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ChatSession, Message, Apartment, Deal } from '../../types';
import { chatsApi } from '../../api/chats';
import { apartmentsApi } from '../../api/apartments';
import { dealsApi } from '../../api/deals';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatPrice, getRoomsLabel, getChatSessionStatusBadge } from '../../lib/utils';
import { ManagerAIPanel } from './ManagerAIPanel';
import { ApartmentModal } from '../apartments/ApartmentModal';

interface ChatRoomProps {
  sessionId: number;
  onSessionUpdated?: () => void;
  onSessionTaken?: (sess: ChatSession) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ sessionId, onSessionUpdated, onSessionTaken }) => {
  const { user } = useAuth();
  const isStaff = user?.role === 'manager' || user?.role === 'supervisor';

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [relatedDeal, setRelatedDeal] = useState<Deal | null>(null);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApartmentModal, setShowApartmentModal] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  const loadSessionData = async () => {
    try {
      const sess = await chatsApi.getSession(sessionId, isStaff);
      setSession(sess);

      if (sess.id_apartment) {
        try {
          const apt = await apartmentsApi.getApartment(sess.id_apartment);
          setApartment(apt);
        } catch {
          setApartment(null);
        }
      } else {
        setApartment(null);
      }

      try {
        const dealsList = isStaff ? await dealsApi.getAllDeals() : await dealsApi.getMyDeals();
        const deal = dealsList.find((d) => d.id_chat_session === sessionId);
        setRelatedDeal(deal || null);
      } catch {
        setRelatedDeal(null);
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
    isInitialLoadRef.current = true;
    prevMsgCountRef.current = 0;
    setSession(null);
    setApartment(null);
    setRelatedDeal(null);
    setMessages([]);
    setLoadingSession(true);
    setInputText('');
    loadSessionData();
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [sessionId, isStaff]);

  // Only scroll down on initial session load or when new message count increases
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoadRef.current) {
        scrollToBottom();
        isInitialLoadRef.current = false;
        prevMsgCountRef.current = messages.length;
      } else if (messages.length > prevMsgCountRef.current) {
        scrollToBottom();
        prevMsgCountRef.current = messages.length;
      }
    }
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
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const handleTakeSession = async () => {
    try {
      const updated = await chatsApi.takeSession(sessionId);
      setSession(updated);
      onSessionUpdated?.();
      onSessionTaken?.(updated);
    } catch (e) {
      console.error('Failed to take session:', e);
    }
  };



  const handleOpenDealPage = () => {
    if (relatedDeal) {
      window.open(`/deals/${relatedDeal.id}`, '_blank');
    } else {
      const query = new URLSearchParams();
      query.append('session', sessionId.toString());
      if (session?.id_user) query.append('user_id', session.id_user.toString());
      if (session?.id_apartment) query.append('apartment_id', session.id_apartment.toString());
      window.open(`/deals/new?${query.toString()}`, '_blank');
    }
  };

  if (loadingSession && !session) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-white rounded-2xl border-2 border-zinc-900">
        <div className="flex flex-col items-center gap-2 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
          <p className="text-xs font-bold uppercase tracking-wider">Загрузка диалога...</p>
        </div>
      </div>
    );
  }

  const isApartmentSpecific = Boolean(session?.id_apartment);
  const sessionStatusBadge = getChatSessionStatusBadge(session?.status || 'open');

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border-2 border-zinc-900 overflow-hidden shadow-xs">
      
      {/* Top Chat Header */}
      <div className="px-5 py-3.5 border-b-2 border-zinc-900 bg-[#FAF8F2] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-zinc-900">
                {isStaff
                  ? session?.user_name || session?.guest_name || 'Клиент'
                  : session?.employee_name || (session?.id_employee ? 'Менеджер отдела продаж' : 'Менеджер отдела продаж ДСК')}
              </h3>
              {isApartmentSpecific && (
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border-2 ${sessionStatusBadge.color}`}
                >
                  {sessionStatusBadge.label}
                </span>
              )}
            </div>

            {apartment ? (
              <button
                type="button"
                onClick={() => setShowApartmentModal(true)}
                className="text-xs text-zinc-800 hover:text-zinc-950 font-bold flex items-center gap-1.5 mt-0.5 hover:underline text-left cursor-pointer transition-colors"
                title="Нажмите, чтобы посмотреть подробную информацию о квартире"
              >
                <span>Квартира №{apartment.number}, {getRoomsLabel(apartment.rooms)}</span>
              </button>
            ) : (
              <p className="text-xs text-zinc-500 font-medium">Общие вопросы по подбору и покупке</p>
            )}
          </div>
        </div>

        {/* Header Actions (Only for Apartment-Specific Deals) */}
        {isApartmentSpecific && (
          <div className="flex items-center gap-2 flex-wrap">
            {isStaff && session?.status === 'open' && !session.id_employee && (
              <button
                onClick={handleTakeSession}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-zinc-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Взять обращение
              </button>
            )}

            {isStaff ? (
              (session?.status === 'in_progress' || session?.status === 'pending_approval' || session?.status === 'contract' || session?.id_employee) && (
                <button
                  onClick={handleOpenDealPage}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border-2 border-zinc-900 hover:bg-zinc-100 text-zinc-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-700" />
                  {relatedDeal ? 'Открыть сделку' : 'Оформить сделку'}
                </button>
              )
            ) : (
              relatedDeal && (
                <button
                  onClick={handleOpenDealPage}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border-2 border-zinc-900 hover:bg-zinc-100 text-zinc-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-700" />
                  Открыть сделку
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Staff AI Assistant Bar (available on all staff sessions) */}
      {isStaff && (
        <div className="p-3 border-b-2 border-zinc-900 bg-[#FAF8F2]">
          <ManagerAIPanel
            sessionId={sessionId}
            dealId={relatedDeal?.id}
            onApplyReplyText={(replyText) => setInputText(replyText)}
          />
        </div>
      )}

      {/* Message History Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#FAF8F2]/30">
        
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-1">
            <p className="text-sm font-bold text-zinc-700">Диалог открыт</p>
            <p className="text-xs text-zinc-500">Задайте любой интересующий вас вопрос по объекту или условиям покупки</p>
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
                  <div className="px-3.5 py-1 bg-white border-2 border-zinc-900 text-zinc-800 rounded-full text-[11px] font-bold max-w-md text-center shadow-xs">
                    {msg.content}
                  </div>
                </div>
              );
            }

            if (isAI) {
              return (
                <div key={msg.id} className="flex justify-start my-2">
                  <div className="max-w-[85%] bg-[#FFFDF8] border-2 border-zinc-900 text-zinc-900 p-4 rounded-2xl text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-zinc-900 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      ИИ-Консультант ДСК
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                    <span className="text-[10px] text-zinc-400 font-semibold block text-right">
                      {formatDateTime(msg.sended_at)}
                    </span>
                  </div>
                </div>
              );
            }

            const senderDisplayName = isMe
              ? 'Вы'
              : msg.sender_type === 'manager'
              ? msg.sender_name || session?.employee_name || 'Менеджер отдела продаж'
              : msg.sender_name || session?.user_name || session?.guest_name || 'Клиент';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {senderDisplayName}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {formatDateTime(msg.sended_at)}
                  </span>
                </div>

                <div
                  className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed break-words border-2 ${
                    isMe
                      ? 'bg-zinc-900 text-white border-zinc-900 rounded-br-xs'
                      : 'bg-white text-zinc-900 border-zinc-900 rounded-bl-xs shadow-xs font-medium'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Composer or Take Prompt */}
      {isStaff && isApartmentSpecific && session?.status === 'open' && !session.id_employee ? (
        <div className="p-4 border-t-2 border-zinc-900 bg-[#FAF8F2] flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-600 font-bold">
            Чтобы начать диалог по квартире и оформить сделку, примите заявку в работу.
          </p>
          <button
            onClick={handleTakeSession}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border-2 border-zinc-900 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Взять обращение
          </button>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="p-3 border-t-2 border-zinc-900 bg-white flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isStaff
                ? 'Напишите ответ клиенту (или используйте подсказку ИИ)...'
                : 'Задайте вопрос по квартире или условиям покупки...'
            }
            className="flex-1 px-3.5 py-2.5 bg-white border-2 border-zinc-900 rounded-xl text-xs font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-[#FAF8F2] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 flex-shrink-0 transition-colors disabled:opacity-40 border-2 border-zinc-900 cursor-pointer"
            title="Отправить сообщение"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Отправить</span>
          </button>
        </form>
      )}

      {/* Modal: Apartment Details */}
      {showApartmentModal && apartment && (
        <ApartmentModal
          apartment={apartment}
          onClose={() => setShowApartmentModal(false)}
        />
      )}

    </div>
  );
};
