/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trade, 
  DailyJournalEntry, 
  ChecklistItem, 
  TradingGoal, 
  TradeStatus, 
  TradeDirection, 
  AssetClass, 
  TradingSession, 
  EmotionTag,
  TradingAccount
} from './types';
import { translations, Language } from './localization';
import Dashboard from './components/Dashboard';
import TradesList from './components/TradesList';
import TradeForm from './components/TradeForm';
import Analytics from './components/Analytics';
import DailyNotes from './components/DailyNotes';
import ExportImport from './components/ExportImport';
import LockScreen from './components/LockScreen';
import AccountSetupModal from './components/AccountSetupModal';
import { 
  BarChart3, 
  BookOpen, 
  Calculator, 
  CheckSquare, 
  Database, 
  FileSpreadsheet, 
  LayoutDashboard, 
  PlusCircle, 
  RotateCcw, 
  Languages,
  TrendingUp,
  Clock,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default initial checklist rules (Persian and English ready)
const defaultChecklist = (lang: Language): ChecklistItem[] => {
  if (lang === 'fa') {
    return [
      { id: 'c1', text: 'روند بازار در تایم‌فریم بالاتر بررسی و تایید شد؟', checked: false, category: 'PRE_TRADE' },
      { id: 'c2', text: 'اخبار اقتصادی مهم پیش رو را بررسی کردم؟ (عدم معامله در خبرهای شدید)', checked: false, category: 'PRE_TRADE' },
      { id: 'c3', text: 'ریسک کل معامله کمتر از ۲٪ موجودی حساب من است؟', checked: false, category: 'PRE_TRADE' },
      { id: 'c4', text: 'حد ضرر (SL) و حد سود (TP) از قبل مشخص و در سیستم ست شد؟', checked: false, category: 'PRE_TRADE' },
      { id: 'c5', text: 'آیا از نظر روحی و تمرکز در شرایط عالی هستم؟ (پرهیز از ترید خسته)', checked: false, category: 'PRE_TRADE' },
      { id: 'c6', text: 'آیا بعد از اتمام ترید، اشتباهاتم را مکتوب کردم؟', checked: false, category: 'POST_TRADE' },
      { id: 'c7', text: 'آیا ثبت تصویر چارت تحلیل و ضمیمه کردن آن انجام شد؟', checked: false, category: 'POST_TRADE' },
      { id: 'c8', text: 'هیچ معامله‌ای را بدون داشتن حد ضرر فعال رها نمی‌کنم.', checked: false, category: 'GENERAL' },
      { id: 'c9', text: 'ترید انتقامی بعد از باخت اکیدا ممنوع است. حداقل ۱ ساعت دوری از بازار.', checked: false, category: 'GENERAL' },
    ];
  } else {
    return [
      { id: 'c1', text: 'Is the higher timeframe market trend aligned?', checked: false, category: 'PRE_TRADE' },
      { id: 'c2', text: 'Checked high-impact economic news calendar?', checked: false, category: 'PRE_TRADE' },
      { id: 'c3', text: 'Is total risk per trade below 2% of my balance?', checked: false, category: 'PRE_TRADE' },
      { id: 'c4', text: 'Are Stop Loss and Take Profit levels specified?', checked: false, category: 'PRE_TRADE' },
      { id: 'c5', text: 'Am I in a balanced emotional state? (No fatigue trading)', checked: false, category: 'PRE_TRADE' },
      { id: 'c6', text: 'Did I log notes and mistakes immediately after exit?', checked: false, category: 'POST_TRADE' },
      { id: 'c7', text: 'Attached the final chart setup screenshot?', checked: false, category: 'POST_TRADE' },
      { id: 'c8', text: 'Never leave a trade unattended without a stop loss.', checked: false, category: 'GENERAL' },
      { id: 'c9', text: 'Revenge trading after a loss is strictly forbidden. Rest 1 hour.', checked: false, category: 'GENERAL' },
    ];
  }
};

// Default initial goals
const defaultGoals = (lang: Language): TradingGoal[] => {
  return [
    { 
      id: 'g1', 
      title: lang === 'fa' ? 'سود هدف ماه ژوئن' : 'June Monthly Milestone', 
      targetAmount: 1500, 
      currentProgress: 0, 
      startDate: '2026-06-01', 
      endDate: '2026-06-30', 
      isCompleted: false 
    },
    { 
      id: 'g2', 
      title: lang === 'fa' ? 'چالش منضبط ماندن هفتگی' : 'Weekly Discipline Target', 
      targetAmount: 300, 
      currentProgress: 0, 
      startDate: '2026-06-22', 
      endDate: '2026-06-28', 
      isCompleted: false 
    }
  ];
};

export default function App() {
  // 1. Core States
  const [lang, setLang] = useState<Language>('fa'); // Persian (Farsi) by default!
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'analytics' | 'notes' | 'backup'>('dashboard');
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyJournalEntry[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [goals, setGoals] = useState<TradingGoal[]>([]);

  // Multi-Account States
  const [accounts, setAccounts] = useState<TradingAccount[]>(() => {
    const saved = localStorage.getItem('tj_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    
    // Migration from old accounts setup:
    const oldName = localStorage.getItem('tj_account_name') || '';
    const oldBalanceStr = localStorage.getItem('tj_starting_balance');
    const oldBalance = oldBalanceStr ? parseFloat(oldBalanceStr) : 10000;
    
    if (oldName) {
      const migrated: TradingAccount = {
        id: 'default',
        name: oldName,
        startingBalance: oldBalance
      };
      const initial = [migrated];
      localStorage.setItem('tj_accounts', JSON.stringify(initial));
      localStorage.setItem('tj_current_account_id', 'default');
      return initial;
    }
    return [];
  });

  const [currentAccountId, setCurrentAccountId] = useState<string>(() => {
    return localStorage.getItem('tj_current_account_id') || 'default';
  });

  const currentAccount = React.useMemo(() => {
    return accounts.find(acc => acc.id === currentAccountId) || accounts[0];
  }, [accounts, currentAccountId]);

  const accountName = currentAccount ? currentAccount.name : '';
  const startingBalance = currentAccount ? currentAccount.startingBalance : 10000;

  // Helper to determine the dynamic storage keys for the active account
  const getAccountStorageKeys = (accId: string) => {
    if (accId === 'default') {
      return {
        trades: 'tj_trades',
        entries: 'tj_entries',
        checklist: 'tj_checklist',
        goals: 'tj_goals'
      };
    }
    return {
      trades: `tj_trades_${accId}`,
      entries: `tj_entries_${accId}`,
      checklist: `tj_checklist_${accId}`,
      goals: `tj_goals_${accId}`
    };
  };

  // Passcode Smart Lock states
  const [passcode, setPasscode] = useState<string>(() => localStorage.getItem('tj_passcode') || '');
  const [isLocked, setIsLocked] = useState<boolean>(() => !!localStorage.getItem('tj_passcode'));

  // Dialog Forms triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Calendar day clicked filter state
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);

  // Time ticker state
  const [currentTime, setCurrentTime] = useState('');

  const handleSetPasscode = (newPasscode: string) => {
    setPasscode(newPasscode);
    if (newPasscode) {
      localStorage.setItem('tj_passcode', newPasscode);
    } else {
      localStorage.removeItem('tj_passcode');
      setIsLocked(false);
    }
  };

  const handleSaveAccountSetup = (name: string, balance: number) => {
    const newAccount: TradingAccount = {
      id: 'default',
      name,
      startingBalance: balance
    };
    const updatedAccounts = [newAccount];
    setAccounts(updatedAccounts);
    setCurrentAccountId('default');
    localStorage.setItem('tj_accounts', JSON.stringify(updatedAccounts));
    localStorage.setItem('tj_current_account_id', 'default');
    // Also save legacy items for fallback
    localStorage.setItem('tj_account_name', name);
    localStorage.setItem('tj_starting_balance', balance.toString());
  };

  const handleUpdateCurrentAccount = (name: string, balance: number) => {
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === currentAccountId) {
        return { ...acc, name, startingBalance: balance };
      }
      return acc;
    });
    setAccounts(updatedAccounts);
    localStorage.setItem('tj_accounts', JSON.stringify(updatedAccounts));
    // Also update legacy items if updating the default/first account
    if (currentAccountId === 'default') {
      localStorage.setItem('tj_account_name', name);
      localStorage.setItem('tj_starting_balance', balance.toString());
    }
  };

  const handleCreateNewAccount = (name: string, balance: number) => {
    const newId = `acc_${Date.now()}`;
    const newAccount: TradingAccount = {
      id: newId,
      name,
      startingBalance: balance
    };
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    setCurrentAccountId(newId);
    localStorage.setItem('tj_accounts', JSON.stringify(updatedAccounts));
    localStorage.setItem('tj_current_account_id', newId);
  };

  const handleSwitchAccount = (id: string) => {
    setCurrentAccountId(id);
    localStorage.setItem('tj_current_account_id', id);
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      return;
    }
    const updatedAccounts = accounts.filter(acc => acc.id !== id);
    setAccounts(updatedAccounts);
    localStorage.setItem('tj_accounts', JSON.stringify(updatedAccounts));

    const keys = getAccountStorageKeys(id);
    localStorage.removeItem(keys.trades);
    localStorage.removeItem(keys.entries);
    localStorage.removeItem(keys.checklist);
    localStorage.removeItem(keys.goals);

    if (currentAccountId === id) {
      const remainingAccId = updatedAccounts[0].id;
      setCurrentAccountId(remainingAccId);
      localStorage.setItem('tj_current_account_id', remainingAccId);
    }
  };

  // 2. Load initially and on account changes
  useEffect(() => {
    // Language
    const savedLang = localStorage.getItem('tj_lang') as Language;
    if (savedLang) {
      setLang(savedLang);
    }

    if (accounts.length > 0 && currentAccount) {
      const keys = getAccountStorageKeys(currentAccount.id);

      // Trades
      const savedTrades = localStorage.getItem(keys.trades);
      if (savedTrades) {
        setTrades(JSON.parse(savedTrades));
      } else {
        setTrades([]);
      }

      // Daily entries
      const savedEntries = localStorage.getItem(keys.entries);
      if (savedEntries) {
        setDailyEntries(JSON.parse(savedEntries));
      } else {
        setDailyEntries([]);
      }

      // Checklist
      const savedChecklist = localStorage.getItem(keys.checklist);
      if (savedChecklist) {
        setChecklist(JSON.parse(savedChecklist));
      } else {
        setChecklist(defaultChecklist(savedLang || lang));
      }

      // Goals
      const savedGoals = localStorage.getItem(keys.goals);
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      } else {
        setGoals(defaultGoals(savedLang || lang));
      }
    } else {
      setTrades([]);
      setDailyEntries([]);
      setChecklist(defaultChecklist(savedLang || lang));
      setGoals(defaultGoals(savedLang || lang));
    }
  }, [currentAccountId, lang, accounts.length]);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString(lang === 'fa' ? 'fa-IR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid shortcuts if typing in text inputs or textareas
      const activeEl = document.activeElement;
      if (
        activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          activeEl.tagName === 'SELECT'
        )
      ) {
        return;
      }

      if (e.altKey || e.metaKey) {
        let key = e.key.toLowerCase();
        switch (key) {
          case 'd':
            e.preventDefault();
            setActiveTab('dashboard');
            break;
          case 'l':
            e.preventDefault();
            setActiveTab('ledger');
            break;
          case 'a':
            e.preventDefault();
            setActiveTab('analytics');
            break;
          case 'j':
            e.preventDefault();
            setActiveTab('notes');
            break;
          case 's':
            e.preventDefault();
            setActiveTab('backup');
            break;
          case 'n':
            e.preventDefault();
            setEditingTrade(null);
            setIsFormOpen(true);
            break;
          case 't':
            e.preventDefault();
            handleLanguageToggle();
            break;
          case 'k':
            e.preventDefault();
            if (passcode) {
              setIsLocked(true);
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [passcode, lang]);

  // Sync to local storage on state edits
  const saveTradesToStorage = (updatedTrades: Trade[]) => {
    setTrades(updatedTrades);
    const keys = getAccountStorageKeys(currentAccountId);
    localStorage.setItem(keys.trades, JSON.stringify(updatedTrades));

    // Also update dynamic goals based on overall P&L of June
    const totalJunePnl = updatedTrades
      .filter(tr => tr.status !== TradeStatus.OPEN && tr.dateEntry.startsWith('2026-06'))
      .reduce((sum, tr) => sum + tr.pnl, 0);
    
    const updatedGoals = goals.map(goal => {
      if (goal.id === 'g1') {
        const roundedProgress = Math.round(totalJunePnl * 10) / 10;
        return { 
          ...goal, 
          currentProgress: roundedProgress >= 0 ? roundedProgress : 0,
          isCompleted: roundedProgress >= goal.targetAmount
        };
      }
      return goal;
    });
    setGoals(updatedGoals);
    localStorage.setItem(keys.goals, JSON.stringify(updatedGoals));
  };

  const saveEntriesToStorage = (updatedEntries: DailyJournalEntry[]) => {
    setDailyEntries(updatedEntries);
    const keys = getAccountStorageKeys(currentAccountId);
    localStorage.setItem(keys.entries, JSON.stringify(updatedEntries));
  };

  const saveChecklistToStorage = (updatedChecklist: ChecklistItem[]) => {
    setChecklist(updatedChecklist);
    const keys = getAccountStorageKeys(currentAccountId);
    localStorage.setItem(keys.checklist, JSON.stringify(updatedChecklist));
  };

  const saveGoalsToStorage = (updatedGoals: TradingGoal[]) => {
    setGoals(updatedGoals);
    const keys = getAccountStorageKeys(currentAccountId);
    localStorage.setItem(keys.goals, JSON.stringify(updatedGoals));
  };

  const handleAddGoal = (goal: TradingGoal) => {
    const updated = [...goals, goal];
    saveGoalsToStorage(updated);
  };

  const handleEditGoal = (updatedGoal: TradingGoal) => {
    const updated = goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    saveGoalsToStorage(updated);
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    saveGoalsToStorage(updated);
  };

  // 3. Operational Handlers
  const handleSaveTrade = (trade: Trade) => {
    let updated;
    const isNew = !trades.some(t => t.id === trade.id);

    if (isNew) {
      updated = [trade, ...trades];
    } else {
      updated = trades.map(t => t.id === trade.id ? trade : t);
    }

    saveTradesToStorage(updated);
    setIsFormOpen(false);
    setEditingTrade(null);
  };

  const handleDeleteTrade = (id: string) => {
    const updated = trades.filter(t => t.id !== id);
    saveTradesToStorage(updated);
  };

  const handleEditTradeTrigger = (trade: Trade) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  const handleSaveDailyEntry = (entry: DailyJournalEntry) => {
    const exists = dailyEntries.some(e => e.date === entry.date);
    let updated;
    if (exists) {
      updated = dailyEntries.map(e => e.date === entry.date ? entry : e);
    } else {
      updated = [entry, ...dailyEntries];
    }
    saveEntriesToStorage(updated);
  };

  const handleImportBackup = (backup: {
    trades: Trade[];
    dailyEntries: DailyJournalEntry[];
    checklist: ChecklistItem[];
    goals: TradingGoal[];
  }) => {
    setTrades(backup.trades);
    setDailyEntries(backup.dailyEntries);
    setChecklist(backup.checklist);
    setGoals(backup.goals);

    const keys = getAccountStorageKeys(currentAccountId);
    localStorage.setItem(keys.trades, JSON.stringify(backup.trades));
    localStorage.setItem(keys.entries, JSON.stringify(backup.dailyEntries));
    localStorage.setItem(keys.checklist, JSON.stringify(backup.checklist));
    localStorage.setItem(keys.goals, JSON.stringify(backup.goals));
  };

  // Switch Language
  const handleLanguageToggle = () => {
    const nextLang = lang === 'fa' ? 'en' : 'fa';
    setLang(nextLang);
    localStorage.setItem('tj_lang', nextLang);
    // Reload default checklists to reflect language translation if unchanged
    setChecklist(defaultChecklist(nextLang));
    setGoals(defaultGoals(nextLang));
  };

  // On calendar day clicked
  const handleSelectDayFilter = (dateStr: string) => {
    setSelectedDayFilter(dateStr);
    setActiveTab('ledger'); // Automatically switch to Trades List ledger tab
  };

  // Clear Calendar Filter
  const handleClearDayFilter = () => {
    setSelectedDayFilter(null);
  };

  // Seeding full set of gorgeous mock trades and daily notes for demonstration
  const handleSeedDemoData = () => {
    const seedTrades: Trade[] = [
      {
        id: 't1',
        symbol: 'BTCUSDT',
        assetClass: AssetClass.CRYPTO,
        direction: TradeDirection.LONG,
        status: TradeStatus.WON,
        entryPrice: 58240,
        exitPrice: 59600,
        quantity: 0.15,
        leverage: 10,
        stopLoss: 57400,
        takeProfit: 60000,
        pnl: 204.0,
        fee: 3.5,
        session: TradingSession.LONDON,
        setup: 'SMC Orderblock',
        emotions: [EmotionTag.DISCIPLINED, EmotionTag.PATIENT],
        dateEntry: '2026-06-28T10:15',
        dateExit: '2026-06-28T16:30',
        notes: 'معامله عالی در راستای روند صعودی ۴ ساعته. بلاک سفارشات ۱۵ دقیقه‌ای به زیبایی ری‌اکشن نشان داد و ورود با تاییدیه انجام شد.',
        chartImage: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=600&auto=format&fit=crop&q=60'
      },
      {
        id: 't2',
        symbol: 'XAUUSD',
        assetClass: AssetClass.COMMODITIES,
        direction: TradeDirection.SHORT,
        status: TradeStatus.LOST,
        entryPrice: 2322.5,
        exitPrice: 2331.0,
        quantity: 1.5,
        leverage: 1,
        stopLoss: 2330.0,
        takeProfit: 2305.0,
        pnl: -12.75,
        fee: 1.5,
        session: TradingSession.NEW_YORK,
        setup: 'ICT Liquidity Sweep',
        emotions: [EmotionTag.FOMO, EmotionTag.HESITANT],
        dateEntry: '2026-06-27T15:45',
        dateExit: '2026-06-27T17:10',
        notes: 'مقداری عجله کردم و اسویپ نقدینگی سقف را کامل تایید نگرفتم. ترس از جا ماندن (FOMO) باعث شد استاپم فعال بشود. باید صبورتر می‌بودم.',
        chartImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=60'
      },
      {
        id: 't3',
        symbol: 'EURUSD',
        assetClass: AssetClass.FOREX,
        direction: TradeDirection.LONG,
        status: TradeStatus.WON,
        entryPrice: 1.0724,
        exitPrice: 1.0792,
        quantity: 2.0, // 2 lots
        leverage: 1,
        stopLoss: 1.0690,
        takeProfit: 1.0810,
        pnl: 136.0,
        fee: 4.0,
        session: TradingSession.LONDON,
        setup: 'EMA Cross 50/200',
        emotions: [EmotionTag.PATIENT, EmotionTag.CONFIDENT],
        dateEntry: '2026-06-25T09:00',
        dateExit: '2026-06-25T14:20',
        notes: 'تقاطع میانگین متحرک ۵۰ و ۲۰۰ در چارت ۱ ساعته. سشن لندن به معامله شتاب داد و تارگت اول فعال شد.',
        chartImage: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=60'
      },
      {
        id: 't4',
        symbol: 'BTCUSDT',
        assetClass: AssetClass.CRYPTO,
        direction: TradeDirection.SHORT,
        status: TradeStatus.WON,
        entryPrice: 60100,
        exitPrice: 58900,
        quantity: 0.2,
        leverage: 5,
        stopLoss: 60800,
        takeProfit: 57500,
        pnl: 240.0,
        fee: 5.0,
        session: TradingSession.TOKYO,
        setup: 'Resistance Rebound',
        emotions: [EmotionTag.DISCIPLINED],
        dateEntry: '2026-06-22T04:30',
        dateExit: '2026-06-22T11:00',
        notes: 'برخورد مجدد به خط مقاومت کانال نزولی روزانه بیت‌کوین و واگرایی منفی در اندیکاتور RSI.',
        chartImage: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&auto=format&fit=crop&q=60'
      },
      {
        id: 't5',
        symbol: 'AAPL',
        assetClass: AssetClass.STOCKS,
        direction: TradeDirection.LONG,
        status: TradeStatus.WON,
        entryPrice: 182.5,
        exitPrice: 188.0,
        quantity: 20,
        leverage: 1,
        stopLoss: 180.0,
        takeProfit: 190.0,
        pnl: 110.0,
        fee: 2.0,
        session: TradingSession.NEW_YORK,
        setup: 'Earnings Breakout',
        emotions: [EmotionTag.CONFIDENT],
        dateEntry: '2026-06-15T16:30',
        dateExit: '2026-06-17T21:00',
        notes: 'پولبک پس از گزارش درآمد مثبت شرکت اپل. معامله اسپات نگهداری شد تا سود کامل تارگت فعال شود.'
      },
      {
        id: 't6',
        symbol: 'SOLUSDT',
        assetClass: AssetClass.CRYPTO,
        direction: TradeDirection.LONG,
        status: TradeStatus.LOST,
        entryPrice: 145.2,
        exitPrice: 139.5,
        quantity: 10,
        leverage: 3,
        stopLoss: 140.0,
        takeProfit: 158.0,
        pnl: -171.0,
        fee: 1.8,
        session: TradingSession.NEW_YORK,
        setup: 'SMC Orderblock',
        emotions: [EmotionTag.REVENGE, EmotionTag.GREEDY],
        dateEntry: '2026-06-10T18:00',
        dateExit: '2026-06-10T19:30',
        notes: 'اشتباه وحشتناک ترید انتقامی! بعد از باخت طلا به سرعت حجم بالا روی سولانا باز کردم تا ضرر را جبران کنم. حدمحافظه را رد کرد و استاپ فعال شد.'
      },
      {
        id: 't7',
        symbol: 'GBPUSD',
        assetClass: AssetClass.FOREX,
        direction: TradeDirection.SHORT,
        status: TradeStatus.BREAKEVEN,
        entryPrice: 1.2650,
        exitPrice: 1.2650,
        quantity: 1.0,
        leverage: 1,
        stopLoss: 1.2710,
        takeProfit: 1.2510,
        pnl: 0,
        fee: 1.0,
        session: TradingSession.LONDON,
        setup: 'Double Top',
        emotions: [EmotionTag.PATIENT],
        dateEntry: '2026-06-05T10:00',
        dateExit: '2026-06-05T15:00',
        notes: 'معامله خوب پیش رفت ولی پس از رسیدن به ۵۰ پیپ سود، ریسک فری (سربه‌سر) کردم و با نوسان شدید خبر مجدد خارج شدم.'
      },
      {
        id: 't8',
        symbol: 'ETHUSDT',
        assetClass: AssetClass.CRYPTO,
        direction: TradeDirection.LONG,
        status: TradeStatus.WON,
        entryPrice: 3420,
        exitPrice: 3485,
        quantity: 2.0,
        leverage: 1,
        stopLoss: 3380,
        takeProfit: 3550,
        pnl: 130.0,
        fee: 3.2,
        session: TradingSession.LONDON,
        setup: 'ICT Breaker Block',
        emotions: [EmotionTag.DISCIPLINED],
        dateEntry: '2026-06-01T09:30',
        dateExit: '2026-06-01T15:20',
        notes: 'بریکر بلاک با مومنتوم صعودی تایید شد. در بازگشت اصلاحی وارد شدم و تارگت اول فعال شد.'
      }
    ];

    const seedDailyEntries: DailyJournalEntry[] = [
      {
        id: 'd1',
        date: '2026-06-28',
        mood: 'AMAZING',
        marketSummary: 'بازار بیت کوین صعودی بود و رشد خوبی در سشن لندن نشان داد. نوسانات منظم و طبق تکنیکال پیش رفت.',
        lessonsLearned: 'ورود با تاییدیه در بلاک‌های سفارشات عالی جواب می‌دهد. همواره صبر برای تاییدیه ارزشش را دارد.',
        adheredToRules: true
      },
      {
        id: 'd2',
        date: '2026-06-27',
        mood: 'NEUTRAL',
        marketSummary: 'طلا نوسانات کاذبی داشت و اخبار بعد از ظهر روند را بهم ریخت.',
        lessonsLearned: 'زمان اخبار مهم اصلاً معامله نکنم یا با حجم فوق‌العاده اندک وارد شوم تا فومو کنترل شود.',
        adheredToRules: false
      },
      {
        id: 'd3',
        date: '2026-06-10',
        mood: 'STRESSED',
        marketSummary: 'بدترین روز معاملاتی به خاطر ترید انتقامی. کل سرمایه به شدت در معرض آسیب قرار گرفت.',
        lessonsLearned: 'ترید انتقامی یعنی نابودی تدریجی سرمایه. اگر باختی، حق نداری سیستم را بلافاصله باز کنی.',
        adheredToRules: false
      }
    ];

    setTrades(seedTrades);
    setDailyEntries(seedDailyEntries);
    const keys = getAccountStorageKeys(currentAccountId);
    localStorage.setItem(keys.trades, JSON.stringify(seedTrades));
    localStorage.setItem(keys.entries, JSON.stringify(seedDailyEntries));

    // Calculate goals progress update
    const totalPnl = seedTrades
      .filter(tr => tr.status !== TradeStatus.OPEN)
      .reduce((sum, tr) => sum + tr.pnl, 0);

    const updatedGoals = defaultGoals(lang).map(g => {
      if (g.id === 'g1') {
        return { 
          ...g, 
          currentProgress: Math.round(totalPnl * 10) / 10,
          isCompleted: totalPnl >= g.targetAmount
        };
      }
      return g;
    });
    setGoals(updatedGoals);
    localStorage.setItem(keys.goals, JSON.stringify(updatedGoals));
  };

  const isRtl = lang === 'fa';
  const t = translations[lang];

  if (isLocked && passcode) {
    return (
      <LockScreen 
        correctPasscode={passcode} 
        lang={lang} 
        onUnlock={() => setIsLocked(false)} 
      />
    );
  }

  if (!accountName) {
    return (
      <AccountSetupModal 
        lang={lang} 
        onSave={handleSaveAccountSetup} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col antialiased">
      
      {/* HEADER BAR */}
      <header className="bg-slate-900/40 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className={`flex items-center gap-3.5 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
          {/* Windows-style app visual badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-full text-[10px] text-slate-400 font-mono">
            <Laptop size={12} className="text-teal-400" />
            <span>{t.desktopVersion}</span>
          </span>

          {/* Time clock ticker */}
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-800/40">
            <Clock size={13} className="text-cyan-400" />
            <span className="font-semibold">{currentTime}</span>
          </div>

          {/* Language Switcher */}
          <button 
            onClick={handleLanguageToggle}
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
            id="lang_toggle"
            title="تغییر زبان / Switch Language"
          >
            <Languages size={14} className="text-amber-400" />
            <span>{lang === 'fa' ? 'English (EN)' : 'فارسی (FA)'}</span>
          </button>
        </div>

        {/* Branding Left/Right according to RTL (TRADEX. from Design HTML) */}
        <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="text-2xl font-black tracking-tighter italic text-white font-sans select-none">
            TRADEX.
          </div>
          <div className={`border-slate-800 h-6 hidden sm:block ${isRtl ? 'border-l mr-2' : 'border-r ml-2'}`}></div>
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h1 className="text-xs font-black uppercase tracking-widest text-slate-400">{t.appName}</h1>
            <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase font-bold">TERMINAL v1.0.2</p>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDE BAR NAVIGATION */}
        <nav 
          className={`w-64 bg-slate-900/30 backdrop-blur-sm border-slate-800 p-4 space-y-2 flex flex-col justify-between hidden md:flex ${
            isRtl ? 'border-l' : 'border-r'
          }`}
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          {/* Navigation Items */}
          <div className="space-y-1.5">
            <div className={`px-3.5 py-1.5 text-[9px] uppercase tracking-widest text-slate-500 font-black mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
              {lang === 'fa' ? 'ترمینال اصلی' : 'TERMINAL'}
            </div>

            {/* Dashboard Tab */}
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-white text-slate-950 font-black' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <LayoutDashboard size={16} className={activeTab === 'dashboard' ? 'text-slate-950' : 'text-slate-400'} />
              <span>{t.dashboard}</span>
            </button>

            {/* Trades Ledger Tab */}
            <button 
              onClick={() => setActiveTab('ledger')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                activeTab === 'ledger' 
                  ? 'bg-white text-slate-950 font-black' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <FileSpreadsheet size={16} className={activeTab === 'ledger' ? 'text-slate-950' : 'text-slate-400'} />
              <span>{t.trades}</span>
            </button>

            {/* Analytics & Stats Tab */}
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                activeTab === 'analytics' 
                  ? 'bg-white text-slate-950 font-black' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <BarChart3 size={16} className={activeTab === 'analytics' ? 'text-slate-950' : 'text-slate-400'} />
              <span>{t.analytics}</span>
            </button>

            <div className={`px-3.5 py-3 text-[9px] uppercase tracking-widest text-slate-500 font-black mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
              {lang === 'fa' ? 'ابزارها' : 'UTILITIES'}
            </div>

            {/* Daily Journal Tab */}
            <button 
              onClick={() => setActiveTab('notes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                activeTab === 'notes' 
                  ? 'bg-white text-slate-950 font-black' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <BookOpen size={16} className={activeTab === 'notes' ? 'text-slate-950' : 'text-slate-400'} />
              <span>{t.dailyNotes}</span>
            </button>

            {/* Backups & settings */}
            <button 
              onClick={() => setActiveTab('backup')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                activeTab === 'backup' 
                  ? 'bg-white text-slate-950 font-black' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Database size={16} className={activeTab === 'backup' ? 'text-slate-950' : 'text-slate-400'} />
              <span>{t.settings}</span>
            </button>
          </div>

          {/* Quick Stats Summary or Action buttons inside Sidebar Footer */}
          <div className="space-y-4 pt-4 border-t border-slate-800/50">
            {/* Dynamic Portfolio Value display card from Design HTML */}
            <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800/80">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">
                {lang === 'fa' ? 'ارزش کل حساب' : 'PORTFOLIO VALUE'}
              </p>
              <p className="text-xl font-black font-mono tracking-tight text-white">
                ${(startingBalance + trades.reduce((sum, tr) => sum + tr.pnl, 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Add new trade button */}
            <button 
              onClick={() => { setEditingTrade(null); setIsFormOpen(true); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-blue-900/20 uppercase tracking-wider"
              id="sidebar_add_trade_btn"
            >
              <PlusCircle size={15} />
              <span>{t.addNewTrade}</span>
            </button>
          </div>
        </nav>

        {/* SCREEN PANEL CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {/* Mobile Tab bar selection */}
          <div className="flex md:hidden gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 font-bold text-[10px] overflow-x-auto select-none mb-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex-shrink-0 px-3.5 py-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-white text-slate-950 font-black' : 'text-slate-400'}`}
            >
              {t.dashboard}
            </button>
            <button 
              onClick={() => setActiveTab('ledger')}
              className={`flex-shrink-0 px-3.5 py-2 rounded-lg ${activeTab === 'ledger' ? 'bg-white text-slate-950 font-black' : 'text-slate-400'}`}
            >
              {t.trades}
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex-shrink-0 px-3.5 py-2 rounded-lg ${activeTab === 'analytics' ? 'bg-white text-slate-950 font-black' : 'text-slate-400'}`}
            >
              {t.analytics}
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`flex-shrink-0 px-3.5 py-2 rounded-lg ${activeTab === 'notes' ? 'bg-white text-slate-950 font-black' : 'text-slate-400'}`}
            >
              {t.dailyNotes}
            </button>
            <button 
              onClick={() => setActiveTab('backup')}
              className={`flex-shrink-0 px-3.5 py-2 rounded-lg ${activeTab === 'backup' ? 'bg-white text-slate-950 font-black' : 'text-slate-400'}`}
            >
              {t.settings}
            </button>
          </div>

          {/* Render Active Tab Screen Component */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="outline-none"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  trades={trades} 
                  goals={goals} 
                  lang={lang} 
                  accountName={accountName}
                  startingBalance={startingBalance}
                  onSelectDay={handleSelectDayFilter} 
                  onAddGoal={handleAddGoal}
                  onEditGoal={handleEditGoal}
                  onDeleteGoal={handleDeleteGoal}
                />
              )}

              {activeTab === 'ledger' && (
                <TradesList 
                  trades={trades} 
                  lang={lang} 
                  onEditTrade={handleEditTradeTrigger} 
                  onDeleteTrade={handleDeleteTrade}
                  selectedDayFilter={selectedDayFilter}
                  onClearDayFilter={handleClearDayFilter}
                />
              )}

              {activeTab === 'analytics' && (
                <Analytics 
                  trades={trades} 
                  lang={lang} 
                  startingBalance={startingBalance}
                />
              )}

              {activeTab === 'notes' && (
                <DailyNotes 
                  entries={dailyEntries} 
                  lang={lang} 
                  onSaveEntry={handleSaveDailyEntry} 
                />
              )}

              {activeTab === 'backup' && (
                <ExportImport 
                  trades={trades} 
                  dailyEntries={dailyEntries} 
                  checklist={checklist} 
                  goals={goals} 
                  lang={lang} 
                  passcode={passcode}
                  accountName={accountName}
                  startingBalance={startingBalance}
                  onSetPasscode={handleSetPasscode}
                  onImportBackup={handleImportBackup} 
                  onLoadDemoData={handleSeedDemoData} 
                  onUpdateAccount={handleUpdateCurrentAccount}
                  accounts={accounts}
                  currentAccountId={currentAccountId}
                  onCreateAccount={handleCreateNewAccount}
                  onSwitchAccount={handleSwitchAccount}
                  onDeleteAccount={handleDeleteAccount}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* FLOAT ADD NEW TRADE BUTTON FOR MOBILE ONLY */}
      <button 
        onClick={() => { setEditingTrade(null); setIsFormOpen(true); }}
        className="md:hidden fixed bottom-6 right-6 h-12 w-12 bg-gradient-to-tr from-teal-500 to-indigo-600 text-slate-950 hover:from-teal-400 hover:to-indigo-500 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/20 z-40 transition"
        title={t.addNewTrade}
      >
        <PlusCircle size={24} className="stroke-[2.5]" />
      </button>

      {/* FORM DIALOG POPUP MODAL */}
      {isFormOpen && (
        <TradeForm 
          trade={editingTrade} 
          lang={lang} 
          onSave={handleSaveTrade} 
          onClose={() => { setIsFormOpen(false); setEditingTrade(null); }} 
        />
      )}

    </div>
  );
}
