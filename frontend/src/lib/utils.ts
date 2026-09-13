import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FinishingType, ApartmentStatus, DealStatus, OfferStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | undefined | null): string {
  if (price === undefined || price === null || price === '') return '0 ₽';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0 ₽';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatArea(area: number | undefined | null): string {
  if (!area) return '0 м²';
  return `${area.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} м²`;
}

export function getRoomsLabel(rooms: number): string {
  if (rooms === 0) return 'Студия';
  if (rooms === 1) return '1-комнатная';
  if (rooms === 2) return '2-комнатная';
  if (rooms === 3) return '3-комнатная';
  return `${rooms}-комнатная`;
}

export function getFinishingLabel(type: FinishingType): string {
  switch (type) {
    case 'turnkey':
      return 'Чистовая (под ключ)';
    case 'white_box':
      return 'Предчистовая (White box)';
    case 'rough':
      return 'Черновая отделка';
    default:
      return type;
  }
}

export function getApartmentStatusBadge(status: ApartmentStatus): { label: string; color: string } {
  switch (status) {
    case 'free':
      return { label: 'Свободна', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'booked':
      return { label: 'Забронирована', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'sold':
      return { label: 'Продана', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    default:
      return { label: status, color: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

export function getDealStatusBadge(status: DealStatus): { label: string; color: string } {
  switch (status) {
    case 'pending':
      return { label: 'В обработке', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'contract':
      return { label: 'Подготовка договора', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'completed':
      return { label: 'Завершена', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'cancelled':
      return { label: 'Отменена', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, color: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

export function getOfferStatusBadge(status: OfferStatus): { label: string; color: string } {
  switch (status) {
    case 'draft':
      return { label: 'Черновик', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'pending_approval':
      return { label: 'На согласовании', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'approved':
      return { label: 'Согласовано', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'rejected':
      return { label: 'Отклонено', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, color: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}
