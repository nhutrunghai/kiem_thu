
import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

interface AuthFormProps {
  onLogin: (user: User, token: string) => void;
  t: any;
  resetToken?: string;
  onResetComplete?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, t, resetToken, onResetComplete }) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isLogin = authMode === 'login';
  const isRegister = authMode === 'register';
  const isForgotPassword = authMode === 'forgot';
  const isResetPassword = authMode === 'reset';

  const resetPasswordVisibility = () => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (mode: 'login' | 'register' | 'forgot' | 'reset') => {
    setAuthMode(mode);
    setError('');
    setSuccess('');
    setConfirmPassword('');
    resetPasswordVisibility();
  };

  const handleBackToLogin = () => {
    if (resetToken) {
      if (onResetComplete) {
        onResetComplete();
      } else if (window?.history?.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('resetToken');
        window.history.replaceState({}, document.title, url.toString());
      }
      setAuthMode('login');
      setError('');
      setSuccess('');
      setConfirmPassword('');
      resetPasswordVisibility();
      return;
    }
    switchMode('login');
  };

  useEffect(() => {
    if (resetToken) {
      setAuthMode('reset');
      setError('');
      setSuccess('');
      resetPasswordVisibility();
      return;
    }
    if (authMode === 'reset') {
      setAuthMode('login');
      resetPasswordVisibility();
    }
  }, [resetToken, authMode]);

  const translateError = (msg: string, mode: 'login' | 'register' | 'forgot' | 'reset') => {
    const lower = (msg || '').toLowerCase();
    if (lower.includes('invalid credentials')) return t.invalidCredentials;
    if (lower.includes('already exists')) return t.accountAlreadyExists;
    if (lower.includes('invalid email')) return t.invalidEmailFormat;
    if (lower.includes('password must be at least')) return t.passwordTooShort;
    if (lower.includes('full name is required')) return t.fullNameRequired;
    if (lower.includes('missing required fields')) {
      return mode === 'login' ? t.credentialsRequired : t.missingRequiredFields;
    }
    if (lower.includes('server error')) {
      if (mode === 'login') return t.loginFailed;
      if (mode === 'register') return t.registrationFailed;
      return t.resetFailed;
    }
    if (mode === 'forgot') return t.resetRequestFailed;
    if (mode === 'reset') return t.resetFailed;
    return mode === 'login' ? t.loginFailed : t.registrationFailed;
  };

  const validateEmail = (value: string) => emailPattern.test(value);

  const validateLogin = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail && !password) {
      setError(t.credentialsRequired);
      return null;
    }
    if (!trimmedEmail) {
      setError(t.emailRequired);
      return null;
    }
    if (!validateEmail(trimmedEmail)) {
      setError(t.invalidEmailFormat);
      return null;
    }
    if (!password) {
      setError(t.passwordRequired);
      return null;
    }
    return { email: trimmedEmail, password };
  };

  const validateRegister = () => {
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName) {
      setError(t.fullNameRequired);
      return null;
    }
    if (!trimmedEmail) {
      setError(t.emailRequired);
      return null;
    }
    if (!validateEmail(trimmedEmail)) {
      setError(t.invalidEmailFormat);
      return null;
    }
    if (!password || !confirmPassword) {
      setError(t.passwordRequired);
      return null;
    }
    if (password.length < 8) {
      setError(t.passwordTooShort);
      return null;
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return null;
    }
    return { email: trimmedEmail, password, fullName: trimmedFullName };
  };

  const validateForgotPassword = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t.emailRequired);
      return null;
    }
    if (!validateEmail(trimmedEmail)) {
      setError(t.invalidEmailFormat);
      return null;
    }
    return { email: trimmedEmail };
  };

  const validateResetPassword = () => {
    if (!resetToken) {
      setError(t.resetTokenInvalid || t.resetFailed);
      return null;
    }
    if (!password || !confirmPassword) {
      setError(t.passwordRequired || t.password);
      return null;
    }
    if (password.length < 8) {
      setError(t.passwordTooShort);
      return null;
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return null;
    }
    return { token: resetToken, password };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isForgotPassword) {
        const payload = validateForgotPassword();
        if (!payload) {
          return;
        }
        await api.auth.forgotPassword(payload);
        setSuccess(t.resetLinkSent);
        return;
      }
      if (isResetPassword) {
        const payload = validateResetPassword();
        if (!payload) {
          return;
        }
        await api.auth.resetPassword(payload);
        setSuccess(t.resetSuccess);
        setPassword('');
        setConfirmPassword('');
        setAuthMode('login');
        if (onResetComplete) {
          onResetComplete();
        } else if (window?.history?.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          url.searchParams.delete('resetToken');
          window.history.replaceState({}, document.title, url.toString());
        }
        return;
      }
      if (isLogin) {
        const payload = validateLogin();
        if (!payload) {
          return;
        }
        const res = await api.auth.login(payload);
        onLogin(res.user, res.token);
      } else {
        const payload = validateRegister();
        if (!payload) {
          return;
        }
        const res = await api.auth.register(payload);
        onLogin(res.user, res.token);
      }
    } catch (err: any) {
      const currentMode = isForgotPassword ? 'forgot' : (isResetPassword ? 'reset' : (isLogin ? 'login' : 'register'));
      const msg = translateError(err?.message || '', currentMode);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    isVisible: boolean,
    onToggle: () => void
  ) => (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{label}</label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
        <input
          required
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-12 py-4 outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={isVisible ? t.hidePassword : t.showPassword}
          title={isVisible ? t.hidePassword : t.showPassword}
        >
          {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 relative z-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6">U</div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {(isForgotPassword || isResetPassword) ? t.resetPassword : (isLogin ? t.welcome : t.createAccount)}
          </h2>
          {isForgotPassword && (
            <p className="mt-3 text-slate-500 text-sm">{t.resetPasswordDescription}</p>
          )}
          {isResetPassword && (
            <p className="mt-3 text-slate-500 text-sm">{t.setNewPasswordDescription}</p>
          )}
          {error && <p className="mt-4 text-red-500 text-sm font-bold bg-red-50 py-2 rounded-lg">{error}</p>}
          {success && <p className="mt-4 text-emerald-600 text-sm font-bold bg-emerald-50 py-2 rounded-lg">{success}</p>}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{t.full_name}</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none" />
                </div>
              </div>
            </>
          )}
          {!isResetPassword && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none" />
              </div>
            </div>
          )}
          {!isForgotPassword && !isResetPassword && (
            <div>
              {renderPasswordField(
                t.password,
                password,
                setPassword,
                showPassword,
                () => setShowPassword((current) => !current)
              )}
              {isLogin && (
                <div className="mt-3 text-right">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              )}
            </div>
          )}
          {isRegister && (
            renderPasswordField(
              t.confirmPassword,
              confirmPassword,
              setConfirmPassword,
              showConfirmPassword,
              () => setShowConfirmPassword((current) => !current)
            )
          )}
          {isResetPassword && (
            <>
              {renderPasswordField(
                t.newPassword,
                password,
                setPassword,
                showPassword,
                () => setShowPassword((current) => !current)
              )}
              {renderPasswordField(
                t.confirmPassword,
                confirmPassword,
                setConfirmPassword,
                showConfirmPassword,
                () => setShowConfirmPassword((current) => !current)
              )}
            </>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isForgotPassword ? t.sendResetLink : (isResetPassword ? t.updatePassword : (isLogin ? t.signIn : t.signUp)))}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-10 text-center">
          {(isForgotPassword || isResetPassword) ? (
            <button onClick={handleBackToLogin} className="text-blue-600 font-bold hover:underline">
              {t.backToLogin}
            </button>
          ) : (
            <p className="text-slate-500 font-medium">
              {isLogin ? t.dontHaveAccount : t.alreadyHaveAccount}
              <button onClick={() => switchMode(isLogin ? 'register' : 'login')} className="ml-2 text-blue-600 font-bold hover:underline">
                {isLogin ? t.signUp : t.logIn}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
