import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, Plus, Building2, CheckCircle2, ShieldCheck, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { Building, DiscountPolicy, ResidentialComplex } from '../types';
import { apartmentsApi } from '../api/apartments';
import { discountsApi } from '../api/discounts';
import { DiscountPolicyModal } from '../components/discounts/DiscountPolicyModal';
import { formatDate } from '../lib/utils';

export const SupervisorDiscountsPage: React.FC = () => {
  const [complexes, setComplexes] = useState<ResidentialComplex[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(0);
  const [policies, setPolicies] = useState<DiscountPolicy[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const catalog = await apartmentsApi.getAllAvailableApartments();
        setComplexes(catalog.complexes);
        setBuildings(catalog.buildings);
        if (catalog.buildings.length > 0) {
          setSelectedBuildingId(catalog.buildings[0].id);
        }
      } catch (e) {
        console.error('Failed to load buildings:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadPolicies = async (bId: number) => {
    if (!bId) return;
    setLoadingPolicies(true);
    try {
      const data = await discountsApi.getPoliciesByBuilding(bId);
      setPolicies(data || []);
    } catch (e) {
      console.warn('Failed to load policies:', e);
      setPolicies([]);
    } finally {
      setLoadingPolicies(false);
    }
  };

  useEffect(() => {
    if (selectedBuildingId) {
      loadPolicies(selectedBuildingId);
    }
  }, [selectedBuildingId]);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header with back link */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/supervisor"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Назад к общему дашборду
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-purple-600" />
            Управление матрицей скидок
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Установка предельных лимитов скидок для менеджеров и руководителей по корпусам
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md shadow-purple-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Новая версия политики скидок
        </button>
      </div>

      {/* Building Selector Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-soft">
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Выберите объект / корпус для просмотра истории матрицы:
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {buildings.map((b) => {
            const isSelected = selectedBuildingId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBuildingId(b.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-purple-50/70 border-purple-400 shadow-sm'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 truncate">{b.address}</span>
                  <span className="text-[10px] text-purple-700 font-bold px-1.5 py-0.5 bg-purple-100 rounded-md">
                    ID {b.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  р-н {b.district} • {b.floors_count} этажей
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Policies History & Active Matrix */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-soft space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Политики скидок: {selectedBuilding?.address || 'Корпус'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Серверная история версий и действующие ограничения
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {policies.length} версий зарегистрировано
          </span>
        </div>

        {loadingPolicies ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
            <p className="text-xs">Загрузка матрицы...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <p className="text-xs font-semibold text-slate-600">Для данного корпуса действуют стандартные настройки системы</p>
            <p className="text-[11px] text-slate-400">Нажмите «Новая версия политики скидок», чтобы задать индивидуальные лимиты.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Версия</th>
                  <th className="py-3 px-3">Роль</th>
                  <th className="py-3 px-3">Макс. скидка</th>
                  <th className="py-3 px-3">Действует с</th>
                  <th className="py-3 px-3">Действует по</th>
                  <th className="py-3 px-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {policies.map((pol) => {
                  const isActive = !pol.valid_to;
                  return (
                    <tr key={pol.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">v{pol.version} (ID: {pol.id})</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pol.role === 'supervisor'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {pol.role === 'supervisor' ? 'Руководитель' : 'Менеджер'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm font-extrabold text-slate-900">
                        {pol.max_discount_percent}%
                      </td>
                      <td className="py-3 px-3 text-slate-600">{formatDate(pol.valid_from)}</td>
                      <td className="py-3 px-3 text-slate-400">{pol.valid_to ? formatDate(pol.valid_to) : 'Бессрочно'}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isActive ? 'Действующая' : 'Архивная'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Discount Policy */}
      {showModal && (
        <DiscountPolicyModal
          buildings={buildings}
          initialBuildingId={selectedBuildingId}
          onClose={() => setShowModal(false)}
          onSuccess={(newPol) => {
            setShowModal(false);
            if (selectedBuildingId) loadPolicies(selectedBuildingId);
          }}
        />
      )}

    </div>
  );
};
