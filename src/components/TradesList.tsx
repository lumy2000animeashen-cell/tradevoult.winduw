/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Trade, TradeStatus, TradeDirection, AssetClass, TradingSession, EmotionTag } from '../types';
import { 
  translations, 
  Language, 
  getTranslatedStatus, 
  getTranslatedDirection, 
  getTranslatedAsset, 
  getTranslatedSession, 
  getTranslatedEmotion 
} from '../localization';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Eye, 
  Edit2, 
  Trash2, 
  Clock, 
  BrainCircuit, 
  Image as ImageIcon,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TradesListProps {
  trades: Trade[];
  lang: Language;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  selectedDayFilter?: string | null;
  onClearDayFilter?: () => void;
}

export default function TradesList({ 
  trades, 
  lang, 
  onEditTrade, 
  onDeleteTrade, 
  selectedDayFilter, 
  onClearDayFilter 
}: TradesListProps) {
  const t = translations[lang];

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('DATE_NEW');

  // Accordion state to track expanded trade rows
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    if (expandedTradeId === id) {
      setExpandedTradeId(null);
    } else {
      setExpandedTradeId(id);
    }
  };

  // 1. Process Filtering & Sorting
  const filteredAndSortedTrades = useMemo(() => {
    let result = [...trades];

    // Filter by calendar clicked date if any
    if (selectedDayFilter) {
      result = result.filter(tr => tr.dateEntry.startsWith(selectedDayFilter));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tr => 
        tr.symbol.toLowerCase().includes(q) || 
        (tr.setup && tr.setup.toLowerCase().includes(q)) ||
        (tr.notes && tr.notes.toLowerCase().includes(q))
      );
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter(tr => tr.status === statusFilter);
    }

    // Asset Filter
    if (assetFilter !== 'ALL') {
      result = result.filter(tr => tr.assetClass === assetFilter);
    }

    // Session Filter
    if (sessionFilter !== 'ALL') {
      result = result.filter(tr => tr.session === sessionFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'DATE_NEW') {
        return new Date(b.dateEntry).getTime() - new Date(a.dateEntry).getTime();
      } else if (sortBy === 'DATE_OLD') {
        return new Date(a.dateEntry).getTime() - new Date(b.dateEntry).getTime();
      } else if (sortBy === 'PNL_HIGH') {
        return b.pnl - a.pnl;
      } else if (sortBy === 'PNL_LOW') {
        return a.pnl - b.pnl;
      }
      return 0;
    });

    return result;
  }, [trades, searchQuery, statusFilter, assetFilter, sessionFilter, sortBy, selectedDayFilter]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8" id="trades_ledger">
      
      {/* Active Calendar Filter Indicator */}
      {selectedDayFilter && (
        <div className="mb-4 p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl flex justify-between items-center text-xs">
          <span className="text-teal-400 font-black font-mono">
            {lang === 'fa' ? 'نمایش معاملات تاریخ:' : 'FILTERING BY DATE:'} {selectedDayFilter}
          </span>
          <button 
            onClick={onClearDayFilter}
            className="px-3 py-1.5 bg-teal-500/20 text-teal-300 rounded-lg hover:bg-teal-500/30 transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            {lang === 'fa' ? 'حذف فیلتر تقویم' : 'CLEAR FILTER'}
          </button>
        </div>
      )}

      {/* 1. Header Section */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 ${lang === 'fa' ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className={`text-xl font-black text-white uppercase tracking-tight ${lang === 'fa' ? 'text-right' : ''}`}>
            {lang === 'fa' ? 'دفتر ثبت معاملات' : 'TRADING LEDGER'}
          </h2>
          <p className={`text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider ${lang === 'fa' ? 'text-right' : ''}`}>
            {lang === 'fa' ? `${filteredAndSortedTrades.length} معامله ثبت شده` : `${filteredAndSortedTrades.length} TOTAL TRADES RECORDED`}
          </p>
        </div>
      </div>

      {/* 2. Filter Control Panel */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input 
            type="text" 
            placeholder={t.searchSymbol}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-bold uppercase placeholder-slate-600 focus:outline-none focus:border-slate-700 transition-all"
            id="search_box"
          />
        </div>

        {/* Dropdown Filters Group */}
        <div className="grid grid-cols-2 sm:flex flex-wrap lg:flex-nowrap gap-2">
          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-slate-700 transition-all cursor-pointer"
          >
            <option value="ALL">{lang === 'fa' ? 'همه وضعیت‌ها' : 'ALL STATUSES'}</option>
            <option value={TradeStatus.WON}>{lang === 'fa' ? 'سود ده (Won)' : 'WON'}</option>
            <option value={TradeStatus.LOST}>{lang === 'fa' ? 'زیان ده (Lost)' : 'LOST'}</option>
            <option value={TradeStatus.OPEN}>{lang === 'fa' ? 'معاملات باز' : 'OPEN'}</option>
          </select>

          {/* Asset Class Filter */}
          <select 
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-slate-700 transition-all cursor-pointer"
          >
            <option value="ALL">{lang === 'fa' ? 'همه بازارها' : 'ALL MARKETS'}</option>
            <option value={AssetClass.FOREX}>{t.FOREX.toUpperCase()}</option>
            <option value={AssetClass.CRYPTO}>{t.CRYPTO.toUpperCase()}</option>
            <option value={AssetClass.STOCKS}>{t.STOCKS.toUpperCase()}</option>
            <option value={AssetClass.COMMODITIES}>{t.COMMODITIES.toUpperCase()}</option>
            <option value={AssetClass.INDEXES}>{t.INDEXES.toUpperCase()}</option>
          </select>

          {/* Session Filter */}
          <select 
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-slate-700 transition-all cursor-pointer"
          >
            <option value="ALL">{lang === 'fa' ? 'همه سشن‌ها' : 'ALL SESSIONS'}</option>
            <option value={TradingSession.LONDON}>{t.LONDON.toUpperCase()}</option>
            <option value={TradingSession.NEW_YORK}>{t.NEW_YORK.toUpperCase()}</option>
            <option value={TradingSession.TOKYO}>{t.TOKYO.toUpperCase()}</option>
            <option value={TradingSession.SYDNEY}>{t.SYDNEY.toUpperCase()}</option>
          </select>

          {/* Sorting Filter */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-slate-700 transition-all cursor-pointer"
          >
            <option value="DATE_NEW">{t.dateNewest.toUpperCase()}</option>
            <option value="DATE_OLD">{t.dateOldest.toUpperCase()}</option>
            <option value="PNL_HIGH">{t.pnlHighest.toUpperCase()}</option>
            <option value="PNL_LOW">{t.pnlLowest.toUpperCase()}</option>
          </select>
        </div>
      </div>

      {/* 3. Desktop Responsive Grid Table */}
      <div className="overflow-x-auto" id="trades_table_container">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest select-none bg-slate-950/20">
              <th className="py-4 px-4 w-10">{/* Expand arrow */}</th>
              <th className="py-4 px-3">{lang === 'fa' ? 'تاریخ و زمان' : 'DATE / TIME'}</th>
              <th className="py-4 px-3">{t.symbol}</th>
              <th className="py-4 px-3">{t.direction}</th>
              <th className="py-4 px-3 font-mono">{lang === 'fa' ? 'قیمت ورود / خروج' : 'ENTRY / EXIT'}</th>
              <th className="py-4 px-3 font-mono">{lang === 'fa' ? 'حجم × اهرم' : 'SIZE × LEV'}</th>
              <th className="py-4 px-3 text-right font-mono">{t.pnl}</th>
              <th className="py-4 px-3">{lang === 'fa' ? 'ستاپ / استراتژی' : 'STRATEGY'}</th>
              <th className="py-4 px-4 text-center">{lang === 'fa' ? 'عملیات' : 'ACTIONS'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-sm">
            {filteredAndSortedTrades.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                  {lang === 'fa' ? 'هیچ معامله‌ای با فیلترهای مشخص شده یافت نشد.' : 'No trades matching the filters were found.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedTrades.map((trade) => {
                const isExpanded = expandedTradeId === trade.id;
                const isLong = trade.direction === TradeDirection.LONG;
                
                // Color formatting based on status
                let pnlColor = 'text-slate-400 bg-slate-800/20';
                let directionColor = isLong ? 'text-emerald-400 bg-emerald-500/5' : 'text-rose-400 bg-rose-500/5';
                
                if (trade.status === TradeStatus.WON) {
                  pnlColor = 'text-emerald-400 font-bold bg-emerald-500/5';
                } else if (trade.status === TradeStatus.LOST) {
                  pnlColor = 'text-rose-400 font-bold bg-rose-500/5';
                } else if (trade.status === TradeStatus.BREAKEVEN) {
                  pnlColor = 'text-slate-300 font-medium bg-slate-800/50';
                }

                // Friendly short date
                const entryDateObj = new Date(trade.dateEntry);
                const dateStr = entryDateObj.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <React.Fragment key={trade.id}>
                    {/* Main Row */}
                    <tr 
                      className={`hover:bg-slate-800/25 transition cursor-pointer ${isExpanded ? 'bg-slate-800/10' : ''}`}
                      onClick={() => toggleRow(trade.id)}
                    >
                      <td className="py-3.5 px-4 text-center">
                        {isExpanded ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 text-xs font-mono font-medium">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-100 tracking-wider uppercase font-mono">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span>{trade.symbol}</span>
                            {trade.grade && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                trade.grade === 'A+' || trade.grade === 'A' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                                trade.grade === 'B' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' :
                                trade.grade === 'C' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                                'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              }`}>
                                {trade.grade}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-normal mt-0.5">{getTranslatedAsset(trade.assetClass, lang)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono border border-slate-800/40 ${directionColor}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isLong ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_4px_rgba(251,113,133,0.8)]'}`}></span>
                          {lang === 'fa' ? (isLong ? 'خرید' : 'فروش') : trade.direction}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-300">
                        <div className="flex flex-col">
                          <span>${trade.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                          {trade.exitPrice ? (
                            <span className="text-slate-400 text-[11px] mt-0.5">→ ${trade.exitPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                          ) : (
                            <span className="text-amber-400 text-[10px] bg-amber-500/10 px-1 py-0.5 rounded self-start mt-0.5">{lang === 'fa' ? 'فعال' : 'Active'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-300">
                        <div className="flex flex-col">
                          <span>{trade.quantity} <span className="text-[10px] text-slate-500">{trade.assetClass === AssetClass.FOREX ? (lang === 'fa' ? 'لات' : 'lot') : (lang === 'fa' ? 'واحد' : 'units')}</span></span>
                          {trade.leverage > 1 && (
                            <span className="text-cyan-400 text-[10px] font-semibold mt-0.5">x{trade.leverage}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold font-mono border border-slate-800/30 ${pnlColor}`}>
                          {trade.pnl > 0 ? '+' : ''}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 font-medium text-xs">
                        <div className="flex flex-col">
                          <span>{trade.setup || '-'}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 font-mono">{getTranslatedSession(trade.session, lang)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-1.5">
                          <button 
                            onClick={() => onEditTrade(trade)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                            title={t.editTrade}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => onDeleteTrade(trade.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition"
                            title={t.delete}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="bg-slate-950/40 p-0 border-b border-slate-800/40">
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden p-5 space-y-4"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left: Info Details */}
                                <div className="space-y-2.5">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Clock size={13} className="text-teal-400" />
                                    {lang === 'fa' ? 'سایر جزئیات معامله' : 'Advanced Parameters'}
                                  </h4>
                                  <ul className="text-xs space-y-2 text-slate-300 bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-xl font-mono">
                                    <li className="flex justify-between">
                                      <span className="text-slate-500">{lang === 'fa' ? 'استراتژی / ستاپ' : 'Strategy / Setup'}</span>
                                      <span className="text-teal-400 font-bold">{trade.setup || '-'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span className="text-slate-500">{lang === 'fa' ? 'سشن بازار' : 'Market Session'}</span>
                                      <span className="text-slate-200">{getTranslatedSession(trade.session, lang)}</span>
                                    </li>
                                    {trade.grade && (
                                      <li className="flex justify-between">
                                        <span className="text-slate-500">{lang === 'fa' ? 'امتیاز معامله' : 'Trade Grade'}</span>
                                        <span className={`font-bold ${
                                          trade.grade === 'A+' || trade.grade === 'A' ? 'text-emerald-400' :
                                          trade.grade === 'B' ? 'text-cyan-400' :
                                          trade.grade === 'C' ? 'text-amber-400' :
                                          'text-rose-400'
                                        }`}>{trade.grade}</span>
                                      </li>
                                    )}
                                    {trade.dateExit && (
                                      <li className="flex justify-between">
                                        <span className="text-slate-500">{lang === 'fa' ? 'زمان دقیق خروج' : 'Exit Time'}</span>
                                        <span className="text-slate-400 text-[10px]">{new Date(trade.dateExit).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')}</span>
                                      </li>
                                    )}
                                  </ul>
                                </div>

                                {/* Middle: Psychological Tags & Emotions */}
                                <div className="space-y-2.5">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <BrainCircuit size={13} className="text-indigo-400" />
                                    {t.emotions}
                                  </h4>
                                  <div className="bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-xl min-h-[100px] flex flex-wrap gap-1.5 content-start">
                                    {trade.emotions && trade.emotions.length > 0 ? (
                                      trade.emotions.map(em => (
                                        <span 
                                          key={em}
                                          className={`text-[10px] font-semibold px-2 py-1 rounded border ${
                                            em === EmotionTag.DISCIPLINED || em === EmotionTag.PATIENT || em === EmotionTag.CONFIDENT
                                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                          }`}
                                        >
                                          {getTranslatedEmotion(em, lang)}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-500 italic self-center mx-auto">
                                        {lang === 'fa' ? 'روانشناسی ثبت نشده است.' : 'No psychological tags selected.'}
                                      </span>
                                    )}
                                  </div>

                                  {/* Notes text */}
                                  <div className="space-y-1.5 mt-2">
                                    <span className="text-xs font-bold text-slate-400 block">{t.notes}</span>
                                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/20 p-2.5 rounded border border-slate-800/40 min-h-[50px] whitespace-pre-wrap">
                                      {trade.notes || (lang === 'fa' ? 'یادداشتی اضافه نشده است.' : 'No description provided for this trade.')}
                                    </p>
                                  </div>
                                </div>

                                {/* Right: Chart Screenshots (Analysis, Entry, Exit) */}
                                <div className="space-y-2.5 col-span-1 md:col-span-1">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <ImageIcon size={13} className="text-amber-400" />
                                    {lang === 'fa' ? 'تصاویر معامله' : 'Trade Screenshots'}
                                  </h4>
                                  
                                  <div className="grid grid-cols-3 gap-2">
                                    {/* Slot 1: Analysis */}
                                    <div className="space-y-1">
                                      <span className="block text-[8px] text-slate-500 font-bold text-center truncate">{lang === 'fa' ? 'تحلیل' : 'Analysis'}</span>
                                      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative aspect-square flex items-center justify-center group">
                                        {trade.imageAnalysis || trade.chartImage ? (
                                          <>
                                            <img 
                                              src={trade.imageAnalysis || trade.chartImage} 
                                              alt="Analysis" 
                                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                              referrerPolicy="no-referrer"
                                            />
                                            <a 
                                              href={trade.imageAnalysis || trade.chartImage} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white transition font-bold"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {lang === 'fa' ? 'دیدن' : 'View'}
                                            </a>
                                          </>
                                        ) : (
                                          <span className="text-[8px] text-slate-600 italic">{lang === 'fa' ? 'خالی' : 'None'}</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Slot 2: Entry */}
                                    <div className="space-y-1">
                                      <span className="block text-[8px] text-slate-500 font-bold text-center truncate">{lang === 'fa' ? 'ورود' : 'Entry'}</span>
                                      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative aspect-square flex items-center justify-center group">
                                        {trade.imageEntry ? (
                                          <>
                                            <img 
                                              src={trade.imageEntry} 
                                              alt="Entry" 
                                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                              referrerPolicy="no-referrer"
                                            />
                                            <a 
                                              href={trade.imageEntry} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white transition font-bold"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {lang === 'fa' ? 'دیدن' : 'View'}
                                            </a>
                                          </>
                                        ) : (
                                          <span className="text-[8px] text-slate-600 italic">{lang === 'fa' ? 'خالی' : 'None'}</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Slot 3: Exit */}
                                    <div className="space-y-1">
                                      <span className="block text-[8px] text-slate-500 font-bold text-center truncate">{lang === 'fa' ? 'خروج' : 'Exit'}</span>
                                      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative aspect-square flex items-center justify-center group">
                                        {trade.imageExit ? (
                                          <>
                                            <img 
                                              src={trade.imageExit} 
                                              alt="Exit" 
                                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                              referrerPolicy="no-referrer"
                                            />
                                            <a 
                                              href={trade.imageExit} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white transition font-bold"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {lang === 'fa' ? 'دیدن' : 'View'}
                                            </a>
                                          </>
                                        ) : (
                                          <span className="text-[8px] text-slate-600 italic">{lang === 'fa' ? 'خالی' : 'None'}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Prominent Edit and Delete buttons inside Details */}
                              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/60 mt-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onEditTrade(trade); }}
                                  className="flex items-center gap-1.5 py-1.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  <Edit2 size={13} />
                                  <span>{lang === 'fa' ? 'ویرایش معامله' : 'Edit Trade'}</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDeleteTrade(trade.id); }}
                                  className="flex items-center gap-1.5 py-1.5 px-3.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                  <span>{lang === 'fa' ? 'حذف معامله' : 'Delete Trade'}</span>
                                </button>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
