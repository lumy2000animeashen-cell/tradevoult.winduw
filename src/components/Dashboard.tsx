/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Trade, TradeStatus, TradingGoal, TradeDirection } from '../types';
import { translations, Language, getTranslatedAsset } from '../localization';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  BarChart3, 
  Calendar as CalendarIcon, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  Target,
  Zap,
  Activity,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Area 
} from 'recharts';

interface DashboardProps {
  trades: Trade[];
  goals: TradingGoal[];
  lang: Language;
  accountName: string;
  startingBalance: number;
  onSelectDay?: (dateStr: string) => void;
  onAddGoal?: (goal: TradingGoal) => void;
  onEditGoal?: (goal: TradingGoal) => void;
  onDeleteGoal?: (id: string) => void;
}

export default function Dashboard({ 
  trades, 
  goals, 
  lang, 
  accountName, 
  startingBalance, 
  onSelectDay,
  onAddGoal,
  onEditGoal,
  onDeleteGoal
}: DashboardProps) {
  const t = translations[lang];

  // Current year/month state for calendar - dynamically defaults to the latest trade's year/month or current date's
  const [currentYear, setCurrentYear] = useState(() => {
    if (trades && trades.length > 0) {
      const sorted = [...trades].sort((a, b) => b.dateEntry.localeCompare(a.dateEntry));
      const parts = sorted[0].dateEntry.split('T')[0].split('-');
      if (parts.length === 3) {
        return parseInt(parts[0], 10);
      }
    }
    return new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (trades && trades.length > 0) {
      const sorted = [...trades].sort((a, b) => b.dateEntry.localeCompare(a.dateEntry));
      const parts = sorted[0].dateEntry.split('T')[0].split('-');
      if (parts.length === 3) {
        return parseInt(parts[1], 10) - 1; // 0-indexed month
      }
    }
    return new Date().getMonth();
  });

  // Goal Management States
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TradingGoal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentProgress, setGoalCurrentProgress] = useState('0');
  const [goalStartDate, setGoalStartDate] = useState('');
  const [goalEndDate, setGoalEndDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const targetVal = parseFloat(goalTargetAmount) || 0;
    const progressVal = parseFloat(goalCurrentProgress) || 0;
    
    if (editingGoal) {
      onEditGoal?.({
        ...editingGoal,
        title: goalTitle,
        targetAmount: targetVal,
        currentProgress: progressVal,
        startDate: goalStartDate || todayStr,
        endDate: goalEndDate || todayStr,
        isCompleted: progressVal >= targetVal
      });
    } else {
      const newGoal: TradingGoal = {
        id: `g_${Date.now()}`,
        title: goalTitle,
        targetAmount: targetVal,
        currentProgress: progressVal,
        startDate: goalStartDate || todayStr,
        endDate: goalEndDate || todayStr,
        isCompleted: progressVal >= targetVal
      };
      onAddGoal?.(newGoal);
    }
    
    setIsGoalModalOpen(false);
    setEditingGoal(null);
    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalCurrentProgress('0');
    setGoalStartDate('');
    setGoalEndDate('');
  };

  // 1. Calculations for Statistics
  const stats = useMemo(() => {
    const closedTrades = trades.filter(tr => tr.status !== TradeStatus.OPEN);
    const wonTrades = closedTrades.filter(tr => tr.status === TradeStatus.WON);
    const lostTrades = closedTrades.filter(tr => tr.status === TradeStatus.LOST);
    const openTradesCount = trades.filter(tr => tr.status === TradeStatus.OPEN).length;

    const totalTradesCount = trades.length;
    const closedCount = closedTrades.length;

    // Calculate P&L
    const totalPnl = trades.reduce((sum, tr) => sum + tr.pnl, 0);
    const totalWinAmount = wonTrades.reduce((sum, tr) => sum + tr.pnl, 0);
    const totalLossAmount = Math.abs(lostTrades.reduce((sum, tr) => sum + tr.pnl, 0));

    // Win Rate %
    const winRate = closedCount > 0 ? (wonTrades.length / closedCount) * 100 : 0;

    // Profit Factor
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 99.9 : 0;

    // Avg Win & Avg Loss
    const avgWin = wonTrades.length > 0 ? totalWinAmount / wonTrades.length : 0;
    const avgLoss = lostTrades.length > 0 ? totalLossAmount / lostTrades.length : 0;

    // Calculate R:R
    const avgPlannedRR = avgLoss > 0 ? avgWin / avgLoss : 0;

    const currentBalance = startingBalance + totalPnl;
    const growthPercentage = startingBalance > 0 ? (totalPnl / startingBalance) * 100 : 0;

    // Best Asset Symbol
    const assetPnlMap: Record<string, number> = {};
    trades.forEach(tr => {
      assetPnlMap[tr.symbol] = (assetPnlMap[tr.symbol] || 0) + tr.pnl;
    });
    let bestAsset = '-';
    let maxAssetPnl = -Infinity;
    Object.entries(assetPnlMap).forEach(([symbol, pnl]) => {
      if (pnl > maxAssetPnl) {
        maxAssetPnl = pnl;
        bestAsset = symbol;
      }
    });

    // Best Trading Day of the Week (based on entry date)
    const dayPnlMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    trades.forEach(tr => {
      const day = new Date(tr.dateEntry).getDay();
      dayPnlMap[day] += tr.pnl;
    });
    const daysNameFa = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    const daysNameEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestDayIdx = 1;
    let maxDayPnl = -Infinity;
    Object.entries(dayPnlMap).forEach(([day, pnl]) => {
      if (pnl > maxDayPnl) {
        maxDayPnl = pnl;
        bestDayIdx = parseInt(day);
      }
    });
    const bestDay = lang === 'fa' ? daysNameFa[bestDayIdx] : daysNameEn[bestDayIdx];

    // Current Win/Loss Streak
    const sortedChronological = [...trades]
      .filter(tr => tr.status !== TradeStatus.OPEN)
      .sort((a, b) => new Date(a.dateEntry).getTime() - new Date(b.dateEntry).getTime());

    let currentStreakType: 'WON' | 'LOST' | 'NONE' = 'NONE';
    let currentStreakCount = 0;

    if (sortedChronological.length > 0) {
      const lastTrade = sortedChronological[sortedChronological.length - 1];
      if (lastTrade.status === TradeStatus.WON) {
        currentStreakType = 'WON';
        currentStreakCount = 1;
        for (let i = sortedChronological.length - 2; i >= 0; i--) {
          if (sortedChronological[i].status === TradeStatus.WON) currentStreakCount++;
          else break;
        }
      } else if (lastTrade.status === TradeStatus.LOST) {
        currentStreakType = 'LOST';
        currentStreakCount = 1;
        for (let i = sortedChronological.length - 2; i >= 0; i--) {
          if (sortedChronological[i].status === TradeStatus.LOST) currentStreakCount++;
          else break;
        }
      }
    }

    return {
      totalPnl,
      winRate,
      totalTradesCount,
      closedCount,
      openTradesCount,
      profitFactor,
      avgWin,
      avgLoss,
      avgPlannedRR,
      currentBalance,
      growthPercentage,
      bestAsset: bestAsset === '-' ? '-' : bestAsset.toUpperCase(),
      bestDay,
      streak: currentStreakCount > 0 ? `${currentStreakCount} ${currentStreakType === 'WON' ? (lang === 'fa' ? 'برد متوالی' : 'Wins') : (lang === 'fa' ? 'باخت متوالی' : 'Losses')}` : '-'
    };
  }, [trades, lang, startingBalance]);

  // Calculate Cumulative Equity Curve for Dashboard
  const equityData = useMemo(() => {
    const closedTrades = trades.filter(tr => tr.status !== TradeStatus.OPEN);
    const sortedTrades = [...closedTrades].sort(
      (a, b) => new Date(a.dateEntry).getTime() - new Date(b.dateEntry).getTime()
    );

    let currentBalance = startingBalance;
    const data = [{
      index: 0,
      balance: currentBalance,
      pnl: 0,
      date: lang === 'fa' ? 'شروع' : 'Start'
    }];

    sortedTrades.forEach((trade, i) => {
      currentBalance += trade.pnl;
      const dateObj = new Date(trade.dateEntry);
      const shortDate = dateObj.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });

      data.push({
        index: i + 1,
        balance: Math.round(currentBalance * 100) / 100,
        pnl: trade.pnl,
        date: `${trade.symbol.toUpperCase()} (${shortDate})`
      });
    });

    return data;
  }, [trades, lang, startingBalance]);

  // 2. Monthly calendar generator helper
  const calendarDays = useMemo(() => {
    // Generates a grid for currentYear and currentMonth
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Day of week for 1st of month (0-6)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Total days in this month

    const days = [];

    // Map trades to dates of this month
    const dailyPnlMap: Record<number, { pnl: number, count: number }> = {};
    trades.forEach(tr => {
      if (!tr.dateEntry) return;
      // Extract year, month, and day directly from the ISO-like date format "YYYY-MM-DD..." to prevent timezone offsets
      const parts = tr.dateEntry.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed month
        const day = parseInt(parts[2], 10);

        if (year === currentYear && month === currentMonth) {
          if (!dailyPnlMap[day]) {
            dailyPnlMap[day] = { pnl: 0, count: 0 };
          }
          dailyPnlMap[day].pnl += tr.pnl || 0;
          dailyPnlMap[day].count += 1;
        }
      }
    });

    // Padding for empty slots before first day
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, isPadding: true });
    }

    // Populate actual days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dayData = dailyPnlMap[d] || { pnl: 0, count: 0 };
      days.push({
        day: d,
        isPadding: false,
        pnl: dayData.pnl,
        tradesCount: dayData.count,
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      });
    }

    return days;
  }, [currentYear, currentMonth, trades]);

  const monthNamesFa = [
    'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
    'جولای', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const weekDaysFa = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
  const weekDaysEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="space-y-6" id="dashboard_panel">
      {/* 1. Header Hero section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric 1: Account & Current Balance */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-1 relative overflow-hidden flex flex-col justify-between"
          id="metric_current_balance"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-black uppercase tracking-wider mb-1">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
              <span>{accountName || (lang === 'fa' ? 'نام حساب' : 'ACCOUNT')}</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-none font-sans tracking-tight">
              ${stats.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-bold font-sans mt-3">
            {lang === 'fa' ? 'سرمایه اولیه:' : 'Starting Cap:'} <span className="font-mono text-slate-200">${startingBalance.toLocaleString()}</span>
          </p>
        </motion.div>

        {/* Metric 2: Net P&L & Growth % */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-1 relative overflow-hidden flex flex-col justify-between"
          id="metric_total_profit"
        >
          <div>
            <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-1">
              {lang === 'fa' ? 'سود یا زیان خالص' : 'NET PROFIT / LOSS'}
            </p>
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-black leading-none font-sans tracking-tight ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </h2>
          </div>
          <p className={`text-[11px] font-bold font-mono mt-3 ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.totalPnl >= 0 ? '▲' : '▼'} {stats.growthPercentage.toFixed(2)}% {lang === 'fa' ? 'رشد کل' : 'ROI'}
          </p>
        </motion.div>

        {/* Metric 3: Win Rate & Profit Factor */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-1 relative overflow-hidden flex flex-col justify-between"
          id="metric_win_rate"
        >
          <div>
            <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-1">{t.winRate}</p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-none font-sans tracking-tight">
              {stats.winRate.toFixed(1)}%
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-bold font-sans mt-3">
            {lang === 'fa' ? 'فاکتور سود:' : 'Profit Factor:'} <span className="font-mono text-cyan-400 font-bold">{stats.profitFactor === 99.9 ? '∞' : stats.profitFactor.toFixed(2)}</span>
          </p>
        </motion.div>

        {/* Metric 4: Average Risk to Reward Ratio */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-1 relative overflow-hidden flex flex-col justify-between"
          id="metric_risk_to_reward"
        >
          <div>
            <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-1">
              {lang === 'fa' ? 'میانگین ریسک به ریوارد' : 'AVG RISK : REWARD'}
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-none font-sans tracking-tight font-mono">
              1 : {stats.avgPlannedRR > 0 ? stats.avgPlannedRR.toFixed(1) : '1.5'}
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-bold font-sans mt-3">
            {lang === 'fa' ? 'نسبت پرداخت:' : 'Payoff Ratio:'} <span className="font-mono text-indigo-400 font-bold">{(stats.avgWin / (stats.avgLoss > 0 ? stats.avgLoss : 1)).toFixed(1)}x</span>
          </p>
        </motion.div>
      </div>

      {/* 2. Secondary stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{t.avgWin}</span>
          <span className="text-sm font-black font-mono text-emerald-400">+${stats.avgWin.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{t.avgLoss}</span>
          <span className="text-sm font-black font-mono text-rose-400">-${stats.avgLoss.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{t.streak}</span>
          <span className="text-sm font-black text-indigo-400 font-sans">{stats.streak}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{t.bestAsset}</span>
          <span className="text-sm font-black font-mono text-cyan-400">{stats.bestAsset}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl col-span-2 md:col-span-1 flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{t.bestDay}</span>
          <span className="text-sm font-black text-amber-400 font-sans">{stats.bestDay}</span>
        </div>
      </div>

      {/* Equity Curve Chart Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">{lang === 'fa' ? 'نمودار رشد سرمایه (Equity Curve)' : 'Equity Growth Curve'}</h3>
          </div>
          <div className="text-[11px] font-semibold text-slate-400 font-mono">
            {lang === 'fa' ? 'رشد تجمعی سرمایه در زمان' : 'Cumulative equity path over time'}
          </div>
        </div>
        
        <div className="h-[250px] w-full text-xs font-mono">
          {equityData.length <= 1 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 italic gap-2">
              <TrendingUp size={24} className="opacity-30 text-slate-400" />
              <span>{lang === 'fa' ? 'نمودار بعد از ثبت اولین معامله رسم خواهد شد.' : 'The chart will be rendered after your first closed trade.'}</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquityDashboard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelClassName="text-slate-400 font-bold"
                />
                <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEquityDashboard)" name={lang === 'fa' ? 'سرمایه ($)' : 'Equity ($)'} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Main layout: Trading Calendar & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: Beautiful Trading Calendar */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-teal-400" />
              <h2 className="text-base font-semibold text-slate-100">{t.tradingCalendar}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-slate-200 font-mono">
                {lang === 'fa' ? monthNamesFa[currentMonth] : monthNamesEn[currentMonth]} {currentYear}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {/* Weekdays */}
            {(lang === 'fa' ? weekDaysFa : weekDaysEn).map((day, idx) => (
              <div key={idx} className="text-xs font-bold text-slate-500 py-1 font-mono">
                {day}
              </div>
            ))}

            {/* Grid Cells */}
            {calendarDays.map((cell, idx) => {
              if (cell.isPadding) {
                return (
                  <div key={idx} className="aspect-square bg-slate-950/20 rounded-lg"></div>
                );
              }

              const hasTrades = cell.tradesCount && cell.tradesCount > 0;
              const isProfit = cell.pnl && cell.pnl > 0;
              const isLoss = cell.pnl && cell.pnl < 0;

              let bgClass = 'bg-slate-800/40 hover:bg-slate-800 border-slate-800/30';
              if (hasTrades) {
                if (isProfit) bgClass = 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 border';
                else if (isLoss) bgClass = 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 border';
                else bgClass = 'bg-slate-800 border-slate-700 border';
              }

              return (
                <div 
                  key={idx} 
                  onClick={() => cell.dateStr && onSelectDay && onSelectDay(cell.dateStr)}
                  className={`aspect-square rounded-lg p-1.5 flex flex-col justify-between items-start cursor-pointer transition relative group select-none ${bgClass}`}
                >
                  {/* Day Number */}
                  <span className={`text-[11px] font-semibold font-mono ${hasTrades ? 'text-slate-100 font-bold' : 'text-slate-400'}`}>
                    {cell.day}
                  </span>

                  {/* Trades indicator or net P&L badge */}
                  {hasTrades ? (
                    <div className="w-full text-right mt-auto leading-none">
                      <span className={`text-[9px] font-bold font-mono tracking-tight ${isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'}`}>
                        {cell.pnl > 0 ? '+' : ''}{cell.pnl !== 0 ? Math.round(cell.pnl) : 'BE'}
                      </span>
                      {/* Hover Tooltip with detailed counts */}
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-28 bg-slate-950 border border-slate-800 p-2 rounded shadow-xl text-center text-[10px] z-20 text-slate-200">
                        <div className="font-semibold text-slate-300 mb-1">{cell.dateStr}</div>
                        <div>{cell.tradesCount} {t.tradesCount}</div>
                        <div className={`font-bold font-mono ${isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'}`}>
                          PNL: {cell.pnl > 0 ? '+' : ''}{cell.pnl.toFixed(1)}$
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-600/40 font-medium select-none self-end font-mono">
                      -
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Milestones & Goals */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-amber-400" />
              <h2 className="text-base font-semibold text-slate-100">{t.tradingGoals}</h2>
            </div>
            <button
              onClick={() => {
                setEditingGoal(null);
                setGoalTitle('');
                setGoalTargetAmount('');
                setGoalCurrentProgress('0');
                setGoalStartDate(new Date().toISOString().split('T')[0]);
                setGoalEndDate(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]); // 1 week from now
                setIsGoalModalOpen(true);
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              <span>{lang === 'fa' ? 'هدف جدید' : 'New Goal'}</span>
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
            {goals.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                {lang === 'fa' ? 'هیچ هدف معاملاتی فعالی ثبت نشده است.' : 'No active trading goals set yet.'}
              </div>
            ) : (
              goals.map((goal) => {
                const percentage = Math.min(
                  100, 
                  Math.max(0, (goal.currentProgress / goal.targetAmount) * 100)
                );
                return (
                  <div key={goal.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{goal.title}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {goal.startDate} - {goal.endDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setGoalTitle(goal.title);
                            setGoalTargetAmount(goal.targetAmount.toString());
                            setGoalCurrentProgress(goal.currentProgress.toString());
                            setGoalStartDate(goal.startDate);
                            setGoalEndDate(goal.endDate);
                            setIsGoalModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
                          title={lang === 'fa' ? 'ویرایش هدف' : 'Edit Goal'}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(lang === 'fa' ? 'آیا از حذف این هدف مطمئن هستید؟' : 'Are you sure you want to delete this goal?')) {
                              onDeleteGoal?.(goal.id);
                            }
                          }}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
                          title={lang === 'fa' ? 'حذف هدف' : 'Delete Goal'}
                        >
                          <Trash2 size={13} />
                        </button>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${goal.isCompleted || percentage >= 100 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                          {goal.isCompleted || percentage >= 100 ? (lang === 'fa' ? 'تکمیل' : 'Done') : (lang === 'fa' ? 'جریان' : 'Active')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">{t.progress}</span>
                        <span className="text-slate-200 font-bold">${goal.currentProgress.toLocaleString()} / ${goal.targetAmount.toLocaleString()} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${percentage >= 100 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Goal Add/Edit Modal */}
      {isGoalModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsGoalModalOpen(false)}
        >
          <div 
            className={`bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 md:p-8 space-y-4 max-h-[90vh] overflow-y-auto ${lang === 'fa' ? 'text-right' : 'text-left'}`}
            onClick={(e) => e.stopPropagation()}
            style={{ direction: lang === 'fa' ? 'rtl' : 'ltr' }}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                {editingGoal 
                  ? (lang === 'fa' ? 'ویرایش هدف معاملاتی' : 'Edit Trading Goal') 
                  : (lang === 'fa' ? 'افزودن هدف معاملاتی جدید' : 'Add New Trading Goal')}
              </h3>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                  {lang === 'fa' ? 'عنوان هدف:' : 'Goal Title:'}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={lang === 'fa' ? 'مثلاً: ۱۰٪ رشد حساب' : 'e.g. 10% account growth'}
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-bold focus:outline-none focus:border-slate-700 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                    {lang === 'fa' ? 'سود هدف ($):' : 'Target Profit ($):'}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    placeholder="1000"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                    {lang === 'fa' ? 'پیشرفت فعلی ($):' : 'Current Progress ($):'}
                  </label>
                  <input 
                    type="number" 
                    required
                    placeholder="0"
                    value={goalCurrentProgress}
                    onChange={(e) => setGoalCurrentProgress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                    {lang === 'fa' ? 'تاریخ شروع:' : 'Start Date:'}
                  </label>
                  <input 
                    type="date" 
                    required
                    value={goalStartDate}
                    onChange={(e) => setGoalStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                    {lang === 'fa' ? 'تاریخ پایان:' : 'End Date:'}
                  </label>
                  <input 
                    type="date" 
                    required
                    value={goalEndDate}
                    onChange={(e) => setGoalEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-black font-mono focus:outline-none focus:border-slate-700 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition uppercase tracking-wider cursor-pointer"
                >
                  {lang === 'fa' ? 'ذخیره هدف' : 'Save Goal'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded-xl text-xs transition uppercase tracking-wider cursor-pointer"
                >
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
