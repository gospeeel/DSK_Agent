import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, LogIn, Lock, Mail, AlertCircle, Loader2, Sparkles, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'supervisor') navigate('/supervisor');
      else if (user.role === 'manager') navigate('/manager');
      else navigate('/profile');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Заполните все поля');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const loggedUser = await login(email, password, isStaff);
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect);
      } else if (loggedUser.role === 'supervisor') {
        navigate('/supervisor');
      } else if (loggedUser.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, isStaffRole: boolean) => {
    setEmail(demoEmail);
    setPassword('Demo123!');
    setIsStaff(isStaffRole);
    setLoading(true);
    setErrorMsg(null);
    try {
      const loggedUser = await login(demoEmail, 'Demo123!', isStaffRole);
      if (loggedUser.role === 'supervisor') navigate('/supervisor');
      else if (loggedUser.role === 'manager') navigate('/manager');
      else navigate('/profile');
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка демо-входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Top Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-dsk-700 to-dsk-500 mx-auto flex items-center justify-center text-white shadow-md shadow-dsk-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Вход в систему ДСК
          </h1>
          <p className="text-xs text-slate-500">
            Личный кабинет покупателя и рабочее место сотрудника
          </p>
        </div>

        {/* Role toggle tabs */}
        <div className="bg-slate-200/80 p-1 rounded-2xl flex">
          <button
            type="button"
            onClick={() => setIsStaff(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isStaff
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Покупатель
          </button>
          <button
            type="button"
            onClick={() => setIsStaff(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isStaff
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Сотрудник ДСК
          </button>
        </div>

        {/* Form Box */}
        <div className="bg-white p-7 rounded-3xl shadow-soft border border-slate-200/90 space-y-5">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Электронная почта
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-dsk-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Пароль
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-dsk-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-dsk-600 hover:bg-dsk-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-dsk-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {isStaff ? 'Войти в панель сотрудника' : 'Войти в личный кабинет'}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Быстрый демо-вход:
            </p>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('anna.smirnova@example.demo', false)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <strong>Анна Смирнова</strong> (Покупатель)
                </span>
                <span className="text-[10px] text-slate-400">1-клик вход</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('manager@dsk.demo', true)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-dsk-600" />
                  <strong>Михаил Петров</strong> (Менеджер)
                </span>
                <span className="text-[10px] text-slate-400">1-клик вход</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('supervisor@dsk.demo', true)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <strong>Елена Соколова</strong> (Руководитель)
                </span>
                <span className="text-[10px] text-slate-400">1-клик вход</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500">
          Ещё нет аккаунта?{' '}
          <Link to="/register" className="font-bold text-dsk-600 hover:text-dsk-700 underline">
            Зарегистрироваться
          </Link>
        </p>

      </div>
    </div>
  );
};
