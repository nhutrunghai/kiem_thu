
import React from 'react';
import { User } from '../../types';
import { NAV_ITEMS } from '../../constants';
import { Bell, Search } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  user: User;
  onNotificationClick: () => void;
  darkMode: boolean;
  t: any;
}

const Header: React.FC<HeaderProps> = ({ activeTab, user, onNotificationClick, darkMode, t }) => {
  const currentNav = NAV_ITEMS.find(i => i.id === activeTab);

  return (
    <header className={`h-20 flex-shrink-0 flex items-center justify-between px-8 border-b transition-colors duration-200 ${
      darkMode ? 'bg-slate-900/50 border-slate-800 backdrop-blur-md' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center gap-4">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {currentNav ? t[currentNav.labelKey] : t.dashboard}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={onNotificationClick}
          className={`relative p-2 rounded-full transition-colors ${
            darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{user.fullName}</div>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user.major}</div>
          </div>
          <img 
            src={user.avatar || 'https://picsum.photos/seed/default/100'} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
