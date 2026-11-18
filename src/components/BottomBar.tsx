import React from 'react';
import { HandCoins, DollarSign, CreditCard, QrCode, ArrowUpRight, Clock, ShieldCheck, Receipt } from 'lucide-react';
import { StoreSettings, CreditRecord } from '../types';
import { formatCurrency } from '../utils/currency';

interface BottomBarProps {
  settings: StoreSettings;
  todaySalesTotal: number;
  todaySalesCount?: number;
  todayCashTotal: number;
  todayCardTotal: number;
  todayQrTotal: number;
  pendingCredits: CreditRecord[];
  onOpenCreditModal: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  settings,
  todaySalesTotal,
  todaySalesCount = 0,
  todayCashTotal,
  todayCardTotal,
  todayQrTotal,
  pendingCredits,
  onOpenCreditModal,
}) => {
  const totalPendingCredit = pendingCredits.reduce((sum, c) => sum + c.remainingAmount, 0);

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-white select-none px-3 py-2 shrink-0 z-20 print:hidden shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Today's Actual Revenue breakdown (Cash + Card + QR) & Bill Count */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs overflow-x-auto scrollbar-none py-0.5">
          {/* Today Bills Count placed at bottom as requested */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg">
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 font-normal">
              {settings.language === 'si' ? 'අද බිල්පත්:' : 'Today Bills:'}
            </span>
            <span className="font-mono text-white text-xs sm:text-sm font-black">
              {todaySalesCount}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 font-normal">
              {settings.language === 'si' ? 'අද දින එකතු වූ ආදායම:' : 'Today Revenue:'}
            </span>
            <span className="font-mono text-emerald-400 text-sm font-black">
              {formatCurrency(todaySalesTotal, settings.currency)}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800 hidden sm:block" />

          {/* Breakdown: Cash */}
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-slate-500">Cash:</span>
            <span className="font-mono font-semibold text-slate-200">
              {formatCurrency(todayCashTotal, settings.currency)}
            </span>
          </div>

          {/* Breakdown: Card */}
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-slate-500">Card:</span>
            <span className="font-mono font-semibold text-slate-200">
              {formatCurrency(todayCardTotal, settings.currency)}
            </span>
          </div>

          {/* Breakdown: QR */}
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <QrCode className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] text-slate-500">QR:</span>
            <span className="font-mono font-semibold text-slate-200">
              {formatCurrency(todayQrTotal, settings.currency)}
            </span>
          </div>
        </div>

        {/* Right: The requested Prominent Credit Box
            "පහල තීරුවේ Icon එකක් හදල එතනට එකතු කරන්න. එම කොටුව Credit ලෙස නම් කරන්න." */}
        <div className="flex items-center gap-2">
          <button
            id="bottom-credit-box"
            type="button"
            onClick={onOpenCreditModal}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:from-amber-700 active:to-amber-800 text-white rounded-xl shadow-md transition-all cursor-pointer border border-amber-500/50 group"
            title={settings.language === 'si' ? 'ණය කළමනාකරණය සහ පියවීම්' : 'Credit Management & Settlements'}
          >
            <div className="p-1 rounded-lg bg-amber-950/40 text-amber-200">
              <HandCoins className="w-4 h-4 text-amber-200 group-hover:scale-110 transition-transform" />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm tracking-wide">
                  Credit
                </span>
                {pendingCredits.length > 0 && (
                  <span className="bg-amber-950 text-amber-300 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                    {pendingCredits.length}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-amber-100 font-mono font-bold">
                {formatCurrency(totalPendingCredit, settings.currency)}
              </div>
            </div>

            <div className="ml-1 pl-2 border-l border-amber-500/40 flex items-center gap-1 text-[11px] font-bold text-amber-100 group-hover:text-white">
              <span className="hidden sm:inline">{settings.language === 'si' ? 'පියවන්න' : 'Pay'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>
    </footer>
  );
};
