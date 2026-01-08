
import React from 'react';
import { NAV_ITEMS } from '../../constants';
import { LogOut, Sun, Moon, Globe } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: 'en' | 'vi';
  setLanguage: (lang: 'en' | 'vi') => void;
  t: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout, darkMode, toggleDarkMode, language, setLanguage, t }) => {
  return (
    <aside className={`w-64 flex-shrink-0 flex flex-col border-r transition-colors duration-200 hidden md:flex ${
      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className="p-6 flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
          U
        </div>
        <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>UniFlow</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-md'
                : `${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'}`
            }`}
          >
            {item.icon}
            <span className="font-medium">{t[item.labelKey]}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <Globe className="w-5 h-5" />
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md p-1 flex-1">
            <button 
              onClick={() => setLanguage('en')}
              className={`flex-1 text-[10px] font-bold py-1 rounded transition-all ${language === 'en' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('vi')}
              className={`flex-1 text-[10px] font-bold py-1 rounded transition-all ${language === 'vi' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              VI
            </button>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-medium">{darkMode ? t.lightMode : t.darkMode}</span>
        </button>
        
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10`}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t.signOut}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
