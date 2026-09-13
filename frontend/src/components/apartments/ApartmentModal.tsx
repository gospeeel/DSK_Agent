import React, { useEffect, useState } from 'react';
import { X, Building, MapPin, Layers, CheckCircle2, Clock, AlertTriangle, MessageSquare, ShieldCheck, ChevronRight } from 'lucide-react';
import { Apartment, ConstructionProgress } from '../../types';
import { apartmentsApi } from '../../api/apartments';
import { formatPrice, formatArea, getRoomsLabel, getFinishingLabel, getApartmentStatusBadge, formatDate } from '../../lib/utils';

interface ApartmentModalProps {
  apartment: Apartment | null;
  onClose: () => void;
  onContact: (apt: Apartment) => void;
}

export const ApartmentModal: React.FC<ApartmentModalProps> = ({ apartment, onClose, onContact }) => {
  const [progress, setProgress] = useState<ConstructionProgress[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    if (apartment?.building_id) {
      setLoadingProgress(true);
      apartmentsApi
        .getProgressByBuilding(apartment.building_id)
        .then(setProgress)
        .catch(() => setProgress([]))
        .finally(() => setLoadingProgress(false));
    }
  }, [apartment]);

  if (!apartment) return null;

  const statusBadge = getApartmentStatusBadge(apartment.status);
  const pricePerSqm = apartment.area > 0 ? Math.round(apartment.price / apartment.area) : 0;

  const stageLabels: Record<string, string> = {
    excavation: 'Земляные работы и котлован',
    foundation: 'Фундамент и нулевой цикл',
    frame: 'Возведение монолитного каркаса',
    roofing: 'Кровельные и фасадные работы',
    finishing: 'Инженерные сети и отделка',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-dsk-600">
                {apartment.complex?.name || 'Жилой комплекс'}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {getRoomsLabel(apartment.rooms)}, кв. №{apartment.number}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {apartment.building?.address || apartment.complex?.address}, р-н {apartment.building?.district || 'Воронеж'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-400">Общая площадь</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{formatArea(apartment.area)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-400">Этаж</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {apartment.floor} <span className="text-xs font-normal text-slate-400">из {apartment.building?.floors_count || '—'}</span>
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-400">Отделка</p>
              <p className="text-xs font-bold text-slate-900 mt-1 truncate">{getFinishingLabel(apartment.type_finishing)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-400">Материал стен</p>
              <p className="text-xs font-bold text-slate-900 mt-1 capitalize">{apartment.building?.type_wall_material || 'Панель'}</p>
            </div>
          </div>

          {/* Price Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-dsk-50 to-blue-50/50 border border-dsk-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-dsk-800">Цена от застройщика ДСК</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{formatPrice(apartment.price)}</p>
              <p className="text-xs text-slate-500">{formatPrice(pricePerSqm)} за м²</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-xs font-semibold text-emerald-700 shadow-sm border border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Прямая сделка ДДУ
              </div>
            </div>
          </div>

          {/* Construction Progress & Readiness */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-dsk-600" />
                Ход строительства и готовность корпуса
              </h4>
              {apartment.building?.readiness_percent !== undefined && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-dsk-100 text-dsk-800">
                  {apartment.building.readiness_percent}% готово
                </span>
              )}
            </div>

            {apartment.building?.readiness_percent !== undefined && (
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4">
                <div 
                  className="bg-dsk-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${apartment.building.readiness_percent}%` }}
                />
              </div>
            )}

            {/* Progress Stages */}
            {progress.length > 0 && (
              <div className="space-y-2 mt-2">
                {progress.map((stage) => (
                  <div key={stage.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {stage.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : stage.status === 'delayed' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-800">
                          {stageLabels[stage.stage_name] || stage.stage_name}
                        </span>
                        {stage.delay_reason && (
                          <p className="text-[11px] text-amber-600 font-normal">{stage.delay_reason}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-slate-600">
                      {stage.completion_percentage ?? (stage.status === 'completed' ? 100 : 0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            Закрыть
          </button>
          <button
            onClick={() => {
              onClose();
              onContact(apartment);
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-dsk-600 hover:bg-dsk-700 transition-colors shadow-md shadow-dsk-600/20 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Написать менеджеру по этой квартире
          </button>
        </div>

      </div>
    </div>
  );
};
