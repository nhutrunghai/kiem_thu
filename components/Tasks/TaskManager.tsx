
import React, { useState } from 'react';
import { Task, TaskStatus, TimetableEvent } from '../../types';
import { Plus, Search, Trash2, Calendar, CheckCircle2, Circle, X, AlignLeft, Flag, Info } from 'lucide-react';
import { format } from 'date-fns';
// Fix: Use subpath imports for locales to ensure compatibility with different date-fns versions and strict TS environments
import { vi } from 'date-fns/locale/vi';
import { enUS } from 'date-fns/locale/en-US';

interface TaskManagerProps {
  tasks: Task[];
  events: TimetableEvent[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  darkMode: boolean;
  language: 'en' | 'vi';
  t: any;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, events, onAddTask, onUpdateTask, onDeleteTask, darkMode, language, t }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const currentLocale = language === 'vi' ? vi : enUS;

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filter === 'ALL' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingTask(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTaskData: Omit<Task, 'id' | 'attachments'> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      dueDate: formData.get('dueDate') as string,
      status: (formData.get('status') as TaskStatus) || TaskStatus.TODO,
      priority: (formData.get('priority') as 'low' | 'medium' | 'high') || 'medium',
    };

    if (editingTask) {
      onUpdateTask(editingTask.id, newTaskData);
    } else {
      const newTask: Task = {
        ...newTaskData,
        id: Date.now().toString(),
        attachments: []
      };
      onAddTask(newTask);
    }
    setShowAddModal(false);
  };

  const getPriorityStyles = (p: string) => {
    switch(p) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500/20';
      case 'medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500/20';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/20';
    }
  };

  const getStatusStyles = (s: TaskStatus) => {
    switch(s) {
      case TaskStatus.COMPLETED: return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500/20';
      case TaskStatus.IN_PROGRESS: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/20';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-700 ring-1 ring-slate-400/20';
    }
  };

  const getStatusText = (s: TaskStatus) => {
    switch(s) {
      case TaskStatus.COMPLETED: return t.completed;
      case TaskStatus.IN_PROGRESS: return t.inProgress;
      default: return t.todo;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder={t.searchTasks} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 dark:text-white" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none shadow-sm font-bold text-slate-600 dark:text-slate-300">
            <option value="ALL">{t.allStatus}</option>
            <option value={TaskStatus.TODO}>{t.todo}</option>
            <option value={TaskStatus.IN_PROGRESS}>{t.inProgress}</option>
            <option value={TaskStatus.COMPLETED}>{t.completed}</option>
          </select>
          <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold shadow-md active:scale-95 transition-all"><Plus className="w-5 h-5" /> {t.newTask}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length > 0 ? filteredTasks.map(task => (
          <div 
            key={task.id} 
            onClick={() => handleOpenEdit(task)}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group flex flex-col h-full cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-start gap-3 flex-1 min-w-0">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     onUpdateTask(task.id, { status: task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED });
                   }} 
                   className={`mt-0.5 transition-colors ${task.status === TaskStatus.COMPLETED ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}
                 >
                   {task.status === TaskStatus.COMPLETED ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                 </button>
                 <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-lg leading-tight truncate ${task.status === TaskStatus.COMPLETED ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{task.title}</h4>
                    <p className="text-slate-500 text-sm mt-1 line-clamp-2 leading-relaxed font-medium">{task.description}</p>
                 </div>
               </div>
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onDeleteTask(task.id);
                 }} 
                 className="text-slate-300 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover:opacity-100"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
            
            <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-700 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(task.dueDate), 'd MMM, p', { locale: currentLocale })}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-tighter ${getStatusStyles(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-tighter ${getPriorityStyles(task.priority)}`}>
                  {(t[task.priority] || task.priority).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center">
            <Flag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">{t.noTasksFound}</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-800 text-white' : 'bg-white'}`}>
             <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center">
               <h3 className="text-lg font-bold uppercase tracking-tight">{editingTask ? t.editTask : t.newTask}</h3>
               <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                 <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">{t.task_title.toUpperCase()}</label>
                 <input 
                   required 
                   name="title" 
                   defaultValue={editingTask?.title || ''}
                   className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 dark:text-white" 
                   placeholder={t.task_title_placeholder} 
                 />
               </div>
               <div>
                 <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><AlignLeft className="w-3.5 h-3.5" /> {t.description.toUpperCase()}</label>
                 <textarea 
                   name="description" 
                   defaultValue={editingTask?.description || ''}
                   className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none font-medium text-slate-900 dark:text-white" 
                   placeholder={t.details_placeholder} 
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">{t.deadline.toUpperCase()}</label>
                   <input 
                     required 
                     type="datetime-local" 
                     name="dueDate" 
                     defaultValue={editingTask?.dueDate ? format(new Date(editingTask.dueDate), "yyyy-MM-dd'T'HH:mm") : ''}
                     className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 outline-none font-bold text-slate-900 dark:text-white" 
                   />
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">{t.priority.toUpperCase()}</label>
                   <select 
                     name="priority" 
                     defaultValue={editingTask?.priority || "medium"} 
                     className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 outline-none font-bold text-slate-900 dark:text-white"
                   >
                     <option value="low">{t.low}</option>
                     <option value="medium">{t.medium}</option>
                     <option value="high">{t.high}</option>
                   </select>
                 </div>
               </div>
               <div>
                 <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">{t.status.toUpperCase()}</label>
                 <select 
                   name="status" 
                   defaultValue={editingTask?.status || TaskStatus.TODO} 
                   className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 outline-none font-bold text-slate-900 dark:text-white"
                 >
                   <option value={TaskStatus.TODO}>{t.todo}</option>
                   <option value={TaskStatus.IN_PROGRESS}>{t.inProgress}</option>
                   <option value={TaskStatus.COMPLETED}>{t.completed}</option>
                 </select>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                 <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all">{t.cancel}</button>
                 <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg active:scale-95 transition-all">{t.save}</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
