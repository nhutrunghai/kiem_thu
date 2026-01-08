
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import Timetable from './components/Timetable/Timetable';
import TaskManager from './components/Tasks/TaskManager';
import NoteManager from './components/Notes/NoteManager';
import Reminders from './components/Reminders/Reminders';
import Profile from './components/Auth/Profile';
import AuthForm from './components/Auth/AuthForm';
import { User, TimetableEvent, Task, Note } from './types';
import { INITIAL_USER, TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'en' | 'vi'>('vi'); // Default to Vietnamese
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const t = TRANSLATIONS[language];

  // Load state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedEvents = localStorage.getItem('events');
    const savedTasks = localStorage.getItem('tasks');
    const savedNotes = localStorage.getItem('notes');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedLanguage = localStorage.getItem('language') as 'en' | 'vi';

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedLanguage) setLanguage(savedLanguage);
    else setLanguage('vi'); // Ensure default is VI even if nothing saved
    setDarkMode(savedDarkMode);
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.body.classList.add('bg-slate-900', 'text-white');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
    } else {
      document.body.classList.remove('bg-slate-900', 'text-white');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  const addEvent = (event: TimetableEvent) => setEvents(prev => [...prev, event]);
  const deleteEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));
  const updateEvent = (id: string, updates: Partial<TimetableEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addTask = (task: Task) => setTasks(prev => [...prev, task]);
  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const saveNote = (note: Note) => {
    setNotes(prev => {
      const exists = prev.find(n => n.id === note.id || n.eventId === note.eventId);
      if (exists) {
        return prev.map(n => (n.id === exists.id) ? note : n);
      }
      return [...prev, note];
    });
  };

  if (!user) {
    return <AuthForm onLogin={handleLogin} t={t} />;
  }

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header 
          activeTab={activeTab} 
          user={user} 
          onNotificationClick={() => setActiveTab('reminders')}
          darkMode={darkMode}
          t={t}
        />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          {activeTab === 'dashboard' && (
            <Dashboard 
              user={user} 
              events={events} 
              tasks={tasks} 
              onNavigate={setActiveTab}
              language={language}
              t={t}
            />
          )}
          {activeTab === 'timetable' && (
            <Timetable 
              events={events} 
              onAddEvent={addEvent} 
              onDeleteEvent={deleteEvent}
              onUpdateEvent={updateEvent}
              darkMode={darkMode}
              language={language}
              t={t}
            />
          )}
          {activeTab === 'tasks' && (
            <TaskManager 
              tasks={tasks} 
              events={events}
              onAddTask={addTask} 
              onUpdateTask={updateTask} 
              onDeleteTask={deleteTask}
              darkMode={darkMode}
              language={language}
              t={t}
            />
          )}
          {activeTab === 'notes' && (
            <NoteManager 
              notes={notes} 
              events={events} 
              onSaveNote={saveNote}
              darkMode={darkMode}
              language={language}
              t={t}
            />
          )}
          {activeTab === 'reminders' && (
            <Reminders 
              tasks={tasks} 
              events={events}
              darkMode={darkMode}
              t={t}
            />
          )}
          {activeTab === 'profile' && (
            <Profile 
              user={user} 
              onUpdateUser={setUser}
              darkMode={darkMode}
              t={t}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
