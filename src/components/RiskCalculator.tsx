/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChecklistItem } from '../types';
import { translations, Language } from '../localization';
import { 
  Calculator, 
  CheckSquare, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  DollarSign, 
  HelpCircle,
  TrendingDown,
  Percent,
  CheckCircle2
} from 'lucide-react';

interface RiskCalculatorProps {
  checklist: ChecklistItem[];
  lang: Language;
  onUpdateChecklist: (items: ChecklistItem[]) => void;
}

export default function RiskCalculator({ checklist, lang, onUpdateChecklist }: RiskCalculatorProps) {
  const t = translations[lang];

  // 1. Calculator Fields State
  const [balance, setBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number | ''>('');
  const [stopLoss, setStopLoss] = useState<number | ''>('');

  // Calculations Output
  const [calculatedSize, setCalculatedSize] = useState<number>(0);
  const [riskedAmount, setRiskedAmount] = useState<number>(0);
  const [slPercent, setSlPercent] = useState<number>(0);

  useEffect(() => {
    const bal = Number(balance || 0);
    const rPct = Number(riskPercent || 0);
    const ent = Number(entryPrice || 0);
    const sl = Number(stopLoss || 0);

    const totalRiskedCash = bal * (rPct / 100);
    setRiskedAmount(totalRiskedCash);

    if (ent > 0 && sl > 0) {
      const slDiff = Math.abs(ent - sl);
      const slPctOfEntry = (slDiff / ent) * 100;
      setSlPercent(slPctOfEntry);

      if (slDiff > 0) {
        // Position Size = Risk Amount / SL Distance
        const pSize = totalRiskedCash / slDiff;
        setCalculatedSize(Math.round(pSize * 10000) / 10000);
      } else {
        setCalculatedSize(0);
      }
    } else {
      setSlPercent(0);
      setCalculatedSize(0);
    }
  }, [balance, riskPercent, entryPrice, stopLoss]);

  // 2. Checklist Items State & Actions
  const [newItemText, setNewItemText] = useState('');
  const [itemCategory, setItemCategory] = useState<'PRE_TRADE' | 'POST_TRADE' | 'GENERAL'>('PRE_TRADE');

  const handleToggleCheck = (id: string) => {
    const updated = checklist.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    onUpdateChecklist(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substring(2, 11),
      text: newItemText.trim(),
      checked: false,
      category: itemCategory
    };

    onUpdateChecklist([...checklist, newItem]);
    setNewItemText('');
  };

  const handleDeleteItem = (id: string) => {
    const updated = checklist.filter(item => item.id !== id);
    onUpdateChecklist(updated);
  };

  const isRtl = lang === 'fa';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="risk_and_checklists" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* LEFT COLUMN: Risk Calculator */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Calculator className="text-white h-5 w-5" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">{t.riskCalculator}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Balance */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.accountBalance}</label>
              <div className="relative">
                <span className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-3 text-slate-500 text-xs font-mono`}>$</span>
                <input 
                  type="number" 
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className={`w-full ${isRtl ? 'pr-8 pl-4' : 'pl-8 pr-4'} py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all`}
                />
              </div>
            </div>

            {/* Risk Percent */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.riskPercent}</label>
              <div className="relative">
                <span className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-3 text-slate-500 text-xs font-mono`}>%</span>
                <input 
                  type="number" 
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entry Price */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.entryPrice}</label>
              <input 
                type="number" 
                step="any"
                placeholder="0.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
              />
            </div>

            {/* Stop Loss */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.stopLoss}</label>
              <input 
                type="number" 
                step="any"
                placeholder="0.00"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value !== '' ? Number(e.target.value) : '')}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
              />
            </div>
          </div>

          {/* Warning Indicator */}
          {(!entryPrice || !stopLoss) && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-2.5 text-xs text-amber-400">
              <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
              <p className="leading-tight font-sans font-semibold">
                {t.riskWarning} {lang === 'fa' ? 'قیمت ورود و حد ضرر را برای محاسبه دقیق حجم وارد کنید.' : 'Input Entry Price and Stop Loss to calculate optimal trade sizing.'}
              </p>
            </div>
          )}
        </div>

        {/* Outputs Grid Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3.5 mt-5">
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-800/80">
            {/* Risk Amount */}
            <div className="px-1">
              <span className="text-[9px] text-slate-500 font-black block mb-1 uppercase tracking-wider">{t.riskedAmount}</span>
              <span className="text-sm font-black font-mono text-rose-500">${Math.round(riskedAmount)}</span>
            </div>

            {/* Stop loss percentage */}
            <div className="px-1 border-slate-800">
              <span className="text-[9px] text-slate-500 font-black block mb-1 uppercase tracking-wider">{t.slPercent}</span>
              <span className="text-sm font-black font-mono text-white">{slPercent.toFixed(2)}%</span>
            </div>

            {/* Position size calculated */}
            <div className="px-1 border-slate-800">
              <span className="text-[9px] text-slate-500 font-black block mb-1 uppercase tracking-wider">{t.calculatedSize}</span>
              <span className="text-sm font-black font-mono text-emerald-400">
                {calculatedSize > 0 ? calculatedSize.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-'}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[9px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1.5 bg-slate-900/10 p-2.5 rounded-xl border border-slate-900">
            <HelpCircle size={12} className="text-blue-500" />
            <span className="font-sans font-semibold">{t.riskTip}</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Trading Rules & Checklists */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
            <CheckSquare className="text-white h-5 w-5" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">{t.checklistTitle}</h2>
          </div>

          {/* Quick Filter tabs */}
          <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800 font-black text-[9px] uppercase tracking-wider">
            <button 
              type="button"
              onClick={() => setItemCategory('PRE_TRADE')}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${itemCategory === 'PRE_TRADE' ? 'bg-white text-slate-950 font-black shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.preTradeCheck}
            </button>
            <button 
              type="button"
              onClick={() => setItemCategory('POST_TRADE')}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${itemCategory === 'POST_TRADE' ? 'bg-white text-slate-950 font-black shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.postTradeCheck}
            </button>
            <button 
              type="button"
              onClick={() => setItemCategory('GENERAL')}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${itemCategory === 'GENERAL' ? 'bg-white text-slate-950 font-black shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.generalRules}
            </button>
          </div>

          {/* Checklist Entries */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {checklist.filter(item => item.category === itemCategory).length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-xs italic font-semibold">
                {lang === 'fa' ? 'هیچ قانونی در این بخش تعریف نشده است.' : 'No active rules defined in this category.'}
              </p>
            ) : (
              checklist
                .filter(item => item.category === itemCategory)
                .map((item) => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-center p-3.5 bg-slate-950 rounded-xl border border-slate-800 group hover:border-slate-700 transition-all"
                  >
                    <button 
                      type="button"
                      onClick={() => handleToggleCheck(item.id)}
                      className="flex items-center gap-3 text-right flex-1 select-none cursor-pointer"
                    >
                      <span className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
                        item.checked 
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                          : 'border-slate-800 bg-slate-900 group-hover:border-slate-700'
                      }`}>
                        {item.checked && <CheckCircle2 size={12} className="stroke-[3]" />}
                      </span>
                      <span className={`text-xs font-semibold ${item.checked ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                        {item.text}
                      </span>
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 p-1.5 rounded transition ml-2 cursor-pointer"
                      title={lang === 'fa' ? 'حذف قانون' : 'Delete rule'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Add item bar */}
        <form onSubmit={handleAddItem} className="flex gap-2 mt-5 border-t border-slate-800 pt-4">
          <input 
            type="text" 
            placeholder={t.addChecklistItem}
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-slate-700 transition-all placeholder-slate-600"
          />
          <button 
            type="submit"
            className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all flex items-center justify-center h-10 w-12 cursor-pointer shadow-md"
          >
            <Plus size={16} className="stroke-[2.5]" />
          </button>
        </form>
      </div>

    </div>
  );
}
