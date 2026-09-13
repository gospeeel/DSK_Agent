import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Building2, SlidersHorizontal, Sparkles, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { Apartment, ResidentialComplex, Building, FinishingType } from '../types';
import { apartmentsApi } from '../api/apartments';
import { chatsApi } from '../api/chats';
import { ApartmentCard } from '../components/apartments/ApartmentCard';
import { ApartmentModal } from '../components/apartments/ApartmentModal';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/utils';

export const ApartmentsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [complexes, setComplexes] = useState<ResidentialComplex[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedComplexId, setSelectedComplexId] = useState<number | 'all'>('all');
  const [selectedRooms, setSelectedRooms] = useState<number | 'all'>('all');
  const [selectedFinishing, setSelectedFinishing] = useState<FinishingType | 'all'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(15000000);
  const [onlyFree, setOnlyFree] = useState<boolean>(true);

  // Selected apartment for modal
  const [activeApartment, setActiveApartment] = useState<Apartment | null>(null);
  const [contactingApt, setContactingApt] = useState<Apartment | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await apartmentsApi.getAllAvailableApartments();
      setApartments(data.apartments);
      setComplexes(data.complexes);
      setBuildings(data.buildings);
    } catch (err) {
      console.error('Failed to load apartments catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleContactManager = async (apt: Apartment) => {
    if (!isAuthenticated) {
      // Guest can still open login with redirect
      navigate(`/login?redirect=/apartments&apt=${apt.id}`);
      return;
    }

    try {
      const session = await chatsApi.createSession({
        id_apartment: apt.id,
      });
      // Navigate to profile or chat with this session selected
      navigate(`/profile?session=${session.id}`);
    } catch (err) {
      console.error('Failed to create chat session for apartment:', err);
      navigate('/profile');
    }
  };

  // Filter logic
  const filteredApartments = apartments.filter((apt) => {
    if (selectedComplexId !== 'all' && apt.building?.residential_complex_id !== selectedComplexId) {
      return false;
    }
    if (selectedRooms !== 'all' && apt.rooms !== selectedRooms) {
      return false;
    }
    if (selectedFinishing !== 'all' && apt.type_finishing !== selectedFinishing) {
      return false;
    }
    if (apt.price > maxPrice) {
      return false;
    }
    if (onlyFree && apt.status !== 'free') {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-dsk-950 text-white p-8 sm:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dsk-500/20 text-dsk-300 text-xs font-semibold border border-dsk-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Каталог недвижимости АО СЗ «ДСК»
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Квартиры в Воронеже от надёжного застройщика
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Прямые цены без посредников, прозрачные сроки сдачи, эскроу-счета и персональный подбор от менеджера.
          </p>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-dsk-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Clean Filters Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/90 space-y-5">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-dsk-600" />
            <h2 className="text-sm font-bold text-slate-900">Фильтры подбора</h2>
            <span className="text-xs text-slate-400">
              (Найдено: <strong className="text-slate-700">{filteredApartments.length}</strong> из {apartments.length})
            </span>
          </div>

          <button
            onClick={() => {
              setSelectedComplexId('all');
              setSelectedRooms('all');
              setSelectedFinishing('all');
              setMaxPrice(15000000);
              setOnlyFree(true);
            }}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Сбросить фильтры
          </button>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Complex Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Жилой комплекс
            </label>
            <select
              value={selectedComplexId}
              onChange={(e) =>
                setSelectedComplexId(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-dsk-500"
            >
              <option value="all">Все жилые комплексы</option>
              {complexes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rooms Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Количество комнат
            </label>
            <div className="flex items-center gap-1.5">
              {[
                { label: 'Все', value: 'all' },
                { label: '1к', value: 1 },
                { label: '2к', value: 2 },
                { label: '3к', value: 3 },
              ].map((r) => (
                <button
                  key={r.value.toString()}
                  onClick={() => setSelectedRooms(r.value as any)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    selectedRooms === r.value
                      ? 'bg-dsk-600 border-dsk-600 text-white shadow-sm shadow-dsk-600/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Finishing Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Тип отделки
            </label>
            <select
              value={selectedFinishing}
              onChange={(e) => setSelectedFinishing(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-dsk-500"
            >
              <option value="all">Любая отделка</option>
              <option value="turnkey">Чистовая (под ключ)</option>
              <option value="white_box">White box (предчистовая)</option>
              <option value="rough">Черновая</option>
            </select>
          </div>

          {/* Max Price Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Цена до:
              </label>
              <span className="text-xs font-bold text-dsk-700">
                {formatPrice(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={4000000}
              max={15000000}
              step={500000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-dsk-600 cursor-pointer"
            />
          </div>

        </div>

        {/* Free only toggle */}
        <div className="pt-2 flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyFree}
              onChange={(e) => setOnlyFree(e.target.checked)}
              className="w-4 h-4 rounded text-dsk-600 focus:ring-dsk-500 rounded border-slate-300"
            />
            Только свободные для покупки квартиры
          </label>
        </div>

      </div>

      {/* Apartments Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-dsk-600" />
          <p className="text-sm font-medium">Загрузка актуального каталога квартир...</p>
        </div>
      ) : filteredApartments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
          <Building2 className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">Квартир по заданным параметрам не найдено</h3>
          <p className="text-xs text-slate-400">Попробуйте изменить параметры комнатности или увеличить бюджет.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApartments.map((apt) => (
            <ApartmentCard
              key={apt.id}
              apartment={apt}
              onSelect={(a) => setActiveApartment(a)}
              onContact={(a) => handleContactManager(a)}
            />
          ))}
        </div>
      )}

      {/* Apartment Detail Modal */}
      {activeApartment && (
        <ApartmentModal
          apartment={activeApartment}
          onClose={() => setActiveApartment(null)}
          onContact={(a) => handleContactManager(a)}
        />
      )}

    </div>
  );
};
