
import React, { useState } from 'react';
import { User } from '../../types';
import { INITIAL_USER } from '../../constants';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface AuthFormProps {
  onLogin: (user: User) => void;
  t: any;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, t }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ ...INITIAL_USER, email: email || INITIAL_USER.email });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 relative z-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6">U</div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{isLogin ? t.welcome : t.createAccount}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{t.full_name}</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none" />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/30">
            {isLogin ? t.signIn : t.signUp} <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-500 font-medium">
            {isLogin ? t.dontHaveAccount : t.alreadyHaveAccount}
            <button onClick={() => setIsLogin(!isLogin)} className="ml-2 text-blue-600 font-bold hover:underline">
              {isLogin ? t.signUp : t.logIn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
