/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssetClass, EmotionTag, TradeDirection, TradeStatus, TradingSession } from './types';

export type Language = 'fa' | 'en';

export const translations = {
  fa: {
    appName: 'ژورنال ترید حرفه‌ای',
    desktopVersion: 'نسخه دسکتاپ (ویندوز)',
    dashboard: 'داشبورد',
    trades: 'لیست معاملات',
    analytics: 'تحلیل و آمار',
    riskCalc: 'محاسبه ریسک',
    checklists: 'چک‌لیست قوانین',
    dailyNotes: 'دفترچه یادداشت',
    settings: 'تنظیمات و پشتیبان‌گیری',
    
    // Stats
    totalProfit: 'کل سود / زیان',
    winRate: 'نرخ برد (Win Rate)',
    totalTrades: 'کل معاملات',
    profitFactor: 'فاکتور سود (Profit Factor)',
    avgWin: 'میانگین معامله برنده',
    avgLoss: 'میانگین معامله بازنده',
    netProfit: 'سود خالص',
    lossAmount: 'کل ضررها',
    winAmount: 'کل سودها',
    openTrades: 'معاملات باز',
    closedTrades: 'معاملات بسته‌شده',
    bestAsset: 'بهترین نماد معاملاتی',
    bestDay: 'بهترین روز معاملاتی',
    streak: 'تسلسل فعلی',
    won: 'برد',
    lost: 'باخت',
    breakeven: 'سر به سر',
    open: 'باز',
    
    // Trade Form
    addNewTrade: 'ثبت معامله جدید',
    editTrade: 'ویرایش معامله',
    symbol: 'نماد / جفت ارز',
    assetClass: 'نوع بازار',
    direction: 'جهت معامله',
    status: 'وضعیت',
    entryPrice: 'قیمت ورود',
    exitPrice: 'قیمت خروج',
    quantity: 'حجم (لات / تعداد)',
    leverage: 'اهرم (ضریب)',
    stopLoss: 'حد ضرر (SL)',
    takeProfit: 'حد سود (TP)',
    pnl: 'سود / زیان (PNL)',
    fee: 'کارمزد / کمیسیون',
    session: 'سشن معاملاتی',
    setup: 'استراتژی / ستاپ',
    emotions: 'روانشناسی و احساسات',
    dateEntry: 'زمان ورود',
    dateExit: 'زمان خروج',
    notes: 'توضیحات و تحلیل',
    chartScreenshot: 'تصویر تحلیل چارت',
    dragScreenshot: 'فایل تصویر چارت را به اینجا بکشید یا برای انتخاب کلیک کنید',
    autoCalcPnl: 'محاسبه خودکار P&L فعال است (بر اساس قیمت‌ها و حجم)',
    save: 'ذخیره معامله',
    cancel: 'انصراف',
    delete: 'حذف معامله',
    confirmDelete: 'آیا از حذف این معامله مطمئن هستید؟ این عمل غیرقابل بازگشت است.',

    // Directions & Statuses Fa
    LONG: 'خرید (BUY / LONG)',
    SHORT: 'فروش (SELL / SHORT)',
    WON_status: 'سود ده',
    LOST_status: 'زیان ده',
    BREAKEVEN_status: 'سر به سر',
    OPEN_status: 'باز',
    
    // Asset Classes Fa
    CRYPTO: 'ارز دیجیتال (Crypto)',
    FOREX: 'فارکس (Forex)',
    STOCKS: 'سهام (Stocks)',
    COMMODITIES: 'کالاها / طلا (Commodities)',
    INDEXES: 'شاخص‌ها (Indexes)',
    
    // Sessions Fa
    SYDNEY: 'سیدنی (Sydney)',
    TOKYO: 'توکیو (Tokyo)',
    LONDON: 'لندن (London)',
    NEW_YORK: 'نیویورک (New York)',
    ALL: 'همه',

    // Emotions Fa
    DISCIPLINED: 'منضبط و طبق استراتژی',
    PATIENT: 'صبور و باحوصله',
    FEARFUL: 'ترس از ضرر / بستن زودرس',
    GREEDY: 'طمع‌کاری و افزایش بی‌مورد حجم',
    FOMO: 'فومو / ترس از جا ماندن از بازار',
    REVENGE: 'ترید انتقامی بعد از ضرر',
    CONFIDENT: 'با اعتماد به نفس منطقی',
    HESITANT: 'مردد و ورود با تاخیر',
    OVER_TRADING: 'تعداد ترید بالا یا حجم نامتعارف',

    // Calendar
    tradingCalendar: 'تقویم معاملاتی ماه جاری',
    noTradesDay: 'بدون معامله',
    tradesCount: 'معامله',

    // Risk Calculator Panel
    riskCalculator: 'ماشین حساب مدیریت ریسک و سرمایه',
    accountBalance: 'موجودی کل حساب ($)',
    riskPercent: 'درصد ریسک سرمایه در این معامله (%)',
    calculate: 'محاسبه حجم استاندارد',
    riskedAmount: 'مبلغ کل ریسک (دلار)',
    calculatedSize: 'حجم معامله پیشنهادی (Position Size)',
    slPips: 'فاصله حد ضرر تا قیمت ورود',
    slPercent: 'درصد حد ضرر نسبت به ورود',
    riskWarning: 'هشدار: حد ضرر تنظیم نشده است!',
    riskTip: 'همواره پیش از ورود به معامله، حد ضرر و میزان ریسک خود را محاسبه کنید.',

    // Checklists
    checklistTitle: 'چک‌لیست قوانین معاملاتی',
    addChecklistItem: 'افزودن قانون جدید به چک‌لیست...',
    preTradeCheck: 'چک‌لیست قبل از ترید (تاییدیه ورود)',
    postTradeCheck: 'چک‌لیست بعد از ترید (تحلیل خروج)',
    generalRules: 'قوانین عمومی ترید من',
    ruleCompleted: 'تایید شد',

    // Goals
    tradingGoals: 'اهداف معاملاتی من',
    addGoal: 'ایجاد هدف معاملاتی جدید',
    goalTitle: 'عنوان هدف (مثلا سود هفتگی)',
    goalTarget: 'مبلغ سود هدف ($)',
    startDate: 'تاریخ شروع',
    endDate: 'تاریخ پایان',
    progress: 'پیشرفت',
    activeGoals: 'اهداف فعال',
    completedGoals: 'اهداف محقق شده',

    // Daily notes
    dailyJournalTitle: 'دفترچه ثبت یادداشت‌های روزانه بازار',
    dailyMood: 'وضعیت روحی امروز شما چطور بود؟',
    moodAmazing: 'عالی و پرانرژی',
    moodNeutral: 'معمولی و آرام',
    moodStressed: 'مضطرب یا خسته',
    lessonsLearnedToday: 'درس‌های مهم امروز معاملاتی',
    marketNotesToday: 'تحلیل کلی و وضعیت بازارهای امروز',
    adheredToRulesToday: 'آیا امروز به قوانین و پلان خود کاملا پایبند بودید؟',
    saveDailyNotes: 'ثبت یادداشت امروز',
    notesSavedSuccess: 'یادداشت روزانه با موفقیت ذخیره شد.',

    // Export/Import
    backupData: 'پشتیبان‌گیری و انتقال داده‌ها',
    exportJson: 'خروجی اکسپورت (JSON)',
    exportCsv: 'دانلود فایل اکسل (CSV)',
    importData: 'وارد کردن اطلاعات پشتیبان (Import)',
    importWarning: 'توجه: با وارد کردن فایل پشتیبان، اطلاعات فعلی شما بازنویسی خواهد شد.',
    chooseFile: 'انتخاب فایل پشتیبان',
    exportCopySuccess: 'کد پشتیبان کپی شد!',
    importSuccess: 'اطلاعات با موفقیت بازیابی شد.',
    importError: 'خطا در خواندن فایل پشتیبان. لطفاً فرمت فایل را بررسی کنید.',
    seedMockData: 'تزریق داده‌های دمو تستی',
    seedMockDataDesc: 'اگر بار اول است وارد برنامه می‌شوید، می‌توانید چند معامله دمو تستی وارد کنید تا نمودارها و آمار را مشاهده کنید.',
    injectNow: 'تزریق داده‌های دمو',

    // Filters and Sorting
    all: 'همه بازارها',
    filterByStatus: 'فیلتر وضعیت',
    sortBy: 'مرتب‌سازی',
    dateNewest: 'تاریخ (جدیدترین)',
    dateOldest: 'تاریخ (قدیمی‌ترین)',
    pnlHighest: 'بیشترین سود',
    pnlLowest: 'بیشترین ضرر',
    searchSymbol: 'جستجوی نماد...',

    // Analytics headings
    equityCurve: 'نمودار رشد سرمایه (رشد موجودی)',
    pnlByWeekday: 'سود و زیان به تفکیک روزهای هفته',
    setupPerformance: 'بازدهی به تفکیک استراتژی / ستاپ',
    emotionPerformance: 'تاثیر احساسات روی سودآوری شما',
    sessionStats: 'تعداد معاملات در هر سشن',
    winRateByAsset: 'نرخ برد به تفکیک بازارها'
  },
  en: {
    appName: 'Pro Trading Journal',
    desktopVersion: 'Desktop Version (Windows)',
    dashboard: 'Dashboard',
    trades: 'Trades Ledger',
    analytics: 'Analytics & Stats',
    riskCalc: 'Risk Calculator',
    checklists: 'Trading Rules',
    dailyNotes: 'Daily Journal',
    settings: 'Backup & Recovery',
    
    // Stats
    totalProfit: 'Total P&L',
    winRate: 'Win Rate',
    totalTrades: 'Total Trades',
    profitFactor: 'Profit Factor',
    avgWin: 'Average Win',
    avgLoss: 'Average Loss',
    netProfit: 'Net Profit',
    lossAmount: 'Total Loss',
    winAmount: 'Total Win',
    openTrades: 'Open Trades',
    closedTrades: 'Closed Trades',
    bestAsset: 'Best Performing Asset',
    bestDay: 'Best Trading Day',
    streak: 'Current Streak',
    won: 'Won',
    lost: 'Lost',
    breakeven: 'B/E',
    open: 'Open',
    
    // Trade Form
    addNewTrade: 'Add New Trade',
    editTrade: 'Edit Trade',
    symbol: 'Symbol / Ticker',
    assetClass: 'Asset Class',
    direction: 'Direction',
    status: 'Status',
    entryPrice: 'Entry Price',
    exitPrice: 'Exit Price',
    quantity: 'Quantity / Size',
    leverage: 'Leverage',
    stopLoss: 'Stop Loss (SL)',
    takeProfit: 'Take Profit (TP)',
    pnl: 'Profit/Loss (PNL)',
    fee: 'Fee / Commission',
    session: 'Trading Session',
    setup: 'Strategy / Setup',
    emotions: 'Psychology & Emotions',
    dateEntry: 'Entry Time',
    dateExit: 'Exit Time',
    notes: 'Analysis & Notes',
    chartScreenshot: 'Chart Screenshot',
    dragScreenshot: 'Drag & drop a chart image here, or click to browse',
    autoCalcPnl: 'Auto-calculating P&L based on prices and leverage',
    save: 'Save Trade',
    cancel: 'Cancel',
    delete: 'Delete Trade',
    confirmDelete: 'Are you sure you want to delete this trade? This cannot be undone.',

    // Directions & Statuses En
    LONG: 'BUY / LONG',
    SHORT: 'SELL / SHORT',
    WON_status: 'Won',
    LOST_status: 'Lost',
    BREAKEVEN_status: 'Breakeven',
    OPEN_status: 'Open',
    
    // Asset Classes En
    CRYPTO: 'Crypto',
    FOREX: 'Forex',
    STOCKS: 'Stocks',
    COMMODITIES: 'Commodities',
    INDEXES: 'Indexes',
    
    // Sessions En
    SYDNEY: 'Sydney',
    TOKYO: 'Tokyo',
    LONDON: 'London',
    NEW_YORK: 'New York',
    ALL: 'All',

    // Emotions En
    DISCIPLINED: 'Disciplined Setup',
    PATIENT: 'Patiently Waiting',
    FEARFUL: 'Fear of Loss',
    GREEDY: 'Greedy Position Sizing',
    FOMO: 'FOMO Entry',
    REVENGE: 'Revenge Trading',
    CONFIDENT: 'Healthy Confidence',
    HESITANT: 'Hesitant / Late Entry',
    OVER_TRADING: 'Over-Trading / High Volume',

    // Calendar
    tradingCalendar: 'Trading Calendar (Current Month)',
    noTradesDay: 'No trades',
    tradesCount: 'trades',

    // Risk Calculator Panel
    riskCalculator: 'Risk & Position Sizing Calculator',
    accountBalance: 'Account Balance ($)',
    riskPercent: 'Risk Per Trade (%)',
    calculate: 'Calculate Standard Size',
    riskedAmount: 'Total Risked Amount',
    calculatedSize: 'Recommended Position Size',
    slPips: 'SL Distance in Pips/Points',
    slPercent: 'SL % of Entry Price',
    riskWarning: 'Warning: Stop Loss is not set!',
    riskTip: 'Always calculate your position size and maximum risk before executing any trade.',

    // Checklists
    checklistTitle: 'Trading Rules & Checklists',
    addChecklistItem: 'Add a new checklist item...',
    preTradeCheck: 'Pre-Trade Entry Checklist',
    postTradeCheck: 'Post-Trade Exit Checklist',
    generalRules: 'My General Golden Rules',
    ruleCompleted: 'Verified',

    // Goals
    tradingGoals: 'Trading Milestones & Goals',
    addGoal: 'Create New Trading Goal',
    goalTitle: 'Goal Title (e.g. Weekly Profit)',
    goalTarget: 'Target Profit ($)',
    startDate: 'Start Date',
    endDate: 'End Date',
    progress: 'Progress',
    activeGoals: 'Active Goals',
    completedGoals: 'Achieved Goals',

    // Daily notes
    dailyJournalTitle: 'Daily Market Journal & Notes',
    dailyMood: 'What was your mental state today?',
    moodAmazing: 'Excellent & Focused',
    moodNeutral: 'Calm & Balanced',
    moodStressed: 'Stressed / Fatigue',
    lessonsLearnedToday: 'Key Lessons Learned Today',
    marketNotesToday: 'Market Summary & Observations',
    adheredToRulesToday: 'Did you strictly adhere to your rules and plan today?',
    saveDailyNotes: 'Save Daily Entry',
    notesSavedSuccess: 'Daily notes saved successfully.',

    // Export/Import
    backupData: 'Backup & Database Sync',
    exportJson: 'Export Backup Code (JSON)',
    exportCsv: 'Download Excel File (CSV)',
    importData: 'Import Backup File',
    importWarning: 'Warning: Importing backup will completely overwrite your current local records.',
    chooseFile: 'Select backup file',
    exportCopySuccess: 'Backup data copied to clipboard!',
    importSuccess: 'Backup restored successfully!',
    importError: 'Invalid backup file format.',
    seedMockData: 'Load Demo Trading Data',
    seedMockDataDesc: 'If this is your first time, you can pre-load mock trading data to see how charts and dashboard statistics look.',
    injectNow: 'Inject Demo Data',

    // Filters and Sorting
    all: 'All Assets',
    filterByStatus: 'Filter Status',
    sortBy: 'Sort By',
    dateNewest: 'Date (Newest)',
    dateOldest: 'Date (Oldest)',
    pnlHighest: 'Highest Profit',
    pnlLowest: 'Highest Loss',
    searchSymbol: 'Search ticker...',

    // Analytics headings
    equityCurve: 'Capital Equity Curve',
    pnlByWeekday: 'Profit / Loss by Weekday',
    setupPerformance: 'Performance by Setup / Strategy',
    emotionPerformance: 'Emotional State Profit Correlation',
    sessionStats: 'Trades per Trading Session',
    winRateByAsset: 'Win Rate by Asset Class'
  }
};

// Helper to translate asset classes, directions, emotions, etc.
export function getTranslatedStatus(status: TradeStatus, lang: Language): string {
  if (lang === 'fa') {
    return translations.fa[`${status}_status` as keyof typeof translations.fa] || status;
  }
  return translations.en[`${status}_status` as keyof typeof translations.en] || status;
}

export function getTranslatedDirection(dir: TradeDirection, lang: Language): string {
  return translations[lang][dir];
}

export function getTranslatedAsset(asset: AssetClass, lang: Language): string {
  return translations[lang][asset];
}

export function getTranslatedSession(session: TradingSession, lang: Language): string {
  return translations[lang][session];
}

export function getTranslatedEmotion(emotion: EmotionTag, lang: Language): string {
  return translations[lang][emotion];
}
