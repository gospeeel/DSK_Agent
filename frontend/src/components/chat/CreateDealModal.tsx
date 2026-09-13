import React, { useState } from 'react';
import { X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ChatSession, Apartment, Deal } from '../../types';
import { dealsApi } from '../../api/deals';
import { formatPrice } from '../../lib/utils';

interface CreateDealModalProps {
  session: ChatSession;
  apartment?: Apartment | null;
  onClose: () => void;
  onSuccess: (deal: Deal) => void;
}

export const CreateDealModal: React.FC<CreateDealModalProps> = ({
  session,
  apartment,
  onClose,
  onSuccess,
}) => {
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const basePrice = apartment?.price || 5000000;
  const discountAmount = (basePrice * discountPercent) / 100;
  const totalPrice = Math.max(0, basePrice - discountAmount);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.id_user) {
      setErrorMsg('У данного обращения нет зарегистрированного пользователя');
      return;
    }
    const aptId = apartment?.id || session.id_apartment;
    if (!aptId) {
      setErrorMsg('Не выбрана квартира для сделки');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const newDeal = await dealsApi.createDeal({
        id_user: session.id_user,
        id_apartment: aptId,
        id_chat_session: session.id,
        percent_discount: Number(discountPercent),
      });
      onSuccess(newDeal);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка создания сделки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-dsk-100 text-dsk-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Оформление сделки</h3>
              <p className="text-xs text-slate-500">Диалог #{session.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Client & Apartment snippet */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Клиент ID:</span>
              <span className="font-semibold text-slate-900">{session.id_user || 'Гость'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Квартира:</span>
              <span className="font-semibold text-slate-900">
                {apartment ? `№${apartment.number} (${apartment.rooms}-комн., ${apartment.area} м²)` : `ID ${session.id_apartment || '—'}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Базовая стоимость:</span>
              <span className="font-bold text-slate-900">{formatPrice(basePrice)}</span>
            </div>
          </div>

          {/* Discount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Процент скидки (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="25"
                step="0.5"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-dsk-500"
              />
              <div className="flex-1 flex items-center gap-1.5">
                {[0, 3, 5, 7].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      discountPercent === pct
                        ? 'bg-dsk-50 border-dsk-300 text-dsk-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            {discountPercent > 5 && (
              <p className="text-[11px] text-amber-600 mt-1">
                * Скидки свыше 5% могут потребовать согласования руководителя.
              </p>
            )}
          </div>

          {/* Final price summary */}
          <div className="p-4 rounded-2xl bg-dsk-50/80 border border-dsk-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-dsk-700">Итоговая сумма по сделке</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{formatPrice(totalPrice)}</p>
            </div>
            {discountAmount > 0 && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                Экономия {formatPrice(discountAmount)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-dsk-600 hover:bg-dsk-700 rounded-xl transition-colors shadow-md shadow-dsk-600/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Подтвердить и создать сделку
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
