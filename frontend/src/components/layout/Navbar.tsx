import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, MessageSquare, User as UserIcon, LogOut, LogIn, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-dsk-700 to-dsk-500 flex items-center justify-center text-white shadow-md shadow-dsk-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900">ДСК</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-dsk-50 text-dsk-700 font-semibold uppercase tracking-wider">
                    Agent
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-none">Строительный портал</p>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/apartments"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/apartments') || isActive('/')
                    ? 'bg-dsk-50 text-dsk-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Квартиры в продаже
              </Link>

              {isAuthenticated && user?.role === 'user' && (
                <Link
                  to="/profile"
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/profile')
                      ? 'bg-dsk-50 text-dsk-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Мои чаты и сделки
                </Link>
              )}

              {isAuthenticated && user?.role === 'manager' && (
                <Link
                  to="/manager"
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/manager')
                      ? 'bg-dsk-50 text-dsk-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-dsk-600" />
                  Рабочее место менеджера
                </Link>
              )}

              {isAuthenticated && user?.role === 'supervisor' && (
                <>
                  <Link
                    to="/supervisor"
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive('/supervisor')
                        ? 'bg-dsk-50 text-dsk-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Обзор отдела
                  </Link>
                  <Link
                    to="/supervisor/discounts"
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/supervisor/discounts')
                        ? 'bg-dsk-50 text-dsk-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Матрица скидок
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NotificationBell />

                {/* Role Badge */}
                <span
                  className={`hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full font-medium border ${
                    user?.role === 'supervisor'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : user?.role === 'manager'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {user?.role === 'supervisor'
                    ? 'Руководитель'
                    : user?.role === 'manager'
                    ? 'Менеджер'
                    : 'Покупатель'}
                </span>

                {/* User Profile info */}
                <div className="flex items-center gap-2 pl-1">
                  <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                      {user?.name || user?.email}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Выйти из аккаунта"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-dsk-600 hover:bg-dsk-700 transition-colors shadow-sm shadow-dsk-600/20"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
