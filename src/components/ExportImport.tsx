/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trade, DailyJournalEntry, ChecklistItem, TradingGoal, TradingAccount } from '../types';
import { translations, Language } from '../localization';
import { 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Database, 
  FileSpreadsheet, 
  RotateCcw, 
  Sparkles,
  Info,
  Lock,
  Unlock,
  Trash2,
  Mail,
  LifeBuoy
} from 'lucide-react';

interface ExportImportProps {
  trades: Trade[];
  dailyEntries: DailyJournalEntry[];
  checklist: ChecklistItem[];
  goals: TradingGoal[];
  lang: Language;
  passcode: string;
  accountName: string;
  startingBalance: number;
  onSetPasscode: (code: string) => void;
  onImportBackup: (data: {
    trades: Trade[];
    dailyEntries: DailyJournalEntry[];
    checklist: ChecklistItem[];
    goals: TradingGoal[];
  }) => void;
  onLoadDemoData: () => void;
  onUpdateAccount: (name: string, balance: number) => void;
  accounts: TradingAccount[];
  currentAccountId: string;
  onCreateAccount: (name: string, balance: number) => void;
  onSwitchAccount: (id: string) => void;
  onDeleteAccount: (id: string) => void;
}

export default function ExportImport({
  trades,
  dailyEntries,
  checklist,
  goals,
  lang,
  passcode,
  accountName,
  startingBalance,
  onSetPasscode,
  onImportBackup,
  onLoadDemoData,
  onUpdateAccount,
  accounts,
  currentAccountId,
  onCreateAccount,
  onSwitchAccount,
  onDeleteAccount
}: ExportImportProps) {
  const t = translations[lang];

  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Passcode Settings States
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [disableInput, setDisableInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState('');

  // Account Settings States
  const [editedName, setEditedName] = useState(accountName);
  const [editedBalance, setEditedBalance] = useState(startingBalance.toString());
  const [accountSuccess, setAccountSuccess] = useState('');

  // Create Account States
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('10000');

  // Sync edited fields when props change (like when switching account)
  React.useEffect(() => {
    setEditedName(accountName);
    setEditedBalance(startingBalance.toString());
    setAccountSuccess('');
  }, [accountName, startingBalance]);

  const handleSaveAccountSettings = () => {
    setAccountSuccess('');
    const parsedBalance = parseFloat(editedBalance);
    if (!editedName.trim()) {
      alert(lang === 'fa' ? 'نام حساب نمی‌تواند خالی باشد.' : 'Account name cannot be empty.');
      return;
    }
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      alert(lang === 'fa' ? 'بالانس معتبری وارد کنید.' : 'Please enter a valid starting balance.');
      return;
    }
    onUpdateAccount(editedName, parsedBalance);
    setAccountSuccess(lang === 'fa' ? 'اطلاعات حساب با موفقیت بروزرسانی شد.' : 'Account settings successfully updated.');
  };

  const handleDisablePasscode = () => {
    setPasscodeError('');
    setPasscodeSuccess('');
    if (disableInput !== passcode) {
      setPasscodeError(lang === 'fa' ? 'رمز عبور فعلی نادرست است!' : 'Incorrect current PIN!');
      return;
    }
    onSetPasscode('');
    setDisableInput('');
    setPasscodeSuccess(lang === 'fa' ? 'قفل برنامه با موفقیت غیرفعال شد.' : 'App lock disabled successfully.');
  };

  const handleEnablePasscode = () => {
    setPasscodeError('');
    setPasscodeSuccess('');
    if (!/^\d{4}$/.test(pinInput)) {
      setPasscodeError(lang === 'fa' ? 'رمز عبور باید ۴ رقم عددی باشد!' : 'PIN must be exactly 4 digits!');
      return;
    }
    if (pinInput !== pinConfirm) {
      setPasscodeError(lang === 'fa' ? 'رمزهای وارد شده همخوانی ندارند!' : 'PINs do not match!');
      return;
    }
    onSetPasscode(pinInput);
    setPinInput('');
    setPinConfirm('');
    setPasscodeSuccess(lang === 'fa' ? 'قفل برنامه با موفقیت فعال شد.' : 'App lock enabled successfully.');
  };

  // 1. Generate JSON Export backup
  const handleExportJson = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      trades,
      dailyEntries,
      checklist,
      goals
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(dataStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });

    // Also download as .json file
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trading_journal_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Generate CSV Export (for Excel / Google Sheets)
  const handleExportCsv = () => {
    const headers = [
      'ID', 'Symbol', 'Market Type', 'Direction', 'Status', 
      'Entry Price', 'Exit Price', 'Quantity', 'Leverage', 
      'Net PNL ($)', 'Fees ($)', 'Session', 'Setup / Strategy', 
      'Entry Date', 'Exit Date', 'Notes'
    ];

    const rows = trades.map(tr => [
      tr.id,
      tr.symbol,
      tr.assetClass,
      tr.direction,
      tr.status,
      tr.entryPrice,
      tr.exitPrice || '',
      tr.quantity,
      tr.leverage,
      tr.pnl,
      tr.fee,
      tr.session,
      tr.setup.replace(/,/g, ';'), // Escape commas
      tr.dateEntry,
      tr.dateExit || '',
      (tr.notes || '').replace(/,/g, ';').replace(/\n/g, ' ') // Clean notes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Handle unicode character download in Excel (UTF-8 BOM)
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trading_journal_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Import JSON backup handler
  const handleImportJson = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!importText.trim()) {
      setErrorMsg(lang === 'fa' ? 'لطفاً کد پشتیبان یا متن فایل JSON را وارد کنید.' : 'Please enter JSON backup text first.');
      return;
    }

    try {
      const parsed = JSON.parse(importText);
      
      // Validation of backup integrity
      if (!parsed.trades || !Array.isArray(parsed.trades)) {
        throw new Error('Invalid trades data format');
      }

      onImportBackup({
        trades: parsed.trades || [],
        dailyEntries: parsed.dailyEntries || [],
        checklist: parsed.checklist || [],
        goals: parsed.goals || []
      });

      setSuccessMsg(t.importSuccess);
      setImportText('');
    } catch (err) {
      setErrorMsg(t.importError);
    }
  };

  // File Upload listener for JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportText(text);
        setSuccessMsg(lang === 'fa' ? 'فایل با موفقیت بارگذاری شد. بر روی دکمه اعمال پشتیبان کلیک کنید.' : 'File uploaded. Click on Apply Import to restore records.');
      } catch (err) {
        setErrorMsg(t.importError);
      }
    };
    reader.readAsText(file);
  };

  const isRtl = lang === 'fa';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="backup_settings_panel" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* LEFT COLUMN: Data Exports */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Database className="text-teal-400 h-5 w-5" />
          <h2 className="text-base font-bold text-slate-100">{t.backupData}</h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {lang === 'fa' 
            ? 'نسخه دسکتاپ تمام اطلاعات معاملات و تحلیل‌های شما را به صورت امن و خصوصی روی مرورگر سیستم خود ذخیره می‌کند. برای جلوگیری از پاک شدن اطلاعات هنگام پاک‌کردن کش مرورگر، یا انتقال اطلاعات به سیستمی دیگر، به طور منظم پشتیبان تهیه کنید.' 
            : 'Pro Trading Journal stores all analytical inputs in your local browser sandbox securely. To protect records from periodic cache cleaning policies or to transfer ledgers across separate workstations, export backups routinely.'}
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {/* JSON Export */}
          <button 
            onClick={handleExportJson}
            className="flex items-center justify-center gap-2.5 p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-950/80 transition text-sm font-semibold text-slate-200"
          >
            {copied ? <Check className="text-emerald-400" size={16} /> : <Download size={16} className="text-teal-400" />}
            <span>{copied ? t.exportCopySuccess : t.exportJson}</span>
          </button>

          {/* Excel/CSV Export */}
          <button 
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2.5 p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-950/80 transition text-sm font-semibold text-slate-200"
          >
            <FileSpreadsheet size={16} className="text-emerald-400" />
            <span>{t.exportCsv}</span>
          </button>
        </div>

        {/* Seeding Demo Data onboarding */}
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-3.5 mt-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-400 h-4 w-4" />
            <h3 className="text-xs font-bold text-slate-200 uppercase">{t.seedMockData}</h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            {t.seedMockDataDesc}
          </p>
          <button 
            onClick={onLoadDemoData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            {t.injectNow}
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Restore backups */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Upload className="text-indigo-400 h-5 w-5" />
            <h2 className="text-base font-bold text-slate-100">{t.importData}</h2>
          </div>

          <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-start gap-2 text-xs text-rose-400">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <p className="leading-tight">
              {t.importWarning}
            </p>
          </div>

          {/* File Upload Trigger */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">{t.chooseFile}</label>
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          {/* Backup Text Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">{lang === 'fa' ? 'یا کد بک‌آپ را اینجا پیست کنید:' : 'Or paste backup text here:'}</label>
            <textarea 
              rows={4}
              placeholder='{ "version": "1.0", "trades": [...] }'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500/80 leading-relaxed resize-none"
            ></textarea>
          </div>
        </div>

        {/* Feedback / Apply actions footer */}
        <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-800">
          <div className="text-xs font-semibold">
            {errorMsg && <span className="text-rose-400">{errorMsg}</span>}
            {successMsg && <span className="text-emerald-400">{successMsg}</span>}
          </div>
          <button 
            onClick={handleImportJson}
            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg text-xs transition"
          >
            {lang === 'fa' ? 'اعمال فایل پشتیبان' : 'Apply Import'}
          </button>
        </div>
      </div>

      {/* FULL WIDTH: App Smart Lock Settings */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Lock className="text-amber-400 h-5 w-5" />
          <h2 className="text-base font-bold text-slate-100">
            {lang === 'fa' ? 'قفل هوشمند محلی برنامه (Smart App Lock)' : 'Smart App Lock (Local Protection)'}
          </h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {lang === 'fa'
            ? 'برای محافظت از اطلاعات معاملاتی خود در سیستم‌های اشتراکی، قفل محلی برنامه را فعال کنید. پس از تعریف رمز ۴ رقمی، هربار که برنامه باز شود نیاز به وارد کردن آن است. تمام رمزگذاری‌ها روی مرورگر محلی شما انجام می‌گیرد.'
            : 'Protect your proprietary trading strategies and financial records in shared workspaces by enabling App Lock. Once a 4-digit PIN is configured, the system will lock and prompt for authorization on startup.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {passcode ? (
            /* Passcode is set: Disable UI */
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="text-emerald-400 h-4 w-4" />
                <span className="text-xs font-black text-slate-200">
                  {lang === 'fa' ? 'قفل امنیتی برنامه فعال است' : 'SECURITY APP LOCK IS ACTIVE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'fa'
                  ? 'برنامه در زمان باز شدن رمز عبور می‌خواهد. برای غیرفعال‌سازی، رمز فعلی را در فیلد زیر بنویسید:'
                  : 'The terminal prompts for authorization on startup. To disable protection, enter current PIN below:'}
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={disableInput}
                  onChange={(e) => setDisableInput(e.target.value.replace(/\D/g, ''))}
                  className="w-20 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-center text-slate-200 text-sm font-mono focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={handleDisablePasscode}
                  className="px-4 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  {lang === 'fa' ? 'غیرفعال‌سازی قفل' : 'Disable Lock'}
                </button>
              </div>
            </div>
          ) : (
            /* Passcode not set: Setup UI */
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Unlock className="text-amber-400 h-4 w-4" />
                <span className="text-xs font-black text-slate-200">
                  {lang === 'fa' ? 'تنظیم رمز عبور ۴ رقمی جدید' : 'SET 4-DIGIT SECURITY PIN'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">{lang === 'fa' ? 'رمز ۴ رقمی:' : '4-Digit PIN:'}</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center text-slate-200 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">{lang === 'fa' ? 'تکرار رمز:' : 'Confirm PIN:'}</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center text-slate-200 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={handleEnablePasscode}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition cursor-pointer uppercase tracking-wider"
              >
                {lang === 'fa' ? 'فعال‌سازی قفل برنامه' : 'Enable Lock Screen'}
              </button>
            </div>
          )}

          {/* Guidelines info card next to it */}
          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col justify-center space-y-2">
            <span className="text-xs font-bold text-slate-300">{lang === 'fa' ? 'دستورالعمل امنیتی' : 'Security Guidelines'}</span>
            <ul className={`text-[11px] text-slate-400 space-y-1 list-disc ${lang === 'fa' ? 'pr-4' : 'pl-4'}`}>
              <li>{lang === 'fa' ? 'رمز به صورت هش‌شده در مرورگر شما ذخیره می‌گردد.' : 'Your PIN is hashed and persisted locally inside your browser.'}</li>
              <li>{lang === 'fa' ? 'در صورت فراموشی رمز عبور، با پاک کردن کش مرورگر قفل غیرفعال می‌شود (همراه با پاک شدن آمار).' : 'If forgotten, clearing your browser cookies resets the lock (along with data).'}</li>
              <li>{lang === 'fa' ? 'همواره از لیست معاملات خود از بخش پشتیبان‌گیری، خروجی بگیرید.' : 'Routinely download back-ups of your transaction ledger.'}</li>
            </ul>
            <div className="text-xs font-semibold pt-1">
              {passcodeError && <span className="text-rose-400 font-bold">{passcodeError}</span>}
              {passcodeSuccess && <span className="text-emerald-400 font-bold">{passcodeSuccess}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* FULL WIDTH: Multi-Account Management */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <span className="text-emerald-400 font-mono text-xs">🏦</span>
          <h2 className="text-base font-bold text-slate-100">
            {lang === 'fa' ? 'مدیریت حساب‌های معاملاتی' : 'Trading Accounts Manager'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Active accounts list */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-400 block">
              {lang === 'fa' ? 'حساب‌های شما:' : 'Your Trading Accounts:'}
            </span>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {accounts?.map((acc) => (
                <div 
                  key={acc.id} 
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    acc.id === currentAccountId 
                      ? 'bg-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-500/5' 
                      : 'bg-slate-950/50 border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                      {acc.name}
                      {acc.id === currentAccountId && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-black uppercase">
                          {lang === 'fa' ? 'فعال' : 'Active'}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-black font-mono text-slate-400 mt-0.5">
                      {lang === 'fa' ? 'موجودی اولیه:' : 'Starting capital:'} ${acc.startingBalance.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {acc.id !== currentAccountId && (
                      <button
                        onClick={() => onSwitchAccount?.(acc.id)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-black transition cursor-pointer"
                      >
                        {lang === 'fa' ? 'سوئیچ' : 'Switch'}
                      </button>
                    )}
                    {accounts.length > 1 && (
                      <button
                        onClick={() => onDeleteAccount?.(acc.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title={lang === 'fa' ? 'حذف حساب' : 'Delete account'}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create new account form */}
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
            <span className="text-xs font-black text-slate-200 block uppercase tracking-wider">
              {lang === 'fa' ? 'افتتاح حساب جدید' : 'Create New Account'}
            </span>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">{lang === 'fa' ? 'نام حساب جدید:' : 'Account Name:'}</label>
                <input
                  type="text"
                  placeholder={lang === 'fa' ? 'مثلاً: حساب پراپ فرم' : 'e.g. Prop Account'}
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">{lang === 'fa' ? 'موجودی اولیه ($):' : 'Starting Balance ($):'}</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={() => {
                  const balance = parseFloat(newAccBalance);
                  if (!newAccName.trim()) {
                    alert(lang === 'fa' ? 'نام حساب نمی‌تواند خالی باشد.' : 'Account name is required.');
                    return;
                  }
                  if (isNaN(balance) || balance < 0) {
                    alert(lang === 'fa' ? 'موجودی اولیه نامعتبر است.' : 'Starting balance must be a positive number.');
                    return;
                  }
                  onCreateAccount?.(newAccName.trim(), balance);
                  setNewAccName('');
                  setNewAccBalance('10000');
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer uppercase tracking-wider"
              >
                {lang === 'fa' ? 'ایجاد و سوئیچ به حساب جدید' : 'Create & Switch to Account'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FULL WIDTH: Trading Account Profile Settings */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <span className="text-cyan-400 font-mono text-xs">🎯</span>
          <h2 className="text-base font-bold text-slate-100">
            {lang === 'fa' ? 'تنظیمات پروفایل حساب معاملاتی' : 'Trading Account Profile Settings'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                {lang === 'fa' ? 'نام حساب معاملاتی:' : 'Trading Account Name:'}
              </label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder={lang === 'fa' ? 'مثلاً: حساب فیوچرز بایننس' : 'e.g. Binance Futures'}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                {lang === 'fa' ? 'سرمایه اولیه حساب (دلار):' : 'Starting Capital ($):'}
              </label>
              <input
                type="number"
                value={editedBalance}
                onChange={(e) => setEditedBalance(e.target.value)}
                placeholder="10000"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveAccountSettings}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
              >
                {lang === 'fa' ? 'بروزرسانی مشخصات حساب' : 'Save Profile Settings'}
              </button>

              <button
                onClick={() => {
                  if (confirm(lang === 'fa' ? 'آیا مطمئن هستید؟ این کار مشخصات حساب را بازنشانی می‌کند تا بتوانید دوباره از نو بسازید.' : 'Are you sure you want to reset your account profile settings?')) {
                    onUpdateAccount('', 0);
                  }
                }}
                className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/15 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                {lang === 'fa' ? 'ریست کل پروفایل' : 'Reset Profile'}
              </button>
            </div>

            {accountSuccess && (
              <p className="text-xs font-semibold text-emerald-400 pt-1">
                {accountSuccess}
              </p>
            )}
          </div>

          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col justify-center space-y-2">
            <span className="text-xs font-bold text-slate-300">{lang === 'fa' ? 'توضیحات ستاپ اولیه' : 'Account Baseline Mechanics'}</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'fa'
                ? 'موجودی اولیه شما به عنوان مبدأ برای محاسبه بازدهی معاملات (ROI)، رسم نمودار رشد پیوسته سرمایه (Equity Curve) و محاسبه دراودان (Drawdown) استفاده خواهد شد. با ویرایش سرمایه اولیه، کل این آمارها به صورت پویا بازنویسی خواهند شد.'
                : 'Your configured starting capital serves as the baseline to track Net ROI, render the continuous equity curve, and measure peak drawdown states. Updating these values will recalculate all telemetry and analytics on the fly.'}
            </p>
          </div>
        </div>
      </div>

      {/* FULL WIDTH: Keyboard Shortcuts Guide */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <span className="text-teal-400 font-mono text-xs">⚡</span>
          <h2 className="text-base font-bold text-slate-100">
            {lang === 'fa' ? 'میانبرهای هوشمند کیبورد (Keyboard Shortcuts)' : 'Keyboard Shortcuts Reference'}
          </h2>
        </div>
        
        <p className="text-xs text-slate-400">
          {lang === 'fa' 
            ? 'برای افزایش سرعت ناوبری و کارایی ثبت معامله، می‌توانید از کلیدهای میانبر زیر در هر جای برنامه استفاده کنید:' 
            : 'To increase navigation efficiency and logging speed, use these keyboard hotkeys globally across the terminal:'}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {[
            { keys: ['Alt', 'D'], labelFa: 'داشبورد', labelEn: 'Dashboard' },
            { keys: ['Alt', 'L'], labelFa: 'لیست معاملات', labelEn: 'Trade Ledger' },
            { keys: ['Alt', 'A'], labelFa: 'تحلیل آماری', labelEn: 'Advanced Stats' },
            { keys: ['Alt', 'C'], labelFa: 'حسابگر ریسک', labelEn: 'Risk Calculator' },
            { keys: ['Alt', 'J'], labelFa: 'ژورنال روزانه', labelEn: 'Daily Journal' },
            { keys: ['Alt', 'S'], labelFa: 'تنظیمات', labelEn: 'Settings & Backup' },
            { keys: ['Alt', 'N'], labelFa: 'معامله جدید', labelEn: 'Add New Trade' },
            { keys: ['Alt', 'T'], labelFa: 'تغییر زبان', labelEn: 'Toggle Language' },
            { keys: ['Alt', 'K'], labelFa: 'قفل برنامه', labelEn: 'Lock Screen' }
          ].map((sc, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
              <div className="flex gap-1">
                {sc.keys.map((k, kIdx) => (
                  <kbd key={kIdx} className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300 font-bold uppercase shadow">
                    {k}
                  </kbd>
                ))}
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {lang === 'fa' ? sc.labelFa : sc.labelEn}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FULL WIDTH: Support Contact Section */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4" id="settings_support_section">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <LifeBuoy className="text-blue-400 h-5 w-5" />
          <h2 className="text-base font-bold text-slate-100">
            {lang === 'fa' ? 'پشتیبانی و ارتباط با ما' : 'Support & Assistance'}
          </h2>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <p className="text-xs text-slate-400">
              {lang === 'fa' 
                ? 'در صورت داشتن هرگونه سوال، پیشنهاد یا بروز مشکل فنی در عملکرد ژورنال معاملاتی، از طریق ایمیل زیر با تیم پشتیبانی در ارتباط باشید:' 
                : 'If you have any questions, suggestions, or technical difficulties with your trading journal, please contact our support desk:'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {lang === 'fa' ? 'پاسخگویی معمولاً در کمتر از ۲۴ ساعت کاری انجام می‌شود.' : 'Typical response time is under 24 business hours.'}
            </p>
          </div>

          <a 
            href="mailto:support@tradejrnl.app"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-blue-900/20 uppercase tracking-wider self-start md:self-auto shrink-0"
          >
            <Mail size={14} />
            <span>{lang === 'fa' ? 'ارسال ایمیل به پشتیبانی' : 'Contact Support'}</span>
          </a>
        </div>
      </div>

    </div>
  );
}
