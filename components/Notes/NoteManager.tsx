
import React, { useState, useEffect } from 'react';
import { Note, TimetableEvent } from '../../types';
import { Search, Save, Calendar, User, AlignLeft, Info, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import { enUS } from 'date-fns/locale/en-US';

interface NoteManagerProps {
  notes: Note[];
  events: TimetableEvent[];
  onSaveNote: (note: Note) => void;
  darkMode: boolean;
  language: 'en' | 'vi';
  t: any;
}

const NoteManager: React.FC<NoteManagerProps> = ({ notes, events, onSaveNote, darkMode, language, t }) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [editingContent, setEditingContent] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const currentLocale = language === 'vi' ? vi : enUS;

  // Sync content when selected event changes
  useEffect(() => {
    if (selectedEventId) {
      const existingNote = notes.find(n => n.eventId === selectedEventId);
      if (existingNote) {
        setSelectedNoteId(existingNote.id);
        setEditingContent(existingNote.content);
      } else {
        setSelectedNoteId(null);
        setEditingContent('');
      }
    }
  }, [selectedEventId, notes]);

  // Initial selection logic
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const handleSave = () => {
    if (!selectedEventId) return;
    const note: Note = {
      id: selectedNoteId || Date.now().toString(),
      eventId: selectedEventId,
      content: editingContent,
      updatedAt: new Date().toISOString()
    };
    onSaveNote(note);
    setSelectedNoteId(note.id);
  };

  const filteredNotes = notes.filter(n => {
    const event = events.find(e => e.id === n.eventId);
    return (
        event?.title.toLowerCase().includes(search.toLowerCase()) || 
        n.content.toLowerCase().includes(search.toLowerCase()) ||
        event?.code?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="h-[calc(100vh-140px)] flex gap-8 overflow-hidden max-w-7xl mx-auto">
      {/* Sidebar List */}
      <div className={`w-96 flex-shrink-0 flex flex-col bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden`}>
        <div className="p-6 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
           <h3 className="text-xl font-black mb-4 tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
             <BookOpen className="w-5 h-5 text-blue-600" /> {t.studyJournal}
           </h3>
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder={t.searchContent} 
               value={search} 
               onChange={(e) => setSearch(e.target.value)} 
               className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white" 
             />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredNotes.length > 0 ? filteredNotes.map(note => {
            const event = events.find(e => e.id === note.eventId);
            return (
              <button 
                key={note.id} 
                onClick={() => setSelectedEventId(note.eventId)} 
                className={`w-full text-left p-6 border-b dark:border-slate-700 transition-all ${
                  selectedEventId === note.eventId ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 z-10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedEventId === note.eventId ? 'text-blue-100' : 'text-blue-600'}`}>{event?.code || 'GEN'}</span>
                  <span className={`text-[10px] font-bold ${selectedEventId === note.eventId ? 'text-blue-100/60' : 'text-slate-400'}`}>
                    {format(new Date(note.updatedAt), 'd MMM', { locale: currentLocale })}
                  </span>
                </div>
                <h5 className="font-black text-lg mb-2 truncate tracking-tight">{event?.title || t.untitled}</h5>
                <p className={`text-xs line-clamp-2 leading-relaxed font-medium ${selectedEventId === note.eventId ? 'text-blue-50' : 'text-slate-500'}`}>{note.content || t.clickToWrite}</p>
              </button>
            );
          }) : (
            <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                    <AlignLeft className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-bold">{t.noRecords}</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
        <div className="p-8 border-b dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
           <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4">
                <select 
                  value={selectedEventId} 
                  onChange={(e) => setSelectedEventId(e.target.value)} 
                  className="text-2xl font-black text-slate-900 dark:text-white bg-transparent border-none outline-none cursor-pointer hover:text-blue-600 transition-colors max-w-full truncate tracking-tight"
                >
                  <option value="" disabled>{t.chooseSubject}</option>
                  {events.map(e => <option key={e.id} value={e.id} className="text-slate-900">{e.title}</option>)}
                </select>
                {activeEvent && <span className="text-xs font-black text-white px-3 py-1 rounded-full shadow-sm flex-shrink-0" style={{backgroundColor: activeEvent.color}}>{activeEvent.code}</span>}
              </div>
              {activeEvent && (
                <div className="flex items-center gap-6 text-[11px] font-black text-slate-400 mt-2 uppercase tracking-widest overflow-hidden">
                  <span className="flex items-center gap-2 whitespace-nowrap"><Calendar className="w-4 h-4" /> {format(new Date(), 'EEEE, dd/MM/yyyy', { locale: currentLocale })}</span>
                  <span className="flex items-center gap-2 truncate"><User className="w-4 h-4 flex-shrink-0" /> {activeEvent.instructor}</span>
                </div>
              )}
           </div>
           <button 
             onClick={handleSave} 
             className="flex-shrink-0 flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-xl active:scale-95 text-lg ml-4"
           >
             <Save className="w-6 h-6" /> {t.save}
           </button>
        </div>
        
        <div className="flex-1 p-10 relative">
           {!selectedEventId && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-800/90 z-10 backdrop-blur-sm">
               <Info className="w-12 h-12 text-blue-500 mb-4" />
               <p className="font-black text-slate-500 text-xl text-center px-4">{t.selectSubjectPrompt}</p>
             </div>
           )}
           <textarea 
             value={editingContent} 
             onChange={(e) => setEditingContent(e.target.value)} 
             className="w-full h-full bg-transparent border-none outline-none resize-none text-slate-800 dark:text-slate-200 font-bold leading-relaxed text-2xl no-scrollbar" 
             placeholder={t.clickToWrite}
           />
        </div>
      </div>
    </div>
  );
};

export default NoteManager;
