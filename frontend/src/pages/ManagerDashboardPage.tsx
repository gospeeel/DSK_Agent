import React, { useState, useEffect } from 'react';
import { User, MessageSquare, Inbox, Sparkles, FileText, CheckCircle2, Clock, RefreshCw, UserCheck, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatsApi } from '../api/chats';
import { dealsApi } from '../api/deals';
import { apartmentsApi } from '../api/apartments';
import { ChatSession, Deal, Apartment } from '../types';
import { ChatRoom } from '../components/chat/ChatRoom';
import { formatPrice, formatDate } from '../lib/utils';

export const ManagerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [apartmentsMap, setApartmentsMap] = useState<Record<number, Apartment>>({});

  const [activeTab, setActiveTab] = useState<'my' | 'queue'>('my');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadManagerData = async () => {
    try {
      const [sessionsData, dealsData] = await Promise.all([
        chatsApi.getAllSessions().catch(() => []),
        dealsApi.getAllDeals().catch(() => []),
      ]);

      setAllSessions(sessionsData);
      setDeals(dealsData);

      // Fetch apartment details for sessions
      const aptIds = Array.from(new Set(sessionsData.map((s) => s.id_apartment).filter(Boolean))) as number[];
      const map: Record<number, Apartment> = {};
      for (const id of aptIds) {
        try {
          map[id] = await apartmentsApi.getApartment(id);
        } catch {
          // ignore
        }
      }
      setApartmentsMap(map);

      // If active session not set, select first
      if (!activeSessionId && sessionsData.length > 0) {
        const myFirst = sessionsData.find((s) => s.id_employee === user?.id);
        if (myFirst) setActiveSessionId(myFirst.id);
        else setActiveSessionId(sessionsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load manager workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagerData();
    const interval = setInterval(loadManagerData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Split sessions into "My active" and "Queue"
  const mySessions = allSessions.filter((s) => s.id_employee === user?.id);
  const queueSessions = allSessions.filter((s) => !s.id_employee || s.status === 'open');

  const visibleSessions = (activeTab === 'my' ? mySessions : queueSessions).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const apt = s.id_apartment ? apartmentsMap[s.id_apartment] : null;
    return (
      (s.guest_name && s.guest_name.toLowerCase().includes(q)) ||
      (apt && apt.number.includes(q)) ||
      s.id.toString().includes(q)
    );
  });

  const myActiveDealsCount = deals.filter((d) => d.id_employee === user?.id && d.status !== 'completed' && d.status !== 'cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Manager Header & Stats */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-dsk-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-dsk-600/20">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : <User className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user?.name || 'Менеджер'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-dsk-700 border border-blue-200">
                Менеджер продаж
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Mini stats cards */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial p-3 px-4 rounded-2xl bg-dsk-50 border border-dsk-100 text-center">
            <span className="text-[10px] font-bold text-dsk-700 uppercase tracking-wider block">Мои клиенты</span>
            <span className="text-lg font-black text-dsk-900">{mySessions.length}</span>
          </div>
          <div className="flex-1 md:flex-initial p-3 px-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Очередь</span>
            <span className="text-lg font-black text-amber-900">{queueSessions.length}</span>
          </div>
          <div className="flex-1 md:flex-initial p-3 px-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Сделки в работе</span>
            <span className="text-lg font-black text-emerald-900">{myActiveDealsCount}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        
        {/* Left Column: Chat Queues (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/90 space-y-4">
            
            {/* Tabs */}
            <div className="bg-slate-100 p-1 rounded-2xl flex text-xs font-bold">
              <button
                onClick={() => setActiveTab('my')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'my'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Мои чаты ({mySessions.length})
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'queue'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                Очередь ({queueSessions.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по клиенту или квартире..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-dsk-500"
              />
            </div>

            {/* Sessions List */}
            {loading ? (
              <div className="py-8 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-dsk-600" />
              </div>
            ) : visibleSessions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {activeTab === 'my'
                  ? 'У вас пока нет активных обращений.'
                  : 'Очередь новых обращений пуста.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {visibleSessions.map((sess) => {
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
                          {sess.guest_name || `Клиент #${sess.id_user || 'Гость'}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(sess.updated_at)}
                        </span>
                      </div>

                      {apt ? (
                        <p className="text-[11px] text-dsk-700 font-medium truncate">
                          Кв. №{apt.number} • {apt.rooms}к, {apt.area} м² ({formatPrice(apt.price)})
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400">Общее обращение</p>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            sess.id_employee
                              ? 'bg-blue-100 text-dsk-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sess.id_employee ? 'В работе' : 'Ожидает менеджера'}
                        </span>
                        <span className="text-[10px] text-dsk-600 font-semibold">
                          Открыть →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Chat Room with AI & Deal Creation (8 cols) */}
        <div className="lg:col-span-8 h-[700px]">
          {activeSessionId ? (
            <ChatRoom
              sessionId={activeSessionId}
              onSessionUpdated={loadManagerData}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
              <h3 className="text-base font-bold text-slate-700">Выберите диалог из списка</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Выберите обращение для ответа клиенту, использования AI-помощника или оформления сделки.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
