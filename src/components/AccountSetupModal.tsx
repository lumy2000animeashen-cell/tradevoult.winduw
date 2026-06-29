/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Landmark, TrendingUp, Sparkles, ArrowLeft, ArrowRight, User, CircleDollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AccountSetupModalProps {
  lang: 'fa' | 'en';
  onSave: (name: string, balance: number) => void;
}

export default function AccountSetupModal({ lang, onSave }: AccountSetupModalProps) {
  const [name, setName] = useState('');
  const [balanceInput, setBalanceInput] = useState('10000');
  const [error, setError] = useState('');

  const isRtl = lang === 'fa';

  const handleStart = () => {
    if (!name.trim()) {
      setError(isRtl ? 'لطفاً نام حساب معاملاتی خود را وارد کنید!' : 'Please enter an account name!');
      return;
    }
    const parsedBalance = parseFloat(balanceInput);
    if (isNaN(parsedBalance) || parsedBalance <= 0) {
      setError(isRtl ? 'بالانس اولیه حساب باید عدد بزرگتر از صفر باشد!' : 'Starting balance must be greater than 0!');
      return;
    }
    setError('');
    onSave(name.trim(), parsedBalance);
  };

  const handleSelectPreset = (val: number) => {
    setBalanceInput(val.toString());
  };

  return (
    <div className="fixed inset-0 bg-[#06080c] z-50 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="max-w-xl w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
      >
        {/* Subtle decorative glowing background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="text-center space-y-4">
          {/* Logo Badge */}
          <div className="relative mx-auto w-16 h-16 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Landmark size={28} className="text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isRtl ? 'خوش آمدید به TradeVault' : 'Welcome to TradeVault'}
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
              {isRtl 
                ? 'برای ورود به ژورنال فوق‌حرفه‌ای و تحلیل آماری هوشمند، ابتدا حساب خود را معرفی و ارزش بالانس اولیه آن را مشخص کنید.'
                : 'To initialize your high-performance professional trading journal, please create your primary trading account below.'}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5 pt-6 relative z-10">
          
          {/* Account Name */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-cyan-400" />
              <span>{isRtl ? 'نام حساب معاملاتی:' : 'Trading Account Name:'}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isRtl ? 'مثال: حساب کریپتو فیوچرز، چالش پراپ ۵۰ هزاری' : 'e.g., Binance Futures Portfolio, Prop Challenge 1'}
                value={name}
                onChange={(e) => {
                  setError('');
                  setName(e.target.value);
                }}
                className={`w-full px-4 py-3 bg-slate-950 border ${error && !name ? 'border-rose-500/50' : 'border-slate-800 focus:border-cyan-500'} rounded-xl text-sm font-semibold text-slate-100 placeholder-slate-600 focus:outline-none transition-all shadow-inner`}
              />
            </div>
          </div>

          {/* Starting Balance */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CircleDollarSign size={13} className="text-emerald-400" />
              <span>{isRtl ? 'بالانس اولیه حساب (دلار):' : 'Starting Account Balance ($ USD):'}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600 font-bold font-mono">
                $
              </div>
              <input
                type="text"
                value={balanceInput}
                onChange={(e) => {
                  setError('');
                  // Keep only digits and decimal point
                  setBalanceInput(e.target.value.replace(/[^0-9.]/g, ''));
                }}
                className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm font-mono font-bold text-slate-100 placeholder-slate-600 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[5000, 10000, 25000, 50000, 100000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1 bg-slate-950 border rounded-lg text-xs font-mono font-bold transition-all hover:bg-slate-900 ${
                    parseFloat(balanceInput) === preset
                      ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5'
                      : 'border-slate-850 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  ${preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-black text-rose-400"
              >
                ⚠️ {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Start CTA Button */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span>{isRtl ? 'راه‌اندازی و ورود به ژورنال' : 'INITIALIZE TRADING VAULT'}</span>
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>

        {/* Security / Decrypted label */}
        <div className="text-center pt-5 border-t border-slate-800/60 mt-6 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
          🔒 {isRtl ? 'تمام اطلاعات حساب شما در مرورگر محلی ذخیره می‌شود' : 'Local Sandbox. Secure client-side hashing encryption.'}
        </div>
      </motion.div>
    </div>
  );
}
