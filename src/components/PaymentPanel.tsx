import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  CheckCircle2,
  AlertCircle,
  Coins,
  Banknote,
  DollarSign,
  ArrowRight,
  Calculator,
  Percent,
  X,
  RotateCcw
} from 'lucide-react';
import { StoreSettings } from '../types';
import { TRANSLATIONS } from '../utils/defaultData';
import { formatCurrency, calculateDenominations } from '../utils/currency';
import { soundFx } from '../utils/audio';
import { DiscountTabsControl } from './DiscountTabsControl';

interface PaymentPanelProps {
  subtotal: number;
  discount: number;
  onUpdateDiscount: (discount: number) => void;
  cashReceived: number;
  onUpdateCashReceived: (cash: number) => void;
  settings: StoreSettings;
  onPrintReceipt: () => void;
  onCompleteSale: () => void;
  onOpenPaymentMethods?: () => void;
  itemCount: number;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  subtotal,
  discount,
  onUpdateDiscount,
  cashReceived,
  onUpdateCashReceived,
  settings,
  onPrintReceipt,
  onCompleteSale,
  onOpenPaymentMethods,
  itemCount,
}) => {
  const t = TRANSLATIONS[settings.language];
  const cashInputRef = useRef<HTMLInputElement>(null);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [showDenominations, setShowDenominations] = useState(true);

  const grandTotal = Math.max(0, subtotal - discount);
  const change = cashReceived > 0 ? cashReceived - grandTotal : 0;
  const isShortage = cashReceived > 0 && cashReceived < grandTotal;
  const shortageAmount = grandTotal - cashReceived;
  const isExact = cashReceived > 0 && Math.abs(change) < 0.001;
  const isPaidInFull = cashReceived >= grandTotal && grandTotal > 0;

  // Keyboard shortcut F4 to focus cash tendered input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        cashInputRef.current?.focus();
        cashInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickCash = (amount: number) => {
    soundFx.playBeep();
    onUpdateCashReceived(amount);
  };

  const handleAddCash = (amount: number) => {
    soundFx.playBeep();
    onUpdateCashReceived(cashReceived + amount);
  };

  const handleExactCash = () => {
    soundFx.playBeep();
    onUpdateCashReceived(grandTotal);
  };

  const denominations = calculateDenominations(change);

  return (
    <div className="bill-panel-container bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
      {/* Top Section: Grand Total Display (High visual contrast) */}
      <div className="p-4 bg-slate-900 text-white">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>{t.subTotal}:</span>
          <span className="font-mono text-slate-200">{formatCurrency(subtotal, settings.currency)}</span>
        </div>

        {/* Discount row toggle */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <button
            type="button"
            onClick={() => setShowDiscountInput(!showDiscountInput)}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 hover:underline cursor-pointer font-medium"
          >
            <Percent className="w-3.5 h-3.5" />
            <span>
              {showDiscountInput
                ? (settings.language === 'si' ? 'වට්ටම් සඟවන්න' : 'Hide Discount')
                : (settings.language === 'si' ? '+ වට්ටමක් ලබාදෙන්න (රු: / %)' : '+ Add Discount (Rs. / %)')}
            </span>
          </button>
          {discount > 0 && (
            <span className="font-mono text-amber-400 font-bold">
              - {formatCurrency(discount, settings.currency)}
            </span>
          )}
        </div>

        {/* 2 Tabs Discount Control: වට්ටම් (රු:) සහ වට්ටම් (%) */}
        {showDiscountInput && (
          <div className="mb-3">
            <DiscountTabsControl
              subtotal={subtotal}
              discount={discount}
              onUpdateDiscount={onUpdateDiscount}
              settings={settings}
              theme="dark"
            />
          </div>
        )}

        {/* Big Highlighted Total */}
        <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.grandTotal}
            </span>
            <p className="text-[11px] text-slate-400">
              {settings.language === 'si' ? 'භාණ්ඩවල සම්පූර්ණ වටිනාකම' : 'Total Payable Value'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {formatCurrency(grandTotal, settings.currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Customer Cash Tendered & Quick Buttons */}
      <div className="p-4 space-y-3.5 bg-slate-50/50 border-b border-slate-200">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="cash-received-input"
              className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5"
            >
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>{t.cashReceived}</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">Shortcut: [F4]</span>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono text-base pointer-events-none">
              {settings.currency}
            </span>
            <input
              id="cash-received-input"
              ref={cashInputRef}
              type="number"
              step="any"
              min="0"
              value={cashReceived === 0 ? '' : cashReceived}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdateCashReceived(parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (itemCount > 0) {
                    soundFx.playBeep();
                    if (onOpenPaymentMethods) {
                      onOpenPaymentMethods();
                    } else {
                      onCompleteSale();
                    }
                  }
                }
              }}
              placeholder="0.00"
              className={`w-full pl-12 ${cashReceived > 0 ? 'pr-11' : 'pr-4'} py-2.5 text-xl font-bold font-mono text-right text-slate-900 bg-white border-2 border-blue-400 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-200 focus:outline-hidden shadow-xs transition-all`}
            />
            {cashReceived > 0 && (
              <button
                id="btn-clear-cash-input"
                type="button"
                onClick={() => {
                  onUpdateCashReceived(0);
                  soundFx.playBeep();
                  cashInputRef.current?.focus();
                }}
                title={settings.language === 'si' ? 'මුදල මකන්න (Clear)' : 'Clear amount'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Cash Buttons */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{settings.language === 'si' ? 'ක්ෂණික මුදල් තේරීම්:' : 'Quick Cash Presets:'}</span>
            <div className="flex items-center gap-2">
              {cashReceived > 0 && (
                <button
                  id="btn-clear-cash-text"
                  type="button"
                  onClick={() => {
                    onUpdateCashReceived(0);
                    soundFx.playBeep();
                    cashInputRef.current?.focus();
                  }}
                  className="text-rose-600 font-bold hover:underline hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{settings.language === 'si' ? 'මකන්න (Clear)' : 'Clear'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExactCash}
                disabled={grandTotal <= 0}
                className="text-blue-600 font-bold hover:underline disabled:opacity-40 cursor-pointer"
              >
                {settings.language === 'si' ? 'හරියටම එකතුව' : 'Exact Bill'} ({formatCurrency(grandTotal, settings.currency)})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {[50, 100, 500, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickCash(val)}
                className="py-1.5 px-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg text-xs font-bold font-mono transition-all active:scale-95 shadow-2xs text-center"
              >
                {val.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleAddCash(100)}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-semibold transition-colors"
            >
              +100
            </button>
            <button
              type="button"
              onClick={() => handleAddCash(500)}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-semibold transition-colors"
            >
              +500
            </button>
            <button
              type="button"
              onClick={() => handleAddCash(1000)}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-semibold transition-colors"
            >
              +1,000
            </button>
            <button
              id="btn-clear-cash-box"
              type="button"
              onClick={() => {
                onUpdateCashReceived(0);
                soundFx.playBeep();
                cashInputRef.current?.focus();
              }}
              disabled={cashReceived === 0}
              className="py-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{settings.language === 'si' ? 'මකන්න' : 'Clear'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CORE RESULT: Change To Return (ඉතුරු ලබා දිය යුතු මුදල) */}
      <div className="p-4 space-y-3">
        {isShortage ? (
          // Shortage warning
          <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center justify-between text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wide">
                  {t.changeShortage}
                </span>
                <p className="text-[11px] text-amber-700">
                  {settings.language === 'si' ? 'කස්ටමර් ලබාදුන් මුදල මදි' : 'Customer payment is insufficient'}
                </p>
              </div>
            </div>
            <div className="text-right font-mono font-extrabold text-lg sm:text-xl text-amber-700">
              - {formatCurrency(shortageAmount, settings.currency)}
            </div>
          </div>
        ) : isExact ? (
          // Exact payment
          <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-xs">{t.exactPayment}</span>
                <p className="text-[11px] text-emerald-700">
                  {settings.language === 'si' ? 'ඉතුරු දීමට මුදල් නැත' : 'No change to return'}
                </p>
              </div>
            </div>
            <div className="font-mono font-bold text-base text-emerald-700">
              {formatCurrency(0, settings.currency)}
            </div>
          </div>
        ) : isPaidInFull ? (
          // CHANGE TO RETURN - Massive, highlighted for cashier clarity!
          <div className="p-3.5 bg-emerald-600 text-white rounded-xl shadow-md space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Coins className="w-5 h-5 text-emerald-200" />
                <span className="font-bold text-xs sm:text-sm uppercase tracking-wider text-emerald-100">
                  {t.changeReturn}
                </span>
              </div>
              <span className="text-[11px] bg-emerald-700 px-2 py-0.5 rounded-full font-medium text-emerald-200">
                {settings.language === 'si' ? 'කස්ටමර්ට දෙන්න' : 'Hand to customer'}
              </span>
            </div>

            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                {formatCurrency(change, settings.currency)}
              </div>
            </div>

            {/* Note breakdown */}
            {denominations.length > 0 && (
              <div className="pt-2 border-t border-emerald-500/60 text-xs">
                <div className="flex items-center justify-between text-[11px] text-emerald-100 mb-1">
                  <span>{t.denominationsHelper}</span>
                  <button
                    type="button"
                    onClick={() => setShowDenominations(!showDenominations)}
                    className="text-emerald-200 underline text-[10px]"
                  >
                    {showDenominations ? 'සඟවන්න' : 'පෙන්වන්න'}
                  </button>
                </div>

                {showDenominations && (
                  <div className="flex flex-wrap gap-1.5">
                    {denominations.map((d) => (
                      <span
                        key={d.note}
                        className="inline-flex items-center gap-1 bg-emerald-700/90 text-white font-mono px-2 py-0.5 rounded text-[11px] font-bold"
                      >
                        {settings.currency} {d.note} × {d.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Prompt to enter cash
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
            <p className="font-medium">
              {settings.language === 'si'
                ? 'කස්ටමර් ලබාදුන් මුදල ඉහතින් ඇතුලත් කරන්න'
                : 'Enter customer cash tendered above to calculate change'}
            </p>
          </div>
        )}

        {/* Action Buttons: Print Bill & Complete / Payment Methods */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            id="print-receipt-btn"
            type="button"
            onClick={onPrintReceipt}
            disabled={itemCount === 0}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>{t.printBill}</span>
          </button>

          <button
            id="open-payment-methods-btn"
            type="button"
            onClick={() => {
              if (onOpenPaymentMethods) {
                onOpenPaymentMethods();
              } else {
                onCompleteSale();
              }
            }}
            disabled={itemCount === 0}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
          >
            <span>{settings.language === 'si' ? 'ගෙවීම් ක්‍රම ➔' : 'Payment Methods ➔'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
