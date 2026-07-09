/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Trade, TradeDirection, TradeStatus, AssetClass, TradingSession, EmotionTag, TradeGrade } from '../types';
import { translations, Language, getTranslatedEmotion } from '../localization';
import { X, Upload, Info, Calculator, ShieldAlert, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';

interface TradeFormProps {
  trade?: Trade | null; // If editing
  lang: Language;
  onSave: (trade: Trade) => void;
  onClose: () => void;
}

export default function TradeForm({ trade, lang, onSave, onClose }: TradeFormProps) {
  const t = translations[lang];

  // Form Fields State
  const [symbol, setSymbol] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>(AssetClass.CRYPTO);
  const [direction, setDirection] = useState<TradeDirection>(TradeDirection.LONG);
  const [status, setStatus] = useState<TradeStatus>(TradeStatus.WON);
  const [entryPrice, setEntryPrice] = useState<number | ''>('');
  const [exitPrice, setExitPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [leverage, setLeverage] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [takeProfit, setTakeProfit] = useState<number | ''>('');
  const [pnl, setPnl] = useState<number>(0);
  const [pnlInput, setPnlInput] = useState<string>('0');
  const [fee, setFee] = useState<number>(0);
  const [session, setSession] = useState<TradingSession>(TradingSession.LONDON);
  const [setup, setSetup] = useState('');
  const [notes, setNotes] = useState('');
  const [emotions, setEmotions] = useState<EmotionTag[]>([]);
  const [dateEntry, setDateEntry] = useState('');
  const [dateExit, setDateExit] = useState('');
  const [chartImage, setChartImage] = useState<string>('');

  // 3 new image states and grade state
  const [grade, setGrade] = useState<TradeGrade | ''>('');
  const [imageAnalysis, setImageAnalysis] = useState<string>('');
  const [imageEntry, setImageEntry] = useState<string>('');
  const [imageExit, setImageExit] = useState<string>('');

  // Custom Symbols List states
  const [availableSymbols, setAvailableSymbols] = useState<string[]>(() => {
    const saved = localStorage.getItem('tj_custom_symbols');
    if (saved) {
      return JSON.parse(saved);
    }
    return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'EURUSD', 'GBPUSD', 'XAUUSD', 'AAPL', 'TSLA'];
  });
  const [isAddingCustomSymbol, setIsAddingCustomSymbol] = useState(false);
  const [newCustomSymbol, setNewCustomSymbol] = useState('');

  // Strategies List States
  const [availableSetups, setAvailableSetups] = useState<string[]>(() => {
    const saved = localStorage.getItem('tj_custom_setups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return lang === 'fa' 
      ? ['SMC', 'ICT', 'پولبک', 'شکست کانال / خط روند', 'حمایت و مقاومت', 'پرایس اکشن کلاسیک']
      : ['SMC', 'ICT', 'Pullback', 'Trendline Breakout', 'Support & Resistance', 'Classic Price Action'];
  });
  const [isAddingCustomSetup, setIsAddingCustomSetup] = useState(false);
  const [newCustomSetup, setNewCustomSetup] = useState('');

  const handleAddCustomSetup = () => {
    if (newCustomSetup.trim()) {
      const updated = [...availableSetups, newCustomSetup.trim()];
      setAvailableSetups(updated);
      localStorage.setItem('tj_custom_setups', JSON.stringify(updated));
      setSetup(newCustomSetup.trim()); // Auto-select newly added setup
      setNewCustomSetup('');
      setIsAddingCustomSetup(false);
    }
  };

  // Load existing trade if we are editing
  useEffect(() => {
    if (trade) {
      setSymbol(trade.symbol);
      setAssetClass(trade.assetClass);
      setDirection(trade.direction);
      setStatus(trade.status === TradeStatus.OPEN ? TradeStatus.WON : trade.status); // Fallback if old data has OPEN
      setEntryPrice(trade.entryPrice);
      setExitPrice(trade.exitPrice ?? '');
      setQuantity(trade.quantity);
      setLeverage(trade.leverage);
      setStopLoss(trade.stopLoss ?? '');
      setTakeProfit(trade.takeProfit ?? '');
      setPnl(trade.pnl);
      setPnlInput(trade.pnl.toString());
      setFee(trade.fee);
      setSession(trade.session);
      setSetup(trade.setup);
      setNotes(trade.notes ?? '');
      setEmotions(trade.emotions || []);
      setDateEntry(trade.dateEntry);
      setDateExit(trade.dateExit ?? '');
      setChartImage(trade.chartImage ?? '');
      setGrade(trade.grade ?? '');
      setImageAnalysis(trade.imageAnalysis ?? '');
      setImageEntry(trade.imageEntry ?? '');
      setImageExit(trade.imageExit ?? '');
    } else {
      // Default dates
      const now = new Date();
      const localISOString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDateEntry(localISOString);
      setDateExit(localISOString);
      setPnl(0);
      setPnlInput('0');
      
      // Set default symbol
      if (availableSymbols.length > 0) {
        setSymbol(availableSymbols[0]);
      }
    }
  }, [trade, availableSymbols]);

  // Removed Automated P&L Calculation logic to allow direct/manual P&L input only.

  // Helper to change status and adjust P&L sign accordingly
  const handleSetStatus = (newStatus: TradeStatus) => {
    setStatus(newStatus);
    if (newStatus === TradeStatus.WON) {
      const absolutePnl = Math.abs(pnl);
      setPnl(absolutePnl);
      let cleanedStr = pnlInput.replace(/^-/, '');
      if (cleanedStr === '') cleanedStr = '0';
      setPnlInput(cleanedStr);
    } else if (newStatus === TradeStatus.LOST) {
      const negativePnl = -Math.abs(pnl);
      setPnl(negativePnl);
      let cleanedStr = pnlInput;
      if (!cleanedStr.startsWith('-')) {
        cleanedStr = '-' + (cleanedStr === '0' ? '' : cleanedStr);
      }
      setPnlInput(cleanedStr);
    } else {
      setPnl(0);
      setPnlInput('0');
    }
  };

  // Adjust status based on P&L for closed trades
  const handlePnlFieldChange = (valStr: string) => {
    setPnlInput(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      setPnl(parsed);
      if (parsed >= 0) {
        setStatus(TradeStatus.WON);
      } else {
        setStatus(TradeStatus.LOST);
      }
    } else {
      setPnl(0);
      if (valStr.startsWith('-')) {
        setStatus(TradeStatus.LOST);
      } else {
        setStatus(TradeStatus.WON);
      }
    }
  };

  // Toggle Emotions Helper
  const handleEmotionToggle = (tag: EmotionTag) => {
    if (emotions.includes(tag)) {
      setEmotions(prev => prev.filter(e => e !== tag));
    } else {
      setEmotions(prev => [...prev, tag]);
    }
  };

  // Three File Upload References
  const fileAnalysisRef = useRef<HTMLInputElement>(null);
  const fileEntryRef = useRef<HTMLInputElement>(null);
  const fileExitRef = useRef<HTMLInputElement>(null);

  const processSpecificImage = (file: File, type: 'ANALYSIS' | 'ENTRY' | 'EXIT') => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const base64Data = e.target.result as string;
          if (type === 'ANALYSIS') {
            setImageAnalysis(base64Data);
            setChartImage(base64Data); // Keep chartImage as fallback for existing structures
          } else if (type === 'ENTRY') {
            setImageEntry(base64Data);
          } else if (type === 'EXIT') {
            setImageExit(base64Data);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || entryPrice === '' || quantity === '') return;

    // Build the final Trade object
    const finalTrade: Trade = {
      id: trade?.id || Math.random().toString(36).substring(2, 11),
      symbol: symbol.toUpperCase().trim(),
      assetClass,
      direction,
      status,
      entryPrice: Number(entryPrice),
      exitPrice: exitPrice !== '' ? Number(exitPrice) : undefined,
      quantity: Number(quantity),
      leverage: Number(leverage || 1),
      stopLoss: stopLoss !== '' ? Number(stopLoss) : undefined,
      takeProfit: takeProfit !== '' ? Number(takeProfit) : undefined,
      pnl: pnl,
      fee: Number(fee || 0),
      session,
      setup: setup.trim(),
      emotions,
      dateEntry,
      dateExit: dateExit ? dateExit : undefined,
      notes: notes.trim(),
      chartImage: imageAnalysis || chartImage || undefined,
      grade: grade || undefined,
      imageAnalysis: imageAnalysis || undefined,
      imageEntry: imageEntry || undefined,
      imageExit: imageExit || undefined
    };

    onSave(finalTrade);
  };

  const isRtl = lang === 'fa';

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${isRtl ? 'text-right' : 'text-left'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="text-white h-5 w-5" />
              {trade ? t.editTrade : t.addNewTrade}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* COLUMN 1: Basic Trade Identifiers */}
            <div className="space-y-4">
              {/* Symbol Ticker */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                  {lang === 'fa' ? 'انتخاب نماد معاملاتی' : 'Trading Asset / Pair'} <span className="text-rose-400">*</span>
                </label>
                {isAddingCustomSymbol ? (
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      required
                      placeholder="e.g. BTCUSDT"
                      value={newCustomSymbol}
                      onChange={(e) => setNewCustomSymbol(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = newCustomSymbol.trim().toUpperCase();
                        if (trimmed && !availableSymbols.includes(trimmed)) {
                          const updated = [...availableSymbols, trimmed];
                          setAvailableSymbols(updated);
                          localStorage.setItem('tj_custom_symbols', JSON.stringify(updated));
                          setSymbol(trimmed);
                        }
                        setIsAddingCustomSymbol(false);
                        setNewCustomSymbol('');
                      }}
                      className="px-3 bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {lang === 'fa' ? 'تایید' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomSymbol(false);
                        setNewCustomSymbol('');
                      }}
                      className="px-2 bg-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <select
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 cursor-pointer uppercase"
                    >
                      {availableSymbols.map((sym) => (
                        <option key={sym} value={sym} className="uppercase">{sym}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomSymbol(true)}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-xl border border-slate-800 transition flex items-center justify-center cursor-pointer gap-1 text-[11px]"
                      title={lang === 'fa' ? 'افزودن جفت ارز' : 'Add custom pair'}
                    >
                      <Plus size={15} />
                      <span>{lang === 'fa' ? 'افزودن' : 'Add'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Asset Class */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.assetClass}</label>
                <select 
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-slate-700 transition-all cursor-pointer"
                >
                  <option value={AssetClass.CRYPTO}>{t.CRYPTO.toUpperCase()}</option>
                  <option value={AssetClass.FOREX}>{t.FOREX.toUpperCase()}</option>
                  <option value={AssetClass.STOCKS}>{t.STOCKS.toUpperCase()}</option>
                  <option value={AssetClass.COMMODITIES}>{t.COMMODITIES.toUpperCase()}</option>
                  <option value={AssetClass.INDEXES}>{t.INDEXES.toUpperCase()}</option>
                </select>
              </div>

              {/* Direction Segmented Slider */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.direction}</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setDirection(TradeDirection.LONG)}
                    className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${direction === TradeDirection.LONG ? 'bg-white text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {t.LONG.toUpperCase()}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDirection(TradeDirection.SHORT)}
                    className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${direction === TradeDirection.SHORT ? 'bg-white text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {t.SHORT.toUpperCase()}
                  </button>
                </div>
              </div>

              {/* Status Segmented Grid */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.status}</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 font-black text-[9px] uppercase tracking-wider">
                  <button 
                    type="button"
                    onClick={() => { handleSetStatus(TradeStatus.WON); }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${status === TradeStatus.WON ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {lang === 'fa' ? 'سود ده' : 'Won'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { handleSetStatus(TradeStatus.LOST); }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${status === TradeStatus.LOST ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {lang === 'fa' ? 'زیان ده' : 'Lost'}
                  </button>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Prices and Execution Size */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Entry Price */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.entryPrice} <span className="text-rose-400">*</span></label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    placeholder="0.00"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>

                {/* Exit Price */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.exitPrice} {status === TradeStatus.OPEN ? '' : '*'}</label>
                  <input 
                    type="number" 
                    step="any"
                    disabled={status === TradeStatus.OPEN}
                    required={status !== TradeStatus.OPEN}
                    placeholder={status === TradeStatus.OPEN ? '-' : '0.00'}
                    value={status === TradeStatus.OPEN ? '' : exitPrice}
                    onChange={(e) => setExitPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                    className={`w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all ${status === TradeStatus.OPEN ? 'opacity-40 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div>
                {/* Quantity */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.quantity} <span className="text-rose-400">*</span></label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    placeholder="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="keep-spin w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>
              </div>

              {/* Stop Loss (SL) & Take Profit (TP) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{lang === 'fa' ? 'حد ضرر (SL)' : 'Stop Loss (SL)'}</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="0.00"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{lang === 'fa' ? 'حد سود (TP)' : 'Take Profit (TP)'}</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="0.00"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>
              </div>



              {/* Calculated Net PNL */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                {/* PNL Display & Override */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">{t.pnl}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-500 text-[10px] font-mono">$</span>
                    <input 
                      type="text" 
                      value={pnlInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                          handlePnlFieldChange(val);
                        }
                      }}
                      className={`w-full pl-6 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-black font-mono focus:outline-none focus:border-slate-700 ${
                        pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] text-teal-400 flex items-center gap-1 font-semibold">
                <Info size={11} />
                <span>{t.autoCalcPnl}</span>
              </p>
            </div>

            {/* COLUMN 3: Operational parameters & screenshot */}
            <div className="space-y-4">
              {/* Session Selection */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.session}</label>
                <select 
                  value={session}
                  onChange={(e) => setSession(e.target.value as TradingSession)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-slate-700 transition-all cursor-pointer"
                >
                  <option value={TradingSession.LONDON}>{t.LONDON.toUpperCase()}</option>
                  <option value={TradingSession.NEW_YORK}>{t.NEW_YORK.toUpperCase()}</option>
                  <option value={TradingSession.TOKYO}>{t.TOKYO.toUpperCase()}</option>
                  <option value={TradingSession.SYDNEY}>{t.SYDNEY.toUpperCase()}</option>
                </select>
              </div>

              {/* Grade / Rating of Trade */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                  {lang === 'fa' ? 'امتیاز معامله' : 'Trade Grade'}
                </label>
                <div className="grid grid-cols-5 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs font-bold">
                  {(['F', 'C', 'B', 'A', 'A+'] as TradeGrade[]).map((g) => {
                    const isSelected = grade === g;
                    let activeBg = 'bg-slate-800 text-slate-100';
                    if (isSelected) {
                      if (g === 'A+' || g === 'A') {
                        activeBg = 'bg-emerald-500 text-slate-950';
                      } else if (g === 'B') {
                        activeBg = 'bg-cyan-500 text-slate-950';
                      } else if (g === 'C') {
                        activeBg = 'bg-amber-500 text-slate-950';
                      } else {
                        activeBg = 'bg-rose-500 text-slate-950';
                      }
                    } else {
                      activeBg = 'text-slate-500 hover:text-slate-300';
                    }
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`py-2 text-center rounded-lg transition-all cursor-pointer ${activeBg}`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>



              {/* Execution Timestamps */}
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.dateEntry}</label>
                  <input 
                    type="datetime-local" 
                    value={dateEntry}
                    onChange={(e) => setDateEntry(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-black font-mono focus:outline-none cursor-pointer"
                  />
                </div>
                {status !== TradeStatus.OPEN && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.dateExit}</label>
                    <input 
                      type="datetime-local" 
                      value={dateExit}
                      onChange={(e) => setDateExit(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-black font-mono focus:outline-none cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Setup / Strategy Selection Bubbles */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4.5 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                {lang === 'fa' ? 'استراتژی و ستاپ معامله' : 'Strategy / Setup'}
              </label>
              
              {!isAddingCustomSetup ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomSetup(true)}
                  className="text-[10px] font-black text-teal-400 hover:text-teal-300 transition-all flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                >
                  <Plus size={12} />
                  <span>{lang === 'fa' ? 'افزودن استراتژی جدید' : 'Add Strategy'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder={lang === 'fa' ? 'نام استراتژی...' : 'Strategy name...'}
                    value={newCustomSetup}
                    onChange={(e) => setNewCustomSetup(e.target.value)}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-[10px] font-semibold focus:outline-none focus:border-slate-700 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSetup}
                    className="px-2 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                  >
                    {lang === 'fa' ? 'ذخیره' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingCustomSetup(false); setNewCustomSetup(''); }}
                    className="text-slate-500 hover:text-slate-300 text-[10px] font-semibold cursor-pointer"
                  >
                    {lang === 'fa' ? 'لغو' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-black uppercase tracking-wider">
              {availableSetups.map((s) => {
                const isSelected = setup === s;
                let activeStyle = '';
                if (isSelected) {
                  activeStyle = 'bg-teal-500/10 text-teal-400 border-teal-500/30 font-black';
                } else {
                  activeStyle = 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700';
                }

                return (
                  <button 
                    key={s}
                    type="button"
                    onClick={() => setSetup(isSelected ? '' : s)}
                    className={`py-2.5 px-3 border rounded-xl text-center transition-all select-none leading-tight cursor-pointer ${activeStyle}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emotions multiselect grid */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4.5 space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">{t.emotions}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-black uppercase tracking-wider">
              {Object.values(EmotionTag).map((tag) => {
                const isSelected = emotions.includes(tag);
                const isPositive = tag === EmotionTag.DISCIPLINED || tag === EmotionTag.PATIENT || tag === EmotionTag.CONFIDENT;
                
                let activeStyle = '';
                if (isSelected) {
                  activeStyle = isPositive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-black' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-black';
                } else {
                  activeStyle = 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700';
                }

                return (
                  <button 
                    key={tag}
                    type="button"
                    onClick={() => handleEmotionToggle(tag)}
                    className={`py-2.5 px-3 border rounded-xl text-center transition-all select-none leading-tight cursor-pointer ${activeStyle}`}
                  >
                    {getTranslatedEmotion(tag, lang)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Notes and Chart File Attachment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Notes textarea */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.notes}</label>
              <textarea 
                rows={6}
                placeholder={lang === 'fa' ? 'جزئیات این ستاپ معاملاتی، اشتباهات یا نکات روانشناسی و درس‌هایی که گرفتید را بنویسید...' : 'Type key setups details, mistakes made, lessons learned, or trade reviews...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-slate-700 transition-all leading-relaxed resize-none placeholder-slate-700"
              ></textarea>
            </div>

            {/* Three Screenshot Slots: Analysis, Entry, Exit */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {lang === 'fa' ? 'تصاویر معامله (تحلیل، ورود، خروج)' : 'Trade Screenshots (Analysis, Entry, Exit)'}
              </label>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Slot 1: Analysis */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] text-slate-400 font-bold">{lang === 'fa' ? '۱. تحلیل چارت' : '1. Chart Analysis'}</span>
                  <div 
                    onClick={() => fileAnalysisRef.current?.click()}
                    className="relative border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl h-24 flex flex-col justify-center items-center cursor-pointer overflow-hidden transition-all group"
                  >
                    <input 
                      type="file" 
                      ref={fileAnalysisRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) processSpecificImage(e.target.files[0], 'ANALYSIS');
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    {imageAnalysis ? (
                      <>
                        <img src={imageAnalysis} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setImageAnalysis(''); }}
                          className="absolute inset-0 bg-rose-950/80 text-white font-black text-[9px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all uppercase tracking-wider"
                        >
                          {lang === 'fa' ? 'حذف' : 'Remove'}
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 text-center p-1.5">
                        <Upload size={16} className="mb-1 text-teal-400" />
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none">{lang === 'fa' ? 'آپلود تحلیل' : 'Upload Analysis'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Slot 2: Entry */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] text-slate-400 font-bold">{lang === 'fa' ? '۲. نقطه ورود' : '2. Trade Entry'}</span>
                  <div 
                    onClick={() => fileEntryRef.current?.click()}
                    className="relative border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl h-24 flex flex-col justify-center items-center cursor-pointer overflow-hidden transition-all group"
                  >
                    <input 
                      type="file" 
                      ref={fileEntryRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) processSpecificImage(e.target.files[0], 'ENTRY');
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    {imageEntry ? (
                      <>
                        <img src={imageEntry} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setImageEntry(''); }}
                          className="absolute inset-0 bg-rose-950/80 text-white font-black text-[9px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all uppercase tracking-wider"
                        >
                          {lang === 'fa' ? 'حذف' : 'Remove'}
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 text-center p-1.5">
                        <Upload size={16} className="mb-1 text-cyan-400" />
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none">{lang === 'fa' ? 'آپلود ورود' : 'Upload Entry'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Slot 3: Exit */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] text-slate-400 font-bold">{lang === 'fa' ? '۳. نقطه خروج' : '3. Trade Exit'}</span>
                  <div 
                    onClick={() => fileExitRef.current?.click()}
                    className="relative border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl h-24 flex flex-col justify-center items-center cursor-pointer overflow-hidden transition-all group"
                  >
                    <input 
                      type="file" 
                      ref={fileExitRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) processSpecificImage(e.target.files[0], 'EXIT');
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    {imageExit ? (
                      <>
                        <img src={imageExit} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setImageExit(''); }}
                          className="absolute inset-0 bg-rose-950/80 text-white font-black text-[9px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all uppercase tracking-wider"
                        >
                          {lang === 'fa' ? 'حذف' : 'Remove'}
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 text-center p-1.5">
                        <Upload size={16} className="mb-1 text-amber-400" />
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none">{lang === 'fa' ? 'آپلود خروج' : 'Upload Exit'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons footer */}
          <div className={`flex justify-end gap-3 pt-4 border-t border-slate-800 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-blue-900/10 uppercase tracking-wider"
            >
              {t.save}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
