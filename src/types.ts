/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TradeDirection {
  LONG = 'LONG',   // خرید / صعودی
  SHORT = 'SHORT'  // فروش / نزولی
}

export enum TradeStatus {
  WON = 'WON',       // سود ده
  LOST = 'LOST',     // زیان ده
  BREAKEVEN = 'BE',  // سر به سر
  OPEN = 'OPEN'      // معامله باز
}

export enum TradeGrade {
  F = 'F',
  C = 'C',
  B = 'B',
  A = 'A',
  A_PLUS = 'A+'
}

export enum TradingSession {
  SYDNEY = 'SYDNEY',
  TOKYO = 'TOKYO',
  LONDON = 'LONDON',
  NEW_YORK = 'NEW_YORK',
  ALL = 'ALL'
}

export enum EmotionTag {
  DISCIPLINED = 'DISCIPLINED', // منضبط
  PATIENT = 'PATIENT',         // صبور
  FEARFUL = 'FEARFUL',         // ترسو / ترس از دست دادن
  GREEDY = 'GREEDY',           // طمع‌کار
  FOMO = 'FOMO',               // فومو / ورود عجولانه
  REVENGE = 'REVENGE',         // انتقام‌جویانه
  CONFIDENT = 'CONFIDENT',     // با اعتماد به نفس عالی
  HESITANT = 'HESITANT',       // مردد / دیر ورود کردن
  OVER_TRADING = 'OVER_TRADING' // حجم معاملاتی بالا / تعداد زیاد
}

export enum AssetClass {
  CRYPTO = 'CRYPTO', // ارز دیجیتال
  FOREX = 'FOREX',   // فارکس
  STOCKS = 'STOCKS', // سهام
  COMMODITIES = 'COMMODITIES', // کالاها (طلا، نفت و...)
  INDEXES = 'INDEXES' // شاخص‌ها
}

export interface Trade {
  id: string;
  symbol: string;         // جفت ارز یا نماد (مثلا BTCUSDT, EURUSD, XAUUSD)
  assetClass: AssetClass; // نوع دارایی
  direction: TradeDirection; // جهت معامله
  status: TradeStatus;    // وضعیت معامله
  entryPrice: number;     // قیمت ورود
  exitPrice: number;      // قیمت خروج (اختیاری برای معاملات باز)
  quantity: number;       // حجم معامله / لات
  leverage: number;       // اهرم / ضریب (به عنوان مثال ۱ برای اسپات یا فارکس عادی)
  stopLoss?: number;      // حد ضرر
  takeProfit?: number;    // حد سود
  pnl: number;            // میزان سود یا زیان خالص (محاسبه دستی یا خودکار)
  fee: number;            // کارمزد معامله
  session: TradingSession; // سشن معاملاتی
  setup: string;          // استراتژی یا ستاپ معاملاتی (مثلا SMC, ICT, EMA, Support)
  emotions: EmotionTag[]; // احساسات همراه معامله
  dateEntry: string;      // تاریخ و زمان ورود (YYYY-MM-DDTHH:mm)
  dateExit?: string;      // تاریخ و زمان خروج (YYYY-MM-DDTHH:mm)
  notes?: string;         // یادداشت‌ها و جزئیات بیشتر
  chartImage?: string;    // آدرس تصویر یا داده‌ی Base64 تصویر تحلیل چارت
  grade?: TradeGrade;     // امتیاز معامله (F, C, B, A, A+)
  imageAnalysis?: string; // تصویر تحلیل
  imageEntry?: string;    // تصویر ورود
  imageExit?: string;     // تصویر خروج
}

export interface DailyJournalEntry {
  id: string;
  date: string;           // تاریخ روز (YYYY-MM-DD)
  mood: string;           // وضعیت روحی کلی روز
  marketSummary: string;  // خلاصه وضعیت بازار امروز
  lessonsLearned: string; // درس‌های آموخته شده امروز
  adheredToRules: boolean; // آیا امروز به قوانین پایبند بودم؟
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category: 'PRE_TRADE' | 'POST_TRADE' | 'GENERAL';
}

export interface TradingGoal {
  id: string;
  title: string;
  targetAmount: number;   // میزان سود هدف (مثلا ۵۰۰ دلار)
  currentProgress: number; // سود فعلی بدست آمده
  startDate: string;      // تاریخ شروع هدف
  endDate: string;        // تاریخ پایان هدف
  isCompleted: boolean;
}

export interface RiskCalculation {
  accountBalance: number;  // موجودی کل حساب
  riskPercentage: number;  // درصد ریسک معامله (مثلا ۱٪)
  entryPrice: number;      // قیمت ورود به معامله
  stopLoss: number;        // قیمت حد ضرر
  positionSize: number;    // حجم محاسبه شده برای معامله
  totalRiskedAmount: number; // کل مبلغ ریسک شده به دلار
}

export interface TradingAccount {
  id: string;
  name: string;
  startingBalance: number;
}

