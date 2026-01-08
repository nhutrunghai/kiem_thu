
import React, { useState } from 'react';
import { Task, TimetableEvent, TaskStatus } from '../../types';
import { Bell, Clock, Smartphone, Mail, AlertTriangle } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface RemindersProps {
  tasks: Task[];
  events: TimetableEvent[];
  darkMode: boolean;
  t: any;
}

const Reminders: React.FC<RemindersProps> = ({ tasks, events, darkMode, t }) => {
  const [settings, setSettings] = useState({ push: true, email: false });

  const upcomingDeadlines = tasks
    .filter(task => task.status !== TaskStatus.COMPLETED && isAfter(new Date(task.dueDate), new Date()))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const soonTasks = upcomingDeadlines.filter(task => isBefore(new Date(task.dueDate), addDays(new Date(), 2)));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border dark:border-slate-700 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Bell className="w-6 h-6 text-blue-600" /> {t.notificationChannels}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => setSettings(p => ({...p, push: !p.push}))} className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${settings.push ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-500/10' : 'border-slate-100 dark:border-slate-700 hover:border-blue-300'}`}>
             <div className="flex items-center gap-4"><Smartphone className="w-6 h-6 text-blue-600" /> <div><h4 className="font-bold">{t.browserPush}</h4></div></div>
          </div>
          <div onClick={() => setSettings(p => ({...p, email: !p.email}))} className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${settings.email ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-500/10' : 'border-slate-100 dark:border-slate-700 hover:border-emerald-300'}`}>
             <div className="flex items-center gap-4"><Mail className="w-6 h-6 text-emerald-600" /> <div><h4 className="font-bold">{t.emailDigest}</h4></div></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 px-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> {t.upcomingAlerts}</h3>
        {soonTasks.length > 0 ? soonTasks.map(task => (
           <div key={task.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-700 flex items-center gap-4 shadow-sm hover:scale-[1.01] transition-transform">
             <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600"><Clock /></div>
             <div className="flex-1"><h4 className="font-bold text-slate-900 dark:text-white">{task.title}</h4><p className="text-sm text-slate-500">{format(new Date(task.dueDate), 'p')}</p></div>
             <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded uppercase tracking-tighter">{t.urgent}</span>
           </div>
        )) : <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 font-bold">{t.noUrgentAlerts}</div>}
      </div>
    </div>
  );
};

export default Reminders;
