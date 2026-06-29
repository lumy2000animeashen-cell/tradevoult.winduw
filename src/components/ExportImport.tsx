/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trade, DailyJournalEntry, ChecklistItem, TradingGoal } from '../types';
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
  Info
} from 'lucide-react';

interface ExportImportProps {
  trades: Trade[];
  dailyEntries: DailyJournalEntry[];
  checklist: ChecklistItem[];
  goals: TradingGoal[];
  lang: Language;
  onImportBackup: (data: {
    trades: Trade[];
    dailyEntries: DailyJournalEntry[];
    checklist: ChecklistItem[];
    goals: TradingGoal[];
  }) => void;
  onLoadDemoData: () => void;
}

export default function ExportImport({
  trades,
  dailyEntries,
  checklist,
  goals,
  lang,
  onImportBackup,
  onLoadDemoData
}: ExportImportProps) {
  const t = translations[lang];

  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

    </div>
  );
}
