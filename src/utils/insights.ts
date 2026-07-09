/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trade, TradeStatus, EmotionTag } from '../types';

export interface TradeInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  category: 'psychology' | 'risk' | 'setup' | 'discipline';
  text: string;
  severity: number; // 1-10 (higher means more critical)
}

/**
 * Helper to get the setup that appeared most frequently in a list of trades
 */
function getDominantSetup(trades: Trade[], lang: 'fa' | 'en'): string {
  const counts: Record<string, number> = {};
  trades.forEach(t => {
    const setup = t.setup ? t.setup.trim() : '';
    const displaySetup = setup || (lang === 'fa' ? 'بدون ستاپ' : 'No Setup');
    counts[displaySetup] = (counts[displaySetup] || 0) + 1;
  });
  let maxSetup = lang === 'fa' ? 'بدون ستاپ' : 'No Setup';
  let maxCount = 0;
  Object.entries(counts).forEach(([setup, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxSetup = setup;
    }
  });
  return maxSetup;
}

/**
 * Rule 1: Revenge Trading Detection
 * Trigger: 2+ consecutive losses in a single day, followed by another trade on that same day.
 */
export function detectRevengeTrading(trades: Trade[], lang: 'fa' | 'en'): TradeInsight | null {
  const closedTrades = trades.filter(t => t.status !== TradeStatus.OPEN && t.dateEntry);
  if (closedTrades.length < 3) return null;

  // Sort chronologically
  const sorted = [...closedTrades].sort((a, b) => a.dateEntry.localeCompare(b.dateEntry));

  // Group by day YYYY-MM-DD
  const dayTrades: Record<string, Trade[]> = {};
  sorted.forEach(t => {
    const day = t.dateEntry.split('T')[0];
    if (!dayTrades[day]) dayTrades[day] = [];
    dayTrades[day].push(t);
  });

  // Check days
  for (const [day, dayList] of Object.entries(dayTrades)) {
    if (dayList.length < 3) continue;

    let consecutiveLosses: Trade[] = [];
    for (let i = 0; i < dayList.length; i++) {
      const currentTrade = dayList[i];
      if (currentTrade.status === TradeStatus.LOST) {
        consecutiveLosses.push(currentTrade);
      } else {
        if (consecutiveLosses.length >= 2 && i < dayList.length - 1) {
          const nextTrades = dayList.slice(i);
          const totalPnlAfter = nextTrades.reduce((sum, t) => sum + t.pnl, 0);
          const nextSymbol = nextTrades[0].symbol.toUpperCase();
          const nextSetup = nextTrades[0].setup || (lang === 'fa' ? 'بدون ستاپ' : 'no setup');
          const nextDir = nextTrades[0].direction;

          if (totalPnlAfter < 0) {
            const absPnl = Math.abs(Math.round(totalPnlAfter));
            return {
              id: `revenge_${day}`,
              type: 'error',
              category: 'psychology',
              severity: 9.5,
              text: lang === 'fa'
                ? `شناسایی معامله انتقامی در تاریخ ${day} روی ${nextSymbol}! پس از ${consecutiveLosses.length} باخت متوالی، پوزیشن ${nextDir === 'LONG' ? 'خرید' : 'فروش'} را با ستاپ '${nextSetup}' باز کردید که باعث ضرر ${absPnl}$ شد.`
                : `Revenge trading detected on ${day} (${nextSymbol})! After ${consecutiveLosses.length} consecutive losses, you entered a ${nextDir} trade with '${nextSetup}' setup, losing $${absPnl}.`
            };
          }
        }
        consecutiveLosses = [];
      }
    }

    if (consecutiveLosses.length >= 2) {
      const lastLossIndex = dayList.indexOf(consecutiveLosses[consecutiveLosses.length - 1]);
      if (lastLossIndex < dayList.length - 1) {
        const nextTrades = dayList.slice(lastLossIndex + 1);
        const totalPnlAfter = nextTrades.reduce((sum, t) => sum + t.pnl, 0);
        const nextSymbol = nextTrades[0].symbol.toUpperCase();
        const nextSetup = nextTrades[0].setup || (lang === 'fa' ? 'بدون ستاپ' : 'no setup');
        const nextDir = nextTrades[0].direction;

        const absPnl = Math.abs(Math.round(totalPnlAfter));
        const isLoss = totalPnlAfter < 0;

        return {
          id: `revenge_${day}`,
          type: isLoss ? 'error' : 'warning',
          category: 'psychology',
          severity: isLoss ? 9.5 : 7.0,
          text: lang === 'fa'
            ? isLoss
              ? `معامله انتقامی در تاریخ ${day} روی ${nextSymbol}! پس از ${consecutiveLosses.length} باخت متوالی پوزیشن ${nextDir === 'LONG' ? 'خرید' : 'فروش'} با ستاپ '${nextSetup}' ثبت کردید و ${absPnl}$ دیگر زیان دادید.`
              : `ریسک روانی بالا در تاریخ ${day} روی ${nextSymbol}! پس از ${consecutiveLosses.length} باخت پیاپی، ترید انتقامی زدید و خوش‌شانس بودید که ${absPnl}$ سود شد، اما این نقض جدی انضباط است.`
            : isLoss
              ? `Revenge trading on ${day} (${nextSymbol})! Following ${consecutiveLosses.length} consecutive losses, you executed a ${nextDir} trade using '${nextSetup}' and lost another $${absPnl}.`
              : `High emotional risk on ${day} (${nextSymbol})! After ${consecutiveLosses.length} losses, you revenge-traded and fortunately recovered $${absPnl}, but remember this breaches discipline.`
        };
      }
    }
  }

  return null;
}

/**
 * Rule 2: Overtrading Detection
 * Trigger: More than 4 trades in a single day
 */
export function detectOvertrading(trades: Trade[], lang: 'fa' | 'en'): TradeInsight | null {
  const closedTrades = trades.filter(t => t.status !== TradeStatus.OPEN && t.dateEntry);
  if (closedTrades.length === 0) return null;

  const dayTrades: Record<string, Trade[]> = {};
  closedTrades.forEach(t => {
    const day = t.dateEntry.split('T')[0];
    if (!dayTrades[day]) dayTrades[day] = [];
    dayTrades[day].push(t);
  });

  let maxTradesDay = '';
  let maxTradesCount = 0;
  for (const [day, list] of Object.entries(dayTrades)) {
    if (list.length > maxTradesCount) {
      maxTradesCount = list.length;
      maxTradesDay = day;
    }
  }

  if (maxTradesCount > 4) {
    const dayList = dayTrades[maxTradesDay];
    const dayPnl = dayList.reduce((sum, t) => sum + t.pnl, 0);
    const dominantSetup = getDominantSetup(dayList, lang);
    const absPnl = Math.abs(Math.round(dayPnl));
    const pnlText = dayPnl >= 0 ? `+${absPnl}` : `-${absPnl}`;

    return {
      id: `overtrading_${maxTradesDay}`,
      type: dayPnl < 0 ? 'error' : 'warning',
      category: 'discipline',
      severity: dayPnl < 0 ? 8.5 : 6.5,
      text: lang === 'fa'
        ? `بیش‌معاملاتی (Overtrading) در تاریخ ${maxTradesDay}! ثبت ${maxTradesCount} معامله در یک روز (فراتر از حد مجاز ۴). بازدهی روز ${pnlText}$ با ستاپ غالب '${dominantSetup}' ثبت شد.`
        : `Overtrading flag on ${maxTradesDay}! You executed ${maxTradesCount} trades in one day (Limit: 4). Total daily P&L was $${pnlText} with '${dominantSetup}' setup dominating.`
    };
  }

  return null;
}

/**
 * Rule 3: Strategy Synergy / High Winrate Setup
 * Trigger: A setup with at least 3 trades and winrate >= 60%
 */
export function detectStrategySynergy(trades: Trade[], lang: 'fa' | 'en'): TradeInsight | null {
  const closedTrades = trades.filter(t => t.status !== TradeStatus.OPEN);
  if (closedTrades.length < 5) return null;

  const setupStats: Record<string, { total: number; won: number; pnl: number }> = {};
  closedTrades.forEach(t => {
    const setup = t.setup ? t.setup.trim() : '';
    if (!setup) return;
    if (!setupStats[setup]) {
      setupStats[setup] = { total: 0, won: 0, pnl: 0 };
    }
    setupStats[setup].total += 1;
    setupStats[setup].pnl += t.pnl;
    if (t.status === TradeStatus.WON) {
      setupStats[setup].won += 1;
    }
  });

  let bestSetup = '';
  let bestWinRate = 0;
  let bestStats: { total: number; won: number; pnl: number } | null = null;

  Object.entries(setupStats).forEach(([setup, stat]) => {
    if (stat.total >= 3) {
      const winRate = (stat.won / stat.total) * 100;
      if (winRate >= 60 && winRate > bestWinRate && stat.pnl > 0) {
        bestWinRate = winRate;
        bestSetup = setup;
        bestStats = stat;
      }
    }
  });

  if (bestSetup && bestStats) {
    const pnlVal = Math.round(bestStats.pnl);
    return {
      id: `synergy_${bestSetup.toLowerCase()}`,
      type: 'success',
      category: 'setup',
      severity: 8.0,
      text: lang === 'fa'
        ? `هم‌افزایی عالی با ستاپ '${bestSetup}': نرخ برد بی‌‌نظیر ${Math.round(bestWinRate)}٪ در ${bestStats.total} معامله، مجموعاً سود خالص ${pnlVal}$ را به ارمغان آورده است!`
        : `Excellent setup synergy: Your '${bestSetup}' setup has a ${Math.round(bestWinRate)}% win rate across ${bestStats.total} trades, yielding $${pnlVal} net profit!`
    };
  }

  return null;
}

/**
 * Rule 4: FOMO Leak Detection
 * Trigger: Multiple trades tagged FOMO that resulted in net losses
 */
export function detectFomoImpact(trades: Trade[], lang: 'fa' | 'en'): TradeInsight | null {
  const closedTrades = trades.filter(t => t.status !== TradeStatus.OPEN);
  if (closedTrades.length === 0) return null;

  const fomoTrades = closedTrades.filter(t => t.emotions && t.emotions.includes(EmotionTag.FOMO));
  if (fomoTrades.length < 2) return null;

  const fomoLosses = fomoTrades.filter(t => t.status === TradeStatus.LOST);
  const totalFomoLoss = fomoLosses.reduce((sum, t) => sum + Math.abs(t.pnl), 0);
  const fomoCount = fomoTrades.length;

  if (fomoLosses.length >= 1) {
    const sorted = [...fomoLosses].sort((a, b) => b.dateEntry.localeCompare(a.dateEntry));
    const example = sorted[0];
    const date = example.dateEntry.split('T')[0];
    const symbol = example.symbol.toUpperCase();
    const setup = example.setup || (lang === 'fa' ? 'بدون ستاپ' : 'no setup');

    return {
      id: `fomo_leak`,
      type: 'error',
      category: 'psychology',
      severity: 8.0,
      text: lang === 'fa'
        ? `تاثیر مخرب فومو (FOMO): ثبت ${fomoCount} معامله احساسی با تگ فومو زیان ${Math.round(totalFomoLoss)}$ ایجاد کرده (مانند معامله ${symbol} با ستاپ '${setup}' در تاریخ ${date}).`
        : `FOMO leak detected! You took ${fomoCount} FOMO trades, costing you $${Math.round(totalFomoLoss)} (e.g. ${symbol} on ${date} using '${setup}' setup). Wait for proper confirmations.`
    };
  }

  return null;
}



/**
 * Rule 6: Inconsistent Sizing
 * Trigger: One position has size > 2.5x the average size
 */
export function detectInconsistentSizing(trades: Trade[], lang: 'fa' | 'en'): TradeInsight | null {
  const closedTrades = trades.filter(t => t.status !== TradeStatus.OPEN);
  if (closedTrades.length < 5) return null;

  const sizes = closedTrades.map(t => {
    const val = t.quantity * t.entryPrice * (t.leverage || 1);
    return { trade: t, value: val };
  });

  const sum = sizes.reduce((acc, s) => acc + s.value, 0);
  const avg = sum / sizes.length;

  if (avg === 0) return null;

  const sorted = [...sizes].sort((a, b) => b.value - a.value);
  const maxSizer = sorted[0];
  const ratio = Math.round((maxSizer.value / avg) * 10) / 10;

  if (ratio > 2.5) {
    const symbol = maxSizer.trade.symbol.toUpperCase();
    const date = maxSizer.trade.dateEntry.split('T')[0];
    const setup = maxSizer.trade.setup || (lang === 'fa' ? 'بدون ستاپ' : 'no setup');
    const pnl = Math.round(maxSizer.trade.pnl);

    return {
      id: 'inconsistent_sizing',
      type: pnl < 0 ? 'error' : 'warning',
      category: 'risk',
      severity: pnl < 0 ? 7.5 : 5.5,
      text: lang === 'fa'
        ? `بی‌ثباتی در حجم معاملات: معامله ${symbol} در تاریخ ${date} با ستاپ '${setup}' حدود ${ratio} برابر بزرگتر از میانگین شما بود که منجر به بازدهی ${pnl}$ شد.`
        : `Inconsistent position sizing! Your ${symbol} trade on ${date} ('${setup}' setup) was ${ratio}x larger than average, causing a $${pnl >= 0 ? '+' : ''}${pnl} P&L change.`
    };
  }

  return null;
}

/**
 * Rule 7: Strategy Conflict (High Loss Strategy)
 * Trigger: Setup with win rate < 40% and negative net P&L
 */
export function detectLosingStrategy(trades: Trade[], lang: 'fa' | 'en'): TradeInsight | null {
  const closedTrades = trades.filter(t => t.status !== TradeStatus.OPEN);
  if (closedTrades.length < 5) return null;

  const setupStats: Record<string, { total: number; lost: number; pnl: number }> = {};
  closedTrades.forEach(t => {
    const setup = t.setup ? t.setup.trim() : '';
    if (!setup) return;
    if (!setupStats[setup]) {
      setupStats[setup] = { total: 0, lost: 0, pnl: 0 };
    }
    setupStats[setup].total += 1;
    setupStats[setup].pnl += t.pnl;
    if (t.status === TradeStatus.LOST) {
      setupStats[setup].lost += 1;
    }
  });

  let worstSetup = '';
  let worstWinRate = 100;
  let worstStats: { total: number; lost: number; pnl: number } | null = null;

  Object.entries(setupStats).forEach(([setup, stat]) => {
    if (stat.total >= 3) {
      const winRate = ((stat.total - stat.lost) / stat.total) * 100;
      if (winRate < 40 && winRate < worstWinRate && stat.pnl < 0) {
        worstWinRate = winRate;
        worstSetup = setup;
        worstStats = stat;
      }
    }
  });

  if (worstSetup && worstStats) {
    const absPnl = Math.abs(Math.round(worstStats.pnl));
    return {
      id: `losing_strategy_${worstSetup.toLowerCase()}`,
      type: 'error',
      category: 'setup',
      severity: 7.5,
      text: lang === 'fa'
        ? `نشتی سود در ستاپ '${worstSetup}': نرخ برد پایین ${Math.round(worstWinRate)}٪ در ${worstStats.total} معامله، مجموعاً زیان ${absPnl}$ ثبت کرده است. این استراتژی نیاز به بازنگری جدی دارد.`
        : `Strategy leak: '${worstSetup}' setup has a poor ${Math.round(worstWinRate)}% win rate across ${worstStats.total} trades, draining $${absPnl}. Re-evaluate or pause this setup.`
    };
  }

  return null;
}

/**
 * Rule 8: Emotion Leak (Greed/Fear Tag Impact)
 * Trigger: Negative net P&L on trades marked as Greedy or Fearful
 */
export function detectEmotionalLeak(trades: Trade[], lang: 'fa' | 'en'): TradeInsight | null {
  const closedTrades = trades.filter(t => t.status !== TradeStatus.OPEN);
  if (closedTrades.length < 3) return null;

  const emotionalTrades = closedTrades.filter(
    t => t.emotions && (t.emotions.includes(EmotionTag.GREEDY) || t.emotions.includes(EmotionTag.FEARFUL))
  );

  if (emotionalTrades.length < 2) return null;

  const totalLoss = emotionalTrades.reduce((sum, t) => sum + (t.pnl < 0 ? Math.abs(t.pnl) : 0), 0);
  const emotionalLossCount = emotionalTrades.filter(t => t.pnl < 0).length;

  if (emotionalLossCount >= 2 && totalLoss > 0) {
    const sorted = [...emotionalTrades].filter(t => t.pnl < 0).sort((a, b) => b.dateEntry.localeCompare(a.dateEntry));
    const example = sorted[0];
    const symbol = example.symbol.toUpperCase();
    const date = example.dateEntry.split('T')[0];
    const setup = example.setup || (lang === 'fa' ? 'بدون ستاپ' : 'no setup');
    const emoTag = example.emotions.includes(EmotionTag.GREEDY) ? (lang === 'fa' ? 'طمع‌کاری' : 'Greed') : (lang === 'fa' ? 'ترس از ضرر' : 'Fear');

    return {
      id: 'emotional_leak',
      type: 'error',
      category: 'psychology',
      severity: 7.0,
      text: lang === 'fa'
        ? `تأثیر منفی ترس/طمع: کنترل عواطف خود را دست بگیرید. تریدهای احساسی با احساس '${emoTag}' باعث ضرر مجموع ${Math.round(totalLoss)}$ شدند (مانند ${symbol} در تاریخ ${date} با ستاپ '${setup}').`
        : `Emotional Leak: trades marked with Greed/Fear caused a total loss of $${Math.round(totalLoss)} (e.g. ${symbol} on ${date} using '${setup}' setup). Strategy needs focus, not emotions.`
    };
  }

  return null;
}

/**
 * Main insights runner.
 * Computes all rules, filters nulls, and returns both list and the single most critical top insight.
 */
export function getTradingInsights(trades: Trade[], lang: 'fa' | 'en'): {
  insights: TradeInsight[];
  topInsight: TradeInsight | null;
} {
  const rules = [
    detectRevengeTrading,
    detectOvertrading,
    detectStrategySynergy,
    detectFomoImpact,
    detectInconsistentSizing,
    detectLosingStrategy,
    detectEmotionalLeak,
  ];

  const insights = rules
    .map(rule => rule(trades, lang))
    .filter((insight): insight is TradeInsight => insight !== null)
    .sort((a, b) => b.severity - a.severity);

  const topInsight = insights.length > 0 ? insights[0] : null;

  return {
    insights,
    topInsight,
  };
}

export type TraderProfileType = 'Disciplined' | 'Overtrader' | 'Revenge Trader' | 'Inconsistent';

export interface TraderProfile {
  type: TraderProfileType;
  label: string;
  description: string;
  colorClass: string;
  badgeBg: string;
  icon: string;
  metricLabel: string;
}

export function getTraderProfile(trades: Trade[], lang: 'fa' | 'en'): TraderProfile {
  const closedTrades = trades.filter(t => t.status !== TradeStatus.OPEN);
  
  if (closedTrades.length === 0) {
    return {
      type: 'Disciplined',
      label: lang === 'fa' ? 'منضبط' : 'Disciplined',
      description: lang === 'fa' 
        ? 'سیستم معاملاتی شما در حال ارزیابی انضباط و مدیریت ریسک است.' 
        : 'Your trading is being evaluated for discipline and risk management.',
      colorClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
      badgeBg: 'bg-emerald-500',
      icon: '🛡️',
      metricLabel: lang === 'fa' ? 'بدون نقض قوانین' : 'No violations'
    };
  }

  const totalClosed = closedTrades.length;
  const wonTrades = closedTrades.filter(t => t.status === TradeStatus.WON);
  const winRate = totalClosed > 0 ? (wonTrades.length / totalClosed) * 100 : 0;

  // Group by day to measure frequency and overtrading
  const dayTrades: Record<string, Trade[]> = {};
  closedTrades.forEach(t => {
    if (t.dateEntry) {
      const day = t.dateEntry.split('T')[0];
      if (!dayTrades[day]) dayTrades[day] = [];
      dayTrades[day].push(t);
    }
  });

  const activeDays = Object.keys(dayTrades).length;
  const avgTradesPerDay = activeDays > 0 ? totalClosed / activeDays : 0;
  const maxTradesInSingleDay = Math.max(...Object.values(dayTrades).map(list => list.length), 0);

  // Check streaks (consecutive losses / wins)
  const sorted = [...closedTrades].sort((a, b) => a.dateEntry.localeCompare(b.dateEntry));
  
  let currentStreak = 0;
  let maxLoseStreak = 0;
  let maxWinStreak = 0;
  let hasRevengeTradePattern = false;

  sorted.forEach((t) => {
    if (t.status === TradeStatus.WON) {
      if (currentStreak >= 0) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      if (currentStreak > maxWinStreak) maxWinStreak = currentStreak;
    } else if (t.status === TradeStatus.LOST) {
      if (currentStreak <= 0) {
        currentStreak--;
      } else {
        currentStreak = -1;
      }
      if (Math.abs(currentStreak) > maxLoseStreak) maxLoseStreak = Math.abs(currentStreak);
    }
  });

  // Revenge trade check
  for (const list of Object.values(dayTrades)) {
    if (list.length >= 3) {
      const dayListSorted = [...list].sort((a, b) => a.dateEntry.localeCompare(b.dateEntry));
      let consecutiveLosses = 0;
      for (let i = 0; i < dayListSorted.length; i++) {
        if (dayListSorted[i].status === TradeStatus.LOST) {
          consecutiveLosses++;
        } else {
          if (consecutiveLosses >= 2 && i < dayListSorted.length - 1) {
            hasRevengeTradePattern = true;
            break;
          }
          consecutiveLosses = 0;
        }
      }
      if (consecutiveLosses >= 2 && dayListSorted.length > consecutiveLosses) {
        hasRevengeTradePattern = true;
      }
    }
  }

  let type: TraderProfileType = 'Disciplined';

  if (hasRevengeTradePattern || maxLoseStreak >= 4) {
    type = 'Revenge Trader';
  } else if (maxTradesInSingleDay > 4 || avgTradesPerDay > 3) {
    type = 'Overtrader';
  } else if (winRate < 45 || maxLoseStreak >= 3) {
    type = 'Inconsistent';
  } else {
    type = 'Disciplined';
  }

  if (type === 'Revenge Trader') {
    return {
      type,
      label: lang === 'fa' ? 'معامله‌گر انتقام‌جو' : 'Revenge Trader',
      description: lang === 'fa'
        ? 'شما تمایل دارید پس از ضرر، برای جبران سریع با حجم بالاتر وارد بازار شوید.'
        : 'You tend to force trades after a loss to quickly recover drawdown.',
      colorClass: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
      badgeBg: 'bg-rose-500',
      icon: '😡',
      metricLabel: lang === 'fa' ? `بیشترین باخت پیاپی: ${maxLoseStreak}` : `Max loss streak: ${maxLoseStreak}`
    };
  } else if (type === 'Overtrader') {
    return {
      type,
      label: lang === 'fa' ? 'معامله‌گر بیش‌فعال' : 'Overtrader',
      description: lang === 'fa'
        ? 'تعداد معاملات روزانه شما زیاد است که هزینه کارمزد را بالا برده و تمرکزتان را کاهش می‌دهد.'
        : 'You trade too frequently, increasing friction fees and diluting focus.',
      colorClass: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
      badgeBg: 'bg-amber-500',
      icon: '🚀',
      metricLabel: lang === 'fa' ? `بیشترین ترید روزانه: ${maxTradesInSingleDay}` : `Max daily trades: ${maxTradesInSingleDay}`
    };
  } else if (type === 'Inconsistent') {
    return {
      type,
      label: lang === 'fa' ? 'معامله‌گر بی‌ثبات' : 'Inconsistent',
      description: lang === 'fa'
        ? 'نتایج و مدیریت ریسک شما نوسان زیادی دارد. ستاپ و حجم معاملات خود را تثبیت کنید.'
        : 'Your results show high variability. Standardize your setup and risk sizing.',
      colorClass: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
      badgeBg: 'bg-blue-600',
      icon: '⚖️',
      metricLabel: lang === 'fa' ? `نرخ برد: ${Math.round(winRate)}%` : `Win rate: ${Math.round(winRate)}%`
    };
  } else {
    return {
      type,
      label: lang === 'fa' ? 'معامله‌گر منضبط' : 'Disciplined',
      description: lang === 'fa'
        ? 'آفرین! مدیریت ریسک عالی، کنترل احساسات و وفاداری به ستاپ در رفتار شما نمایان است.'
        : 'Excellent! Great risk management, emotional control, and plan adherence.',
      colorClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
      badgeBg: 'bg-emerald-500',
      icon: '🛡️',
      metricLabel: lang === 'fa' ? `نرخ برد: ${Math.round(winRate)}%` : `Win rate: ${Math.round(winRate)}%`
    };
  }
}
