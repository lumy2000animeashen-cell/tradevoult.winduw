/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LockScreenProps {
  correctPasscode: string;
  lang: 'fa' | 'en';
  onUnlock: () => void;
}

export default function LockScreen({ correctPasscode, lang, onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  const isRtl = lang === 'fa';

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setError(false);
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setError(false);
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(false);
    setPin('');
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === correctPasscode) {
        onUnlock();
      } else {
        // Shake error
        setError(true);
        setAttempts(prev => prev + 1);
        // Clear pin after a short delay
        const timer = setTimeout(() => {
          setPin('');
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [pin, correctPasscode, onUnlock]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="fixed inset-0 bg-[#06080c] z-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
        
        {/* Glowing lock header */}
        <div className="relative mx-auto w-20 h-20 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl animate-pulse"></div>
          <motion.div
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {error ? (
              <ShieldAlert size={32} className="text-rose-500 relative z-10" />
            ) : (
              <Lock size={32} className="text-blue-400 relative z-10" />
            )}
          </motion.div>
        </div>

        {/* Labels */}
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            {isRtl ? 'صندوق امنیتی TRADEVAULT' : 'TRADEVAULT SECURE VAULT'}
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            {isRtl 
              ? 'این برنامه قفل است. لطفاً برای دسترسی به آمار و ژورنال، رمز ۴ رقمی خود را وارد کنید.'
              : 'This terminal is encrypted. Please enter your 4-digit PIN to unlock.'}
          </p>
        </div>

        {/* Circular Dot Indicators */}
        <div className="flex justify-center gap-4 py-4">
          {[0, 1, 2, 3].map((index) => {
            const hasValue = pin.length > index;
            return (
              <motion.div
                key={index}
                className={`w-4 h-4 rounded-full border ${
                  error 
                    ? 'bg-rose-500/80 border-rose-400' 
                    : hasValue 
                    ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 border-transparent shadow-[0_0_8px_rgba(6,182,212,0.4)]' 
                    : 'bg-slate-950/80 border-slate-800'
                }`}
                animate={error ? { scale: [1, 1.2, 1] } : hasValue ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.15 }}
              />
            );
          })}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-black text-rose-400 font-mono tracking-wider"
            >
              {isRtl ? 'کد عبور نامعتبر است! مجددا تلاش کنید.' : 'ACCESS DENIED! INVALID PIN.'}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Keypad Grid (1-9, Clear, 0, Backspace) */}
        <div className="grid grid-cols-3 gap-3.5 max-w-[280px] mx-auto pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-slate-950/60 border border-slate-850 hover:border-slate-700 hover:bg-slate-950 hover:text-white transition-all text-xl font-bold text-slate-300 flex items-center justify-center cursor-pointer font-mono shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-full hover:bg-slate-950/80 transition-all text-[11px] font-black text-slate-500 hover:text-slate-300 flex items-center justify-center cursor-pointer uppercase tracking-wider"
          >
            {isRtl ? 'پاک‌کردن' : 'CLEAR'}
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-slate-950/60 border border-slate-850 hover:border-slate-700 hover:bg-slate-950 hover:text-white transition-all text-xl font-bold text-slate-300 flex items-center justify-center cursor-pointer font-mono shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full hover:bg-slate-950/80 transition-all text-slate-500 hover:text-slate-300 flex items-center justify-center cursor-pointer"
            aria-label="Backspace"
          >
            {isRtl ? 'حذف' : 'BACK'}
          </button>
        </div>

        {/* Terminal status line */}
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest pt-2">
          {isRtl ? 'درگاه رمزگذاری شده AES-256' : 'AES-256 local encryption layer'}
        </div>

      </div>
    </div>
  );
}
