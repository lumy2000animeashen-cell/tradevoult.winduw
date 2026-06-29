/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Trade, TradeDirection, TradeStatus, AssetClass, TradingSession, EmotionTag } from '../types';
import { translations, Language, getTranslatedEmotion } from '../localization';
import { X, Upload, Info, Calculator, ShieldAlert, Sparkles } from 'lucide-react';

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
  const [fee, setFee] = useState<number>(0);
  const [session, setSession] = useState<TradingSession>(TradingSession.LONDON);
  const [setup, setSetup] = useState('');
  const [notes, setNotes] = useState('');
  const [emotions, setEmotions] = useState<EmotionTag[]>([]);
  const [dateEntry, setDateEntry] = useState('');
  const [dateExit, setDateExit] = useState('');
  const [chartImage, setChartImage] = useState<string>('');

  // Image upload reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Load existing trade if we are editing
  useEffect(() => {
    if (trade) {
      setSymbol(trade.symbol);
      setAssetClass(trade.assetClass);
      setDirection(trade.direction);
      setStatus(trade.status);
      setEntryPrice(trade.entryPrice);
      setExitPrice(trade.exitPrice ?? '');
      setQuantity(trade.quantity);
      setLeverage(trade.leverage);
      setStopLoss(trade.stopLoss ?? '');
      setTakeProfit(trade.takeProfit ?? '');
      setPnl(trade.pnl);
      setFee(trade.fee);
      setSession(trade.session);
      setSetup(trade.setup);
      setNotes(trade.notes ?? '');
      setEmotions(trade.emotions || []);
      setDateEntry(trade.dateEntry);
      setDateExit(trade.dateExit ?? '');
      setChartImage(trade.chartImage ?? '');
    } else {
      // Default dates
      const now = new Date();
      const localISOString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDateEntry(localISOString);
      setDateExit(localISOString);
    }
  }, [trade]);

  // Automated P&L Calculation logic
  useEffect(() => {
    // Only calculate P&L if we have entry, exit, quantity, and state is NOT open
    if (status === TradeStatus.OPEN) {
      setPnl(0);
      return;
    }

    if (entryPrice !== '' && exitPrice !== '' && quantity !== '') {
      const ep = Number(entryPrice);
      const xp = Number(exitPrice);
      const qty = Number(quantity);
      const lev = Number(leverage || 1);
      const f = Number(fee || 0);

      let calculatedPnl = 0;
      if (direction === TradeDirection.LONG) {
        calculatedPnl = (xp - ep) * qty * lev - f;
      } else {
        calculatedPnl = (ep - xp) * qty * lev - f;
      }

      // Format to 4 decimals max
      calculatedPnl = Math.round(calculatedPnl * 10000) / 10000;

      // Update P&L if different
      setPnl(calculatedPnl);
    }
  }, [entryPrice, exitPrice, quantity, leverage, direction, fee, status]);

  // Adjust status based on P&L for closed trades
  const handlePnlFieldChange = (val: number) => {
    setPnl(val);
    if (val > 0) {
      setStatus(TradeStatus.WON);
    } else if (val < 0) {
      setStatus(TradeStatus.LOST);
    } else {
      setStatus(TradeStatus.BREAKEVEN);
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

  // File Upload Handlers (converts image to Base64)
  const processImageFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setChartImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
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
      exitPrice: status !== TradeStatus.OPEN && exitPrice !== '' ? Number(exitPrice) : undefined,
      quantity: Number(quantity),
      leverage: Number(leverage || 1),
      stopLoss: stopLoss !== '' ? Number(stopLoss) : undefined,
      takeProfit: takeProfit !== '' ? Number(takeProfit) : undefined,
      pnl: status === TradeStatus.OPEN ? 0 : pnl,
      fee: Number(fee || 0),
      session,
      setup: setup.trim(),
      emotions,
      dateEntry,
      dateExit: status !== TradeStatus.OPEN && dateExit ? dateExit : undefined,
      notes: notes.trim(),
      chartImage: chartImage || undefined
    };

    onSave(finalTrade);
  };

  const isRtl = lang === 'fa';

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl p-6 md:p-8 space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}
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
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.symbol} <span className="text-rose-400">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. BTCUSDT, EURUSD, XAUUSD"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all uppercase"
                />
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
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-black text-[9px] uppercase tracking-wider">
                  <button 
                    type="button"
                    onClick={() => { setStatus(TradeStatus.WON); }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${status === TradeStatus.WON ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {lang === 'fa' ? 'سود ده (Won)' : 'Won'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setStatus(TradeStatus.LOST); }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${status === TradeStatus.LOST ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {lang === 'fa' ? 'زیان ده (Lost)' : 'Lost'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setStatus(TradeStatus.BREAKEVEN); }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${status === TradeStatus.BREAKEVEN ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {lang === 'fa' ? 'سر به سر (BE)' : 'Breakeven'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setStatus(TradeStatus.OPEN); }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${status === TradeStatus.OPEN ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {lang === 'fa' ? 'باز (Active)' : 'Open Trade'}
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

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>

                {/* Leverage */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.leverage}</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="1"
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Stop Loss */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.stopLoss}</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="Optional"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>

                {/* Take Profit */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.takeProfit}</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="Optional"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>
              </div>

              {/* Commission / Fee & Calculated Net PNL */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                {/* Fee */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">{t.fee}</label>
                  <input 
                    type="number" 
                    step="any"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs font-black font-mono focus:outline-none focus:border-slate-700"
                  />
                </div>

                {/* PNL Display & Override */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">{t.pnl}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-500 text-[10px] font-mono">$</span>
                    <input 
                      type="number" 
                      step="any"
                      disabled={status === TradeStatus.OPEN}
                      value={status === TradeStatus.OPEN ? 0 : pnl}
                      onChange={(e) => handlePnlFieldChange(Number(e.target.value))}
                      className={`w-full pl-6 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-black font-mono focus:outline-none focus:border-slate-700 ${
                        status === TradeStatus.OPEN ? 'text-slate-500 opacity-50' : pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
              
              {status !== TradeStatus.OPEN && (
                <p className="text-[10px] text-teal-400 flex items-center gap-1 font-semibold">
                  <Info size={11} />
                  <span>{t.autoCalcPnl}</span>
                </p>
              )}
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

              {/* Setup / Strategy */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.setup}</label>
                <input 
                  type="text" 
                  placeholder="e.g. SMC Orderblock, ICT Breaker, Pullback"
                  value={setup}
                  onChange={(e) => setSetup(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-slate-700 transition-all"
                />
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
                rows={4}
                placeholder={lang === 'fa' ? 'جزئیات این ستاپ معاملاتی، اشتباهات یا نکات روانشناسی و درس‌هایی که گرفتید را بنویسید...' : 'Type key setups details, mistakes made, lessons learned, or trade reviews...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-slate-700 transition-all leading-relaxed resize-none placeholder-slate-700"
              ></textarea>
            </div>

            {/* Drag & Drop Screenshot upload */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{t.chartScreenshot}</label>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl h-28 flex flex-col justify-center items-center p-4 text-center cursor-pointer transition-all ${
                  isDragActive ? 'border-teal-500 bg-teal-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {chartImage ? (
                  <div className="flex items-center gap-3 w-full">
                    <img 
                      src={chartImage} 
                      alt="Thumbnail preview" 
                      className="h-16 w-24 object-cover rounded border border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left overflow-hidden flex-1">
                      <p className="text-xs font-black text-emerald-400 font-mono truncate">{lang === 'fa' ? 'تصویر با موفقیت بارگذاری شد' : 'IMAGE UPLOADED'}</p>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setChartImage(''); }}
                        className="text-[10px] text-rose-400 hover:underline mt-1 block font-black uppercase tracking-wider"
                      >
                        {lang === 'fa' ? 'حذف تصویر' : 'REMOVE IMAGE'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="text-slate-500 h-6 w-6 mb-1" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-tight">
                      {t.dragScreenshot}
                    </p>
                  </>
                )}
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
