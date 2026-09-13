import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Users, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw, SlidersHorizontal, Building2, MessageSquare, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dealsApi } from '../api/deals';
import { chatsApi } from '../api/chats';
import { staffApi } from '../api/discounts';
import { Deal, Offer, ChatSession, User } from '../types';
import { formatPrice, getDealStatusBadge, getOfferStatusBadge, formatDate } from '../lib/utils';

export const SupervisorDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);

  const [activeTab, setActiveTab] = useState<'deals' | 'offers' | 'staff'>('offers');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<{ id: number; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dealsData, offersData, sessionsData, usersData] = await Promise.all([
        dealsApi.getAllDeals().catch(() => []),
        dealsApi.getAllOffers().catch(() => []),
        chatsApi.getAllSessions().catch(() => []),
        staffApi.getUsers().catch(() => []),
      ]);

      setDeals(dealsData);
      setOffers(offersData);
      setSessions(sessionsData);
      setStaffUsers(usersData);
    } catch (err) {
      console.error('Failed to load supervisor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Supervisor Approval Actions
  const handleApproveOffer = async (offerId: number) => {
    setActionLoading(offerId);
    try {
      await dealsApi.approveOffer(offerId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка согласования');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async (offerId: number, reason: string) => {
    setActionLoading(offerId);
    try {
      await dealsApi.rejectOffer(offerId, reason || 'Отклонено руководителем');
      setRejectReason(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка отклонения');
    } finally {
      setActionLoading(null);
    }
  };

  // Turnovers & Metrics
  const totalVolume = deals
    .filter((d) => d.status !== 'cancelled')
    .reduce((sum, d) => sum + d.total_price, 0);

  const pendingOffers = offers.filter((o) => o.status === 'pending_approval');
  const completedDeals = deals.filter((d) => d.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-purple-600/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user?.name || 'Руководитель отдела'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                Руководитель отдела продаж
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/supervisor/discounts"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md shadow-purple-600/20 flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Настройка матрицы скидок
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Общий объём продаж</span>
            <TrendingUp className="w-4 h-4 text-dsk-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{formatPrice(totalVolume)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{deals.length} сделок в системе</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">На согласовании скидки</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{pendingOffers.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Требуют вашего решения</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Завершённые сделки</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{completedDeals.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Договоры оплачены</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Сотрудники отдела</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {staffUsers.filter((u) => u.role === 'manager' || u.role === 'supervisor').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Менеджеров и руководителей</p>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/90 space-y-6">
        
        {/* Tab selection */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'offers'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Согласование КП и скидок ({pendingOffers.length})
          </button>

          <button
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'deals'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Все сделки отдела ({deals.length})
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Команда и сотрудники
          </button>
        </div>

        {/* Tab 1: Offers approval */}
        {activeTab === 'offers' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Коммерческие предложения, ожидающие согласования
            </h3>

            {pendingOffers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-medium">Нет предложений, требующих утверждения</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        КП #{offer.id} (версия {offer.version})
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Скидка {offer.discount_percent}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                      {offer.generated_text || 'Запрошена скидка выше стандартного лимита менеджера.'}
                    </p>

                    <div className="flex justify-between text-xs text-slate-700 font-semibold pt-1">
                      <span>Итоговая цена:</span>
                      <strong className="text-slate-900 text-sm">{formatPrice(offer.final_price)}</strong>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
                      {rejectReason?.id === offer.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Причина отклонения..."
                            value={rejectReason.text}
                            onChange={(e) =>
                              setRejectReason({ id: offer.id, text: e.target.value })
                            }
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                          <button
                            onClick={() => handleRejectOffer(offer.id, rejectReason.text)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                          >
                            Отклонить
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setRejectReason({ id: offer.id, text: '' })}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                          >
                            Отклонить
                          </button>
                          <button
                            onClick={() => handleApproveOffer(offer.id)}
                            disabled={actionLoading === offer.id}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Согласовать скидку
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Deals registry */}
        {activeTab === 'deals' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Реестр всех сделок отдела</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="py-3 px-3">№ Сделки</th>
                    <th className="py-3 px-3">Клиент</th>
                    <th className="py-3 px-3">Менеджер</th>
                    <th className="py-3 px-3">Квартира</th>
                    <th className="py-3 px-3">Скидка</th>
                    <th className="py-3 px-3">Итог</th>
                    <th className="py-3 px-3">Статус</th>
                    <th className="py-3 px-3">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {deals.map((deal) => {
                    const badge = getDealStatusBadge(deal.status);
                    return (
                      <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">#{deal.id}</td>
                        <td className="py-3 px-3 text-slate-700">Клиент #{deal.id_user}</td>
                        <td className="py-3 px-3 text-slate-700">Сотрудник #{deal.id_employee}</td>
                        <td className="py-3 px-3 text-slate-700">Кв. #{deal.id_apartment}</td>
                        <td className="py-3 px-3 text-emerald-700 font-bold">{deal.percent_discount}%</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{formatPrice(deal.total_price)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{formatDate(deal.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Staff list */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Сотрудники отдела продаж</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffUsers.map((u) => (
                <div key={u.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    {u.name ? u.name.slice(0, 2).toUpperCase() : 'С'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{u.name || u.email}</h4>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                    <span className="text-[10px] font-semibold text-purple-700 capitalize mt-0.5 block">
                      {u.role === 'supervisor' ? 'Руководитель' : u.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
