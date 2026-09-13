import React from 'react';
import { Building2, ShieldCheck, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-dsk-600 flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">АО СЗ «ДСК»</p>
              <p className="text-[11px] text-slate-400">Интеллектуальная платформа продаж недвижимости</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Официальные цены застройщика
            </span>
            <span className="flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-dsk-600" />
              Прямой диалог с отделом продаж
            </span>
          </div>

          <p className="text-slate-400 text-center md:text-right">
            © {new Date().getFullYear()} АО СЗ «ДСК». Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};
