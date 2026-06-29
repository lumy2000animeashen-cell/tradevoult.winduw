/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Trade, TradeStatus, TradingGoal } from '../types';
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
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  trades: Trade[];
  goals: TradingGoal[];
  lang: Language;
  onSelectDay?: (dateStr: string) => void;
}

export default function Dashboard({ trades, goals, lang, onSelectDay }: DashboardProps) {
  const t = translations[lang];

  // Current year/month state for calendar
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed is May, but let's use 5 for June 2026)

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
    // We sort trades by date oldest to newest to find the chronological streak
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
      bestAsset: bestAsset === '-' ? '-' : bestAsset.toUpperCase(),
      bestDay,
      streak: currentStreakCount > 0 ? `${currentStreakCount} ${currentStreakType === 'WON' ? (lang === 'fa' ? 'برد متوالی' : 'Wins') : (lang === 'fa' ? 'باخت متوالی' : 'Losses')}` : '-'
    };
  }, [trades, lang]);

  // 2. Monthly calendar generator helper
  const calendarDays = useMemo(() => {
    // Generates a grid for currentYear and currentMonth
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Day of week for 1st of month (0-6)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Total days in this month

    const days = [];

    // Map trades to dates of this month
    const dailyPnlMap: Record<number, { pnl: number, count: number }> = {};
    trades.forEach(tr => {
      const tradeDate = new Date(tr.dateEntry);
      if (tradeDate.getFullYear() === currentYear && tradeDate.getMonth() === currentMonth) {
        const dayOfMonth = tradeDate.getDate();
        if (!dailyPnlMap[dayOfMonth]) {
          dailyPnlMap[dayOfMonth] = { pnl: 0, count: 0 };
        }
        dailyPnlMap[dayOfMonth].pnl += tr.pnl;
        dailyPnlMap[dayOfMonth].count += 1;
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
        {/* Metric 1: Total Profit */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-1 relative overflow-hidden"
          id="metric_total_profit"
        >
          <p className="text-xs text-slate-500 font-black uppercase tracking-wider">{t.totalProfit}</p>
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-black leading-none font-sans tracking-tight ${stats.totalPnl >= 0 ? 'text-white' : 'text-rose-500'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </h2>
          <p className={`text-xs font-bold font-sans ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.totalPnl >= 0 ? (lang === 'fa' ? 'روند سرمایه مثبت و صعودی' : 'Positive equity growth') : (lang === 'fa' ? 'روند سرمایه کاهشی' : 'Under drawdown state')}
          </p>
        </motion.div>

        {/* Metric 2: Win Rate */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-1 relative overflow-hidden"
          id="metric_win_rate"
        >
          <p className="text-xs text-slate-500 font-black uppercase tracking-wider">{t.winRate}</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-none font-sans tracking-tight">
            {stats.winRate.toFixed(1)}%
          </h2>
          <p className="text-xs text-blue-400 font-bold">
            {trades.filter(tr => tr.status === TradeStatus.WON).length}W / {stats.closedCount}T
          </p>
        </motion.div>

        {/* Metric 3: Profit Factor */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-1 relative overflow-hidden"
          id="metric_profit_factor"
        >
          <p className="text-xs text-slate-500 font-black uppercase tracking-wider">{t.profitFactor}</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-none font-sans tracking-tight">
            {stats.profitFactor === 99.9 ? '∞' : stats.profitFactor.toFixed(2)}
          </h2>
          <p className="text-xs text-slate-400 font-bold font-sans">
            {lang === 'fa' ? 'ضریب سودآوری حساب' : 'Profitability ratio indicator'}
          </p>
        </motion.div>

        {/* Metric 4: Total Trades */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-1 relative overflow-hidden"
          id="metric_total_trades"
        >
          <p className="text-xs text-slate-500 font-black uppercase tracking-wider">{t.totalTrades}</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-none font-sans tracking-tight">
            {stats.totalTradesCount}
          </h2>
          <p className="text-xs text-indigo-400 font-bold font-sans">
            {stats.openTradesCount} {t.openTrades} {lang === 'fa' ? 'فعال' : 'active'}
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
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${goal.isCompleted || percentage >= 100 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                        {goal.isCompleted || percentage >= 100 ? (lang === 'fa' ? 'تکمیل شده' : 'Completed') : (lang === 'fa' ? 'در جریان' : 'Active')}
                      </span>
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
    </div>
  );
}
