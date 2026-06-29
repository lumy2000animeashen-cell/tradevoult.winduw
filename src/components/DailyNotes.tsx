/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyJournalEntry } from '../types';
import { translations, Language } from '../localization';
import { 
  BookOpen, 
  Smile, 
  Meh, 
  Frown, 
  CheckCircle, 
  ShieldCheck, 
  Calendar, 
  History, 
  PlusCircle,
  FileText
} from 'lucide-react';

interface DailyNotesProps {
  entries: DailyJournalEntry[];
  lang: Language;
  onSaveEntry: (entry: DailyJournalEntry) => void;
}

export default function DailyNotes({ entries, lang, onSaveEntry }: DailyNotesProps) {
  const t = translations[lang];

  // 1. Current Entry Fields State
  const [date, setDate] = useState('');
  const [mood, setMood] = useState('NEUTRAL');
  const [marketSummary, setMarketSummary] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [adheredToRules, setAdheredToRules] = useState<boolean>(true);
  const [message, setMessage] = useState('');

  // Default to today
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setDate(dateStr);

    // If there is an entry for today, load it!
    const todayEntry = entries.find(e => e.date === dateStr);
    if (todayEntry) {
      setMood(todayEntry.mood);
      setMarketSummary(todayEntry.marketSummary);
      setLessonsLearned(todayEntry.lessonsLearned);
      setAdheredToRules(todayEntry.adheredToRules);
    } else {
      setMood('NEUTRAL');
      setMarketSummary('');
      setLessonsLearned('');
      setAdheredToRules(true);
    }
  }, [entries]);

  // Handle saving
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const newEntry: DailyJournalEntry = {
      id: entries.find(e => e.date === date)?.id || Math.random().toString(36).substring(2, 11),
      date,
      mood,
      marketSummary: marketSummary.trim(),
      lessonsLearned: lessonsLearned.trim(),
      adheredToRules
    };

    onSaveEntry(newEntry);
    setMessage(t.notesSavedSuccess);
    setTimeout(() => setMessage(''), 3000);
  };

  // Select historical entry to view
  const handleSelectHistory = (entry: DailyJournalEntry) => {
    setDate(entry.date);
    setMood(entry.mood);
    setMarketSummary(entry.marketSummary);
    setLessonsLearned(entry.lessonsLearned);
    setAdheredToRules(entry.adheredToRules);
  };

  const isRtl = lang === 'fa';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="daily_journal_panel" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* LEFT/MID COLUMN: Today's entry editor */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <BookOpen className="text-white h-5 w-5" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">{t.dailyJournalTitle}</h2>
          </div>
          {/* Date Picker */}
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-black font-mono focus:outline-none cursor-pointer"
          />
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Mood Tracking */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">{t.dailyMood}</label>
            <div className="grid grid-cols-3 gap-3">
              <button 
                type="button"
                onClick={() => setMood('AMAZING')}
                className={`py-4 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  mood === 'AMAZING' 
                    ? 'bg-white border-white text-slate-950 font-black' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smile size={20} className={mood === 'AMAZING' ? 'text-slate-950' : 'text-slate-500'} />
                <span className="text-[10px] uppercase font-black tracking-wider">{t.moodAmazing}</span>
              </button>

              <button 
                type="button"
                onClick={() => setMood('NEUTRAL')}
                className={`py-4 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  mood === 'NEUTRAL' 
                    ? 'bg-white border-white text-slate-950 font-black' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Meh size={20} className={mood === 'NEUTRAL' ? 'text-slate-950' : 'text-slate-500'} />
                <span className="text-[10px] uppercase font-black tracking-wider">{t.moodNeutral}</span>
              </button>

              <button 
                type="button"
                onClick={() => setMood('STRESSED')}
                className={`py-4 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  mood === 'STRESSED' 
                    ? 'bg-white border-white text-slate-950 font-black' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Frown size={20} className={mood === 'STRESSED' ? 'text-slate-950' : 'text-slate-500'} />
                <span className="text-[10px] uppercase font-black tracking-wider">{t.moodStressed}</span>
              </button>
            </div>
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.lessonsLearnedToday}</label>
            <textarea 
              rows={3}
              placeholder={lang === 'fa' ? 'امروز چه درسی گرفتید؟ مثلا: هیجانی معامله باز نکردن، پایبندی به حد ضرر...' : 'What did you learn today? (e.g. Do not chase trades, always set stop loss...)'}
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-slate-700 transition-all leading-relaxed resize-none placeholder-slate-700"
            ></textarea>
          </div>

          {/* Market Summary */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.marketNotesToday}</label>
            <textarea 
              rows={3}
              placeholder={lang === 'fa' ? 'تحلیل روندها، اتفاقات اقتصادی مهم روز یا جزئیات نوسانات بازار...' : 'Write major news, index trends, volatility remarks or trading logs...'}
              value={marketSummary}
              onChange={(e) => setMarketSummary(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-slate-700 transition-all leading-relaxed resize-none placeholder-slate-700"
            ></textarea>
          </div>

          {/* Adherence Checkbox Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">{t.adheredToRulesToday}</span>
            <button 
              type="button"
              onClick={() => setAdheredToRules(!adheredToRules)}
              className={`px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer uppercase tracking-wider ${
                adheredToRules 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {adheredToRules ? (lang === 'fa' ? 'بله پایبند بودم' : 'Yes, I Adhered') : (lang === 'fa' ? 'خیر، تخلف قوانین داشتم' : 'No, I Breached')}
            </button>
          </div>

          {/* Save footer */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{message}</span>
            <button 
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-blue-900/10 uppercase tracking-wider"
            >
              {t.saveDailyNotes}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: History logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between h-full">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <History className="text-white h-5 w-5" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">{lang === 'fa' ? 'سوابق یادداشت‌های روزانه' : 'HISTORY'}</h2>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
            {entries.length === 0 ? (
              <p className="text-center py-10 text-slate-500 text-xs italic font-semibold">
                {lang === 'fa' ? 'هنوز هیچ یادداشتی ثبت نشده است.' : 'No historical entries saved yet.'}
              </p>
            ) : (
              [...entries]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => {
                  const isAdhered = entry.adheredToRules;

                  return (
                    <div 
                      key={entry.id}
                      onClick={() => handleSelectHistory(entry)}
                      className={`p-4 bg-slate-950 border rounded-2xl hover:border-slate-700 cursor-pointer transition-all flex items-start gap-3 ${
                        entry.date === date ? 'border-white' : 'border-slate-800'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${
                        entry.mood === 'AMAZING' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : entry.mood === 'NEUTRAL'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {entry.mood === 'AMAZING' ? <Smile size={16} /> : entry.mood === 'NEUTRAL' ? <Meh size={16} /> : <Frown size={16} />}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black font-mono text-slate-200">{entry.date}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isAdhered ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isAdhered ? (lang === 'fa' ? 'منضبط' : 'Abiding') : (lang === 'fa' ? 'خطا' : 'Breached')}
                          </span>
                        </div>
                        {entry.lessonsLearned && (
                          <p className="text-[11px] text-slate-500 truncate max-w-[150px] font-semibold">
                            {entry.lessonsLearned}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
