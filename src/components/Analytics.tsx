/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Trade, TradeStatus, EmotionTag, AssetClass, TradingSession } from '../types';
import { translations, Language, getTranslatedEmotion, getTranslatedSession, getTranslatedAsset } from '../localization';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { TrendingUp, Award, BrainCircuit, Landmark, BarChart2, Activity, Percent, ShieldCheck, TrendingDown, HelpCircle } from 'lucide-react';

interface AnalyticsProps {
  trades: Trade[];
  lang: Language;
  startingBalance: number;
}

export default function Analytics({ trades, lang, startingBalance }: AnalyticsProps) {
  const t = translations[lang];

  const closedTrades = useMemo(() => {
    return trades.filter(tr => tr.status !== TradeStatus.OPEN);
  }, [trades]);

  // Calculations for advanced metrics
  const advancedStats = useMemo(() => {
    const closedCount = closedTrades.length;
    if (closedCount === 0) {
      return {
        profitFactor: 0,
        expectancy: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        sharpeRatio: 0,
        recoveryFactor: 0,
        netProfit: 0,
      };
    }

    const wonTrades = closedTrades.filter(tr => tr.status === TradeStatus.WON);
    const lostTrades = closedTrades.filter(tr => tr.status === TradeStatus.LOST);

    const totalProfit = closedTrades.reduce((sum, tr) => sum + tr.pnl, 0);
    const totalWinAmount = wonTrades.reduce((sum, tr) => sum + tr.pnl, 0);
    const totalLossAmount = Math.abs(lostTrades.reduce((sum, tr) => sum + tr.pnl, 0));

    // Profit Factor
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 99.9 : 0;

    // Expectancy (Average PNL per trade)
    const expectancy = closedCount > 0 ? totalProfit / closedCount : 0;

    // Maximum Drawdown (absolute and percentage from peak starting at startingBalance base)
    let peak = startingBalance;
    let currentBalance = startingBalance;
    let maxDrawdownVal = 0;
    let maxDrawdownPct = 0;

    const chronologicalTrades = [...closedTrades].sort(
      (a, b) => new Date(a.dateEntry).getTime() - new Date(b.dateEntry).getTime()
    );

    chronologicalTrades.forEach(tr => {
      currentBalance += tr.pnl;
      if (currentBalance > peak) {
        peak = currentBalance;
      }
      const ddVal = peak - currentBalance;
      const ddPct = peak > 0 ? (ddVal / peak) * 100 : 0;

      if (ddVal > maxDrawdownVal) {
        maxDrawdownVal = ddVal;
      }
      if (ddPct > maxDrawdownPct) {
        maxDrawdownPct = ddPct;
      }
    });

    // Sharpe Ratio = Average return / Standard Deviation
    const avgPnl = expectancy;
    const variance = chronologicalTrades.reduce((sum, tr) => sum + Math.pow(tr.pnl - avgPnl, 2), 0) / closedCount;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgPnl / stdDev : 0;

    // Recovery Factor = Net Profit / Max Drawdown Value
    const recoveryFactor = maxDrawdownVal > 0 ? totalProfit / maxDrawdownVal : totalProfit > 0 ? 99.9 : 0;

    return {
      profitFactor,
      expectancy,
      maxDrawdown: maxDrawdownVal,
      maxDrawdownPercent: maxDrawdownPct,
      sharpeRatio,
      recoveryFactor,
      netProfit: totalProfit
    };
  }, [closedTrades, startingBalance]);

  // 1. Calculate Cumulative Equity Curve (Starting Balance from props)
  const equityData = useMemo(() => {
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
  }, [closedTrades, lang, startingBalance]);

  // 2. Setup/Strategy Performance
  const setupPerformanceData = useMemo(() => {
    const setupMap: Record<string, { pnl: number; count: number; wins: number }> = {};
    
    closedTrades.forEach(tr => {
      const sName = tr.setup ? tr.setup.trim().toUpperCase() : (lang === 'fa' ? 'بدون ستاپ' : 'No Setup');
      if (!setupMap[sName]) {
        setupMap[sName] = { pnl: 0, count: 0, wins: 0 };
      }
      setupMap[sName].pnl += tr.pnl;
      setupMap[sName].count += 1;
      if (tr.status === TradeStatus.WON) {
        setupMap[sName].wins += 1;
      }
    });

    return Object.entries(setupMap).map(([name, data]) => {
      const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 0;
      return {
        name,
        pnl: Math.round(data.pnl * 100) / 100,
        count: data.count,
        winRate: Math.round(winRate * 10) / 10
      };
    }).sort((a, b) => b.pnl - a.pnl);
  }, [closedTrades, lang]);

  // 3. Emotion Performance (Psychology impact)
  const emotionPerformanceData = useMemo(() => {
    const emotionMap: Record<EmotionTag, { pnl: number; count: number }> = {} as any;
    
    // Initialize
    Object.values(EmotionTag).forEach(tag => {
      emotionMap[tag] = { pnl: 0, count: 0 };
    });

    closedTrades.forEach(tr => {
      if (tr.emotions && tr.emotions.length > 0) {
        tr.emotions.forEach(em => {
          if (emotionMap[em]) {
            emotionMap[em].pnl += tr.pnl;
            emotionMap[em].count += 1;
          }
        });
      }
    });

    return Object.entries(emotionMap)
      .map(([emotion, data]) => {
        return {
          emotionName: getTranslatedEmotion(emotion as EmotionTag, lang),
          avgPnl: data.count > 0 ? Math.round((data.pnl / data.count) * 100) / 100 : 0,
          count: data.count
        };
      })
      .filter(item => item.count > 0)
      .sort((a, b) => b.avgPnl - a.avgPnl);
  }, [closedTrades, lang]);

  // 4. Session distribution statistics
  const sessionStatsData = useMemo(() => {
    const sessionMap: Record<TradingSession, number> = {
      [TradingSession.LONDON]: 0,
      [TradingSession.NEW_YORK]: 0,
      [TradingSession.TOKYO]: 0,
      [TradingSession.SYDNEY]: 0,
      [TradingSession.ALL]: 0
    };

    trades.forEach(tr => {
      if (tr.session) {
        sessionMap[tr.session] = (sessionMap[tr.session] || 0) + 1;
      }
    });

    const colors = ['#38bdf8', '#818cf8', '#fbbf24', '#f43f5e'];

    return Object.entries(sessionMap)
      .filter(([session]) => session !== TradingSession.ALL)
      .map(([session, count], idx) => {
        return {
          name: getTranslatedSession(session as TradingSession, lang),
          value: count,
          color: colors[idx % colors.length]
        };
      }).filter(item => item.value > 0);
  }, [trades, lang]);

  // 5. Win Rate by Asset class
  const assetWinRateData = useMemo(() => {
    const assetMap: Record<AssetClass, { won: number; total: number }> = {} as any;
    Object.values(AssetClass).forEach(cls => {
      assetMap[cls] = { won: 0, total: 0 };
    });

    closedTrades.forEach(tr => {
      if (assetMap[tr.assetClass]) {
        assetMap[tr.assetClass].total += 1;
        if (tr.status === TradeStatus.WON) {
          assetMap[tr.assetClass].won += 1;
        }
      }
    });

    return Object.entries(assetMap)
      .map(([asset, data]) => {
        const winRate = data.total > 0 ? (data.won / data.total) * 100 : 0;
        return {
          assetName: getTranslatedAsset(asset as AssetClass, lang),
          winRate: Math.round(winRate * 10) / 10,
          total: data.total
        };
      })
      .filter(item => item.total > 0);
  }, [closedTrades, lang]);

  const isRtl = lang === 'fa';

  return (
    <div className="space-y-6" id="analytics_panel" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {trades.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-sm">
          {lang === 'fa' 
            ? 'داده‌ای برای تحلیل وجود ندارد. ابتدا چند معامله در سیستم ثبت کنید.' 
            : 'No data available for analysis. Register a few trades first.'}
        </div>
      ) : (
        <>
          {/* ADVANCED STATS FIVE-COLUMN GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Profit Factor */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Percent size={11} className="text-emerald-400" />
                <span>{lang === 'fa' ? 'ضریب سود (Profit Factor)' : 'Profit Factor'}</span>
              </span>
              <p className="text-2xl font-black font-sans text-white tracking-tight">
                {advancedStats.profitFactor === 99.9 ? '∞' : advancedStats.profitFactor.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-normal">
                {lang === 'fa' ? 'مطلوب: بالای ۱.۵ (قدرت سودآوری)' : 'Optimal: > 1.5 (system profitability)'}
              </p>
            </div>

            {/* Expectancy */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Activity size={11} className="text-cyan-400" />
                <span>{lang === 'fa' ? 'امید ریاضی (Expectancy)' : 'Expectancy'}</span>
              </span>
              <p className={`text-2xl font-black font-mono tracking-tight ${advancedStats.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {advancedStats.expectancy >= 0 ? '+' : ''}${advancedStats.expectancy.toFixed(1)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-normal">
                {lang === 'fa' ? 'سود پیش‌بینی شده در هر تک معامله' : 'Expected profit margin per single trade'}
              </p>
            </div>

            {/* Max Drawdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <TrendingDown size={11} className="text-rose-400" />
                <span>{lang === 'fa' ? 'افت سرمایه (Max DD)' : 'Max Drawdown'}</span>
              </span>
              <p className="text-2xl font-black font-mono text-white tracking-tight">
                {advancedStats.maxDrawdownPercent.toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-normal">
                {lang === 'fa' ? `افت از اوج سرمایه: $${Math.round(advancedStats.maxDrawdown)}` : `Peak-to-trough: $${Math.round(advancedStats.maxDrawdown)}`}
              </p>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <ShieldCheck size={11} className="text-indigo-400" />
                <span>{lang === 'fa' ? 'نسبت شارپ (Sharpe)' : 'Sharpe Ratio'}</span>
              </span>
              <p className="text-2xl font-black font-sans text-white tracking-tight">
                {advancedStats.sharpeRatio.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-normal">
                {lang === 'fa' ? 'سنجش ریسک؛ بالای ۱ ایده آل است' : 'Risk adjusted return. >1.0 is ideal'}
              </p>
            </div>

            {/* Recovery Factor */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1 col-span-2 lg:col-span-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <HelpCircle size={11} className="text-amber-400" />
                <span>{lang === 'fa' ? 'ضریب بازیابی (Recovery)' : 'Recovery Factor'}</span>
              </span>
              <p className="text-2xl font-black font-sans text-white tracking-tight">
                {advancedStats.recoveryFactor === 99.9 ? '∞' : advancedStats.recoveryFactor.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-normal">
                {lang === 'fa' ? 'توانایی جبران دراودان؛ بالای ۳ عالی' : 'Recovery capability. >3.0 is excellent'}
              </p>
            </div>
          </div>

          {/* 1. Equity Curve Growth chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">{t.equityCurve}</h3>
            </div>
            
            <div className="h-[300px] w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    tick={{ fontSize: 9 }}
                    height={45}
                    angle={-15}
                    textAnchor="end"
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#64748b" domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                    labelClassName="text-slate-400 font-bold"
                  />
                  <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" name={lang === 'fa' ? 'کل سرمایه ($)' : 'Equity ($)'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 2. Setup Performance bar chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Landmark size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">{t.setupPerformance}</h3>
              </div>

              <div className="h-[240px] w-full text-xs font-mono">
                {setupPerformanceData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 italic">
                    {lang === 'fa' ? 'داده‌ای یافت نشد.' : 'No setup data.'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={setupPerformanceData} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#64748b" 
                        width={120} 
                        tick={{ fontSize: 9 }} 
                        textAnchor="end"
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                        labelClassName="text-slate-400 font-bold text-xs"
                      />
                      <Bar dataKey="pnl" name={lang === 'fa' ? 'سود خالص ($)' : 'Net P&L ($)'}>
                        {setupPerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 3. Emotional Correlation chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit size={18} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">{t.emotionPerformance}</h3>
              </div>

              <div className="h-[240px] w-full text-xs font-mono">
                {emotionPerformanceData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 italic text-center">
                    {lang === 'fa' ? 'برای مشاهده تاثیرات روانی، احساسات معاملات بسته شده را ثبت کنید.' : 'Add emotion tags to closed trades to see correlations.'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emotionPerformanceData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="emotionName" 
                        stroke="#64748b" 
                        tick={{ fontSize: 9 }}
                        height={45}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                        labelClassName="text-slate-400 font-bold"
                      />
                      <Bar dataKey="avgPnl" name={lang === 'fa' ? 'میانگین سود/ضرر ($)' : 'Avg PNL ($)'}>
                        {emotionPerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? '#34d399' : '#f87171'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 4. Session distribution chart (Donut) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">{t.sessionStats}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[200px]">
                {sessionStatsData.length === 0 ? (
                  <div className="col-span-2 flex items-center justify-center text-slate-500 italic h-full">
                    {lang === 'fa' ? 'داده‌ای یافت نشد.' : 'No session data.'}
                  </div>
                ) : (
                  <>
                    {/* Pie donut */}
                    <div className="h-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sessionStatsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {sessionStatsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legends info */}
                    <div className="flex flex-col justify-center space-y-2 text-xs">
                      {sessionStatsData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-300 font-semibold">{item.name}</span>
                          </div>
                          <span className="text-slate-400 font-bold font-mono">{item.value} {lang === 'fa' ? 'معامله' : 'trades'}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 5. Win Rate by Asset class */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award size={18} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">{t.winRateByAsset}</h3>
              </div>

              <div className="h-[200px] w-full text-xs font-mono">
                {assetWinRateData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 italic">
                    {lang === 'fa' ? 'داده‌ای یافت نشد.' : 'No asset data.'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetWinRateData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="assetName" 
                        stroke="#64748b" 
                        tick={{ fontSize: 9 }}
                        height={45}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                        formatter={(value) => [`${value}%`, (lang === 'fa' ? 'نرخ برد' : 'Win Rate')]}
                      />
                      <Bar dataKey="winRate" fill="#818cf8" radius={[4, 4, 0, 0]} name={lang === 'fa' ? 'نرخ برد (%)' : 'Win Rate (%)'} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
