import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, MessageSquare, FileText, Download, Building2, Plus, Sparkles, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatsApi } from '../api/chats';
import { dealsApi } from '../api/deals';
import { apartmentsApi } from '../api/apartments';
import { ChatSession, Deal, Offer, Apartment } from '../types';
import { ChatRoom } from '../components/chat/ChatRoom';
import { formatPrice, getDealStatusBadge, getOfferStatusBadge, formatDate } from '../lib/utils';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [apartmentsMap, setApartmentsMap] = useState<Record<number, Apartment>>({});

  const [activeSessionId, setActiveSessionId] = useState<number | null>(() => {
    const fromUrl = searchParams.get('session');
    return fromUrl ? Number(fromUrl) : null;
  });

  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userSessions, userDeals, userOffers] = await Promise.all([
        chatsApi.getMySessions().catch(() => []),
        dealsApi.getMyDeals().catch(() => []),
        dealsApi.getMyOffers().catch(() => []),
      ]);

      setSessions(userSessions);
      setDeals(userDeals);
      setOffers(userOffers);

      // Select first session if none selected
      if (!activeSessionId && userSessions.length > 0) {
        setActiveSessionId(userSessions[0].id);
      }

      // Fetch apartment details for sessions
      const aptIds = Array.from(new Set(userSessions.map((s) => s.id_apartment).filter(Boolean))) as number[];
      const map: Record<number, Apartment> = {};
      for (const id of aptIds) {
        try {
          map[id] = await apartmentsApi.getApartment(id);
        } catch {
          // ignore
        }
      }
      setApartmentsMap(map);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartGeneralChat = async () => {
    try {
      const newSession = await chatsApi.createSession({});
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const handleDownloadPdf = async (offerId: number) => {
    setDownloadingPdf(offerId);
    try {
      const blob = await dealsApi.downloadOfferPdf(offerId, false);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `коммерческое_предложение_${offerId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('PDF доступен только для согласованных предложений.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* User Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-dsk-600 to-blue-400 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-dsk-600/20">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : <User className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user?.name || 'Покупатель'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Покупатель
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            {user?.budget_max && (
              <p className="text-xs text-dsk-700 font-semibold mt-1">
                Планируемый бюджет: до {formatPrice(user.budget_max)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartGeneralChat}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-dsk-600 hover:bg-dsk-700 transition-colors shadow-sm shadow-dsk-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Задать общий вопрос менеджеру
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Chat List & Deals, Right Active Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Left Column: Chats & Deals list (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Chats section */}
          <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-dsk-600" />
                <h2 className="text-sm font-bold text-slate-900">Мои обращения и чаты</h2>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{sessions.length}</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-dsk-600" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                У вас пока нет активных чатов. Выберите квартиру в каталоге и напишите менеджеру!
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {sessions.map((sess) => {
                  const apt = sess.id_apartment ? apartmentsMap[sess.id_apartment] : null;
                  const isActive = activeSessionId === sess.id;

                  return (
                    <div
                      key={sess.id}
                      onClick={() => setActiveSessionId(sess.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-dsk-50 border-dsk-300 shadow-sm'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {apt ? `Квартира №${apt.number}` : 'Общий диалог'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(sess.updated_at)}
                        </span>
                      </div>

                      {apt ? (
                        <p className="text-[11px] text-slate-500 truncate">
                          {apt.rooms}-комн., {apt.area} м² • {formatPrice(apt.price)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400">Подбор и консультация</p>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            sess.status === 'in_progress'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sess.status === 'in_progress' ? 'Менеджер на связи' : 'В очереди'}
                        </span>
                        <span className="text-[10px] text-dsk-600 font-semibold">
                          Открыть диалог →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deals & Commercial Offers section */}
          <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Мои сделки и КП</h2>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{deals.length}</span>
            </div>

            {deals.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Здесь будут отображаться ваши оформленные сделки и предложения.
              </p>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => {
                  const badge = getDealStatusBadge(deal.status);
                  const matchingOffer = offers.find((o) => o.deal_id === deal.id && o.status === 'approved');

                  return (
                    <div key={deal.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Сделка #{deal.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-600">
                        <span>Итоговая цена:</span>
                        <strong className="text-slate-900 font-bold">{formatPrice(deal.total_price)}</strong>
                      </div>

                      {deal.percent_discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Скидка:</span>
                          <span>{deal.percent_discount}%</span>
                        </div>
                      )}

                      {/* PDF Download Button if approved offer exists */}
                      {matchingOffer && (
                        <button
                          onClick={() => handleDownloadPdf(matchingOffer.id)}
                          disabled={downloadingPdf === matchingOffer.id}
                          className="w-full mt-2 py-2 px-3 rounded-xl bg-white hover:bg-dsk-50 border border-dsk-200 text-dsk-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-dsk-600" />
                          {downloadingPdf === matchingOffer.id ? 'Скачивание...' : 'Скачать официальное КП (PDF)'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Interactive Chat Room (8 cols) */}
        <div className="lg:col-span-8 h-[650px]">
          {activeSessionId ? (
            <ChatRoom
              sessionId={activeSessionId}
              onSessionUpdated={loadData}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
              <h3 className="text-base font-bold text-slate-700">Выберите диалог</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Выберите диалог из списка слева или задайте вопрос по понравившейся квартире из каталога.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
