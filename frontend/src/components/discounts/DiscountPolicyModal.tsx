import React, { useState } from 'react';
import { X, SlidersHorizontal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Building, Role, DiscountPolicy } from '../../types';
import { discountsApi } from '../../api/discounts';

interface DiscountPolicyModalProps {
  buildings: Building[];
  initialBuildingId?: number;
  onClose: () => void;
  onSuccess: (policy: DiscountPolicy) => void;
}

export const DiscountPolicyModal: React.FC<DiscountPolicyModalProps> = ({
  buildings,
  initialBuildingId,
  onClose,
  onSuccess,
}) => {
  const [buildingId, setBuildingId] = useState<number>(
    initialBuildingId || (buildings.length > 0 ? buildings[0].id : 0)
  );
  const [role, setRole] = useState<Role>('manager');
  const [maxDiscountPercent, setMaxDiscountPercent] = useState<string>('5.0');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) {
      setErrorMsg('Выберите корпус');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const newPolicy = await discountsApi.createPolicy({
        building_id: buildingId,
        role,
        max_discount_percent: maxDiscountPercent,
        valid_from: new Date().toISOString(),
      });
      onSuccess(newPolicy);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка обновления политики скидок');
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
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Настройка матрицы скидок</h3>
              <p className="text-xs text-slate-500">Установка лимитов для корпуса</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select Building */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Корпус / Объект
            </label>
            <select
              value={buildingId}
              onChange={(e) => setBuildingId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-dsk-500"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.address} (ID: {b.id}, р-н {b.district})
                </option>
              ))}
            </select>
          </div>

          {/* Select Target Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Для какой роли устанавливается лимит
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('manager');
                  if (parseFloat(maxDiscountPercent) > 7) setMaxDiscountPercent('5.0');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                  role === 'manager'
                    ? 'bg-blue-50 border-dsk-400 text-dsk-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Менеджер (manager)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('supervisor');
                  if (parseFloat(maxDiscountPercent) <= 5) setMaxDiscountPercent('12.0');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                  role === 'supervisor'
                    ? 'bg-purple-50 border-purple-400 text-purple-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Руководитель (supervisor)
              </button>
            </div>
          </div>

          {/* Max discount percent */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Максимальный процент скидки (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max={role === 'manager' ? 10 : 30}
              value={maxDiscountPercent}
              onChange={(e) => setMaxDiscountPercent(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-dsk-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {role === 'manager'
                ? 'Менеджер сможет подтверждать сделки со скидкой в пределах этого процента без эскалации.'
                : 'Скидки свыше лимита руководителя будут блокироваться сервером.'}
            </p>
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end gap-2">
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
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-md shadow-purple-600/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Сохранить версию скидки
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
