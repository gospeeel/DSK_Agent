import React from 'react';
import { Building, MapPin, Layers, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { Apartment } from '../../types';
import { formatPrice, formatArea, getRoomsLabel, getFinishingLabel, getApartmentStatusBadge } from '../../lib/utils';

interface ApartmentCardProps {
  apartment: Apartment;
  onSelect: (apt: Apartment) => void;
  onContact: (apt: Apartment) => void;
}

export const ApartmentCard: React.FC<ApartmentCardProps> = ({ apartment, onSelect, onContact }) => {
  const statusBadge = getApartmentStatusBadge(apartment.status);
  const pricePerSqm = apartment.area > 0 ? Math.round(apartment.price / apartment.area) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden flex flex-col card-hover">
      
      {/* Header section with badge */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-dsk-600">
              {apartment.complex?.name || 'Жилой комплекс'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {getRoomsLabel(apartment.rooms)}, {formatArea(apartment.area)}
            </h3>
          </div>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Location / Building */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{apartment.building?.address || apartment.complex?.address || 'Воронеж'}</span>
        </div>

        {apartment.building?.district && (
          <p className="text-[11px] text-slate-400 font-medium pl-5">
            р-н {apartment.building.district}
          </p>
        )}
      </div>

      {/* Mini Blueprint Visual Scheme */}
      <div 
        onClick={() => onSelect(apartment)}
        className="mx-5 my-1 py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer group hover:bg-dsk-50/50 hover:border-dsk-200 transition-colors"
      >
        <div className="flex items-center gap-4 text-slate-400 group-hover:text-dsk-600 transition-colors">
          <div className="text-center">
            <span className="block text-xl font-extrabold text-slate-800 group-hover:text-dsk-700">№{apartment.number}</span>
            <span className="text-[11px] font-medium text-slate-400">квартира</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <span className="block text-xl font-extrabold text-slate-800 group-hover:text-dsk-700">{apartment.floor}</span>
            <span className="text-[11px] font-medium text-slate-400">
              из {apartment.building?.floors_count || '—'} этаж
            </span>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-dsk-600">
          Схема и параметры объекта <ArrowRight className="w-3 h-3" />
        </span>
      </div>

      {/* Specs / Attributes */}
      <div className="px-5 py-3 grid grid-cols-2 gap-2 text-xs border-y border-slate-100 mt-2 bg-slate-50/50">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>{getFinishingLabel(apartment.type_finishing)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 justify-end">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span>Срок: {apartment.building?.readiness_percent !== undefined ? `${apartment.building.readiness_percent}% готов` : 'Строится'}</span>
        </div>
      </div>

      {/* Pricing & Footer Actions */}
      <div className="p-5 pt-3 mt-auto flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-slate-400 font-medium">Стоимость</p>
          <p className="text-xl font-extrabold text-slate-900 tracking-tight">
            {formatPrice(apartment.price)}
          </p>
          <p className="text-[10px] text-slate-400">
            {formatPrice(pricePerSqm)} / м²
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onContact(apartment)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-dsk-600 hover:bg-dsk-700 transition-colors shadow-sm shadow-dsk-600/20 flex items-center gap-1.5"
            title="Задать вопрос менеджеру по этой квартире"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Чат
          </button>
          <button
            onClick={() => onSelect(apartment)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Подробнее о квартире"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
