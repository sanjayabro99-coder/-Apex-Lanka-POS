import React, { useState, useEffect, useRef } from 'react';
import {
  Banknote,
  CreditCard,
  QrCode,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Printer,
  Coins,
  AlertCircle,
  Percent,
  Check,
  Phone,
  User,
  ShieldCheck,
  Smartphone,
  X,
  RotateCcw
} from 'lucide-react';
import { PaymentMethod, StoreSettings } from '../types';
import { TRANSLATIONS } from '../utils/defaultData';
import { formatCurrency, calculateDenominations } from '../utils/currency';
import { soundFx } from '../utils/audio';
import { DiscountTabsControl } from './DiscountTabsControl';

interface PaymentMethodsPanelProps {
  subtotal: number;
  discount: number;
  onUpdateDiscount: (discount: number) => void;
  cashReceived: number;
  onUpdateCashReceived: (cash: number) => void;
  paymentMethod: PaymentMethod;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  paymentDetails: string;
  onUpdatePaymentDetails: (details: string) => void;
  settings: StoreSettings;
  onBackToBill: () => void;
  onPrintReceipt: () => void;
  onCompleteSale: () => void;
  itemCount: number;
  billNumber: string;
  customerPhone?: string;
  customerName?: string;
  onUpdateCustomerPhone?: (phone: string) => void;
  onUpdateCustomerName?: (name: string) => void;
}

export const PaymentMethodsPanel: React.FC<PaymentMethodsPanelProps> = ({
  subtotal,
  discount,
  onUpdateDiscount,
  cashReceived,
  onUpdateCashReceived,
  paymentMethod,
  onSelectPaymentMethod,
  paymentDetails,
  onUpdatePaymentDetails,
  settings,
  onBackToBill,
  onPrintReceipt,
  onCompleteSale,
  itemCount,
  billNumber,
  customerPhone = '',
  customerName = '',
  onUpdateCustomerPhone,
  onUpdateCustomerName,
}) => {
  const t = TRANSLATIONS[settings.language];
  const cashInputRef = useRef<HTMLInputElement>(null);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [showDenominations, setShowDenominations] = useState(true);

  const grandTotal = Math.max(0, subtotal - discount);

  // When switching to Card or QR, automatically set cashReceived to exact bill total
  const handleMethodChange = (method: PaymentMethod) => {
    soundFx.playBeep();
    onSelectPaymentMethod(method);
    if (method === 'card' || method === 'qr') {
      onUpdateCashReceived(grandTotal);
    } else if (method === 'credit') {
      // In credit mode, cashier can record 0 or partial payment
      if (cashReceived === grandTotal) {
        onUpdateCashReceived(0);
      }
    }
  };

  const change = cashReceived > 0 ? cashReceived - grandTotal : 0;
  const isShortage = paymentMethod === 'cash' && cashReceived > 0 && cashReceived < grandTotal;
  const shortageAmount = grandTotal - cashReceived;
  const isExact = cashReceived > 0 && Math.abs(change) < 0.001;
  const isPaidInFull = (paymentMethod !== 'credit' && cashReceived >= grandTotal && grandTotal > 0) || (paymentMethod === 'credit' && grandTotal > 0);

  const METHODS: PaymentMethod[] = ['cash', 'card', 'qr', 'credit'];

  // Focus cash input if cash method is active
  useEffect(() => {
    if (paymentMethod === 'cash') {
      cashInputRef.current?.focus();
      cashInputRef.current?.select();
    }
  }, [paymentMethod]);

  // 4 Arrow keys and Enter navigation:
  // "හැම වෙලාවෙන Enter බට්න් එක වැඩ කරන්න ඕනේ Mouse එකට අමතරව සහ Arow Keys 4ත් වැඩ කරන්න ඕනේ"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      const isCashInput = activeEl?.id === 'cash-tendered-input' || activeEl?.id === 'cash-received-input';

      if (e.key === 'Escape') {
        e.preventDefault();
        onBackToBill();
        return;
      }

      // Enter key handling: "අදාල කොටුව mouse එකෙන් තෝරා නැවත Entar කල විට Send tab එකට එන්න ඕනේ"
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();

        if (itemCount === 0) return;

        if (paymentMethod === 'cash') {
          // If cash received is 0, auto-fill exact total
          if (cashReceived <= 0 && grandTotal > 0) {
            onUpdateCashReceived(grandTotal);
          }
        }
        soundFx.playSuccess();
        onCompleteSale();
        return;
      }

      // Arrow keys navigation between Payment Methods
      if (isCashInput) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const currentIdx = METHODS.indexOf(paymentMethod);
          const nextIdx = e.key === 'ArrowDown'
            ? (currentIdx + 1) % METHODS.length
            : (currentIdx - 1 + METHODS.length) % METHODS.length;
          handleMethodChange(METHODS[nextIdx]);
        }
        return;
      }

      if (isTextInput) {
        return;
      }

      // If outside inputs, all 4 arrow keys move between payment methods
      const currentIdx = METHODS.indexOf(paymentMethod);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = (currentIdx + 1) % METHODS.length;
        handleMethodChange(METHODS[nextIdx]);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = (currentIdx - 1 + METHODS.length) % METHODS.length;
        handleMethodChange(METHODS[prevIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [paymentMethod, cashReceived, grandTotal, itemCount, onCompleteSale, onBackToBill, onUpdateCashReceived]);

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden h-full">
      {/* Top Banner: Total & Navigation Tab Bar */}
      <div className="p-4 bg-slate-900 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-bold text-xs uppercase tracking-wider">
              Payment Methods
            </span>
            <span className="text-xs text-slate-300 font-mono">
              #{billNumber}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {itemCount} {settings.language === 'si' ? 'භාණ්ඩ' : 'items'}
          </span>
        </div>

        {/* Big Highlighted Total */}
        <div className="flex items-baseline justify-between pt-1 border-t border-slate-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.grandTotal}
            </span>
            {customerPhone && (
              <p className="text-[11px] text-blue-300 truncate max-w-[180px]">
                {customerPhone} {customerName ? `(${customerName})` : ''}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              {formatCurrency(grandTotal, settings.currency)}
            </div>
          </div>
        </div>

        {/* Discount row toggle */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
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
          <div className="mt-2">
            <DiscountTabsControl
              subtotal={subtotal}
              discount={discount}
              onUpdateDiscount={onUpdateDiscount}
              settings={settings}
              theme="dark"
            />
          </div>
        )}
      </div>

      {/* Middle Section: 4 Payment Method Options (BIG ICONS) */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-slate-50/50">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            {settings.language === 'si' ? 'ගෙවීම් ක්‍රමය තෝරන්න (Select Payment Method):' : 'Select Payment Method:'}
          </label>

          {/* 4 Cards with BIG ICONS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Cash */}
            <button
              id="payment-method-cash"
              type="button"
              onClick={() => handleMethodChange('cash')}
              className={`p-3 sm:p-3.5 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'cash'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-2xs ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <Banknote className="w-7 h-7" />
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm">Cash</div>
                <div className="text-[11px] text-slate-500 font-medium">මුදල් ගෙවීම්</div>
              </div>
              {paymentMethod === 'cash' && (
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              )}
            </button>

            {/* 2. Credit Card */}
            <button
              id="payment-method-card"
              type="button"
              onClick={() => handleMethodChange('card')}
              className={`p-3 sm:p-3.5 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'card'
                  ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-2xs ${
                  paymentMethod === 'card'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm">Credit Card</div>
                <div className="text-[11px] text-slate-500 font-medium">කාඩ්පත් ගෙවීම්</div>
              </div>
              {paymentMethod === 'card' && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            {/* 3. QR Code */}
            <button
              id="payment-method-qr"
              type="button"
              onClick={() => handleMethodChange('qr')}
              className={`p-3 sm:p-3.5 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'qr'
                  ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-md ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-2xs ${
                  paymentMethod === 'qr'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                <QrCode className="w-7 h-7" />
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm">QR Code</div>
                <div className="text-[11px] text-slate-500 font-medium">LankaQR / Scan</div>
              </div>
              {paymentMethod === 'qr' && (
                <span className="w-2 h-2 rounded-full bg-purple-600" />
              )}
            </button>

            {/* 4. Credit (ණය) */}
            <button
              id="payment-method-credit"
              type="button"
              onClick={() => handleMethodChange('credit')}
              className={`p-3 sm:p-3.5 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'credit'
                  ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-md ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-2xs ${
                  paymentMethod === 'credit'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm">Credit</div>
                <div className="text-[11px] text-slate-500 font-medium">ණයට ලබාදීම</div>
              </div>
              {paymentMethod === 'credit' && (
                <span className="w-2 h-2 rounded-full bg-amber-600" />
              )}
            </button>
          </div>
        </div>

        {/* DETAILS SECTION ACCORDING TO SELECTED METHOD */}

        {/* A. CASH SECTION */}
        {paymentMethod === 'cash' && (
          <div className="space-y-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="cash-tendered-input"
                  className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5"
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>{t.cashReceived}</span>
                </label>
                <div className="flex items-center gap-2">
                  {cashReceived > 0 && (
                    <button
                      id="btn-methods-clear-cash-text"
                      type="button"
                      onClick={() => {
                        onUpdateCashReceived(0);
                        soundFx.playBeep();
                        cashInputRef.current?.focus();
                      }}
                      className="text-rose-600 text-xs font-bold hover:underline hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{settings.language === 'si' ? 'මකන්න (Clear)' : 'Clear'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="text-blue-600 text-xs font-bold hover:underline cursor-pointer"
                  >
                    {settings.language === 'si' ? 'හරියටම එකතුව' : 'Exact Bill'}: {formatCurrency(grandTotal, settings.currency)}
                  </button>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono text-base pointer-events-none">
                  {settings.currency}
                </span>
                <input
                  id="cash-tendered-input"
                  ref={cashInputRef}
                  type="number"
                  step="any"
                  min="0"
                  value={cashReceived === 0 ? '' : cashReceived}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => onUpdateCashReceived(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`w-full pl-12 ${cashReceived > 0 ? 'pr-11' : 'pr-4'} py-2.5 text-xl font-bold font-mono text-right text-slate-900 bg-white border-2 border-emerald-400 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 focus:outline-hidden shadow-xs transition-all`}
                />
                {cashReceived > 0 && (
                  <button
                    id="btn-methods-clear-cash-input"
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

            {/* Quick Cash Presets (50, 100, 500, 1000, 2000, 5000) as requested! */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>{settings.language === 'si' ? 'ක්ෂණික මුදල් තේරීම්:' : 'Quick Cash Presets:'}</span>
                {cashReceived > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateCashReceived(0);
                      soundFx.playBeep();
                      cashInputRef.current?.focus();
                    }}
                    className="text-rose-600 hover:text-rose-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{settings.language === 'si' ? 'ලබාදුන් මුදල මකන්න' : 'Reset Cash'}</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[50, 100, 500, 1000, 2000, 5000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickCash(val)}
                    className="py-1.5 px-1 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 hover:text-emerald-700 border border-slate-200 rounded-lg text-xs font-bold font-mono transition-all active:scale-95 text-center shadow-2xs"
                  >
                    {val.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Incremental add cash */}
              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                {[50, 100, 500, 1000].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => handleAddCash(inc)}
                    className="py-1 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors text-center cursor-pointer"
                  >
                    +{inc}
                  </button>
                ))}
                <button
                  id="btn-methods-clear-cash-box"
                  type="button"
                  onClick={() => {
                    onUpdateCashReceived(0);
                    soundFx.playBeep();
                    cashInputRef.current?.focus();
                  }}
                  disabled={cashReceived === 0}
                  className="py-1 px-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{settings.language === 'si' ? 'මකන්න' : 'Clear'}</span>
                </button>
              </div>
            </div>

            {/* Change or Shortage Display */}
            {isShortage ? (
              <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center justify-between text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wide">
                      {t.changeShortage}
                    </span>
                    <p className="text-[11px] text-amber-700">
                      {settings.language === 'si' ? 'ලබාදුන් මුදල මදි' : 'Insufficient cash'}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono font-extrabold text-lg text-amber-700">
                  - {formatCurrency(shortageAmount, settings.currency)}
                </div>
              </div>
            ) : isExact ? (
              <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs">{t.exactPayment}</span>
                    <p className="text-[11px] text-emerald-700">
                      {settings.language === 'si' ? 'ඉතුරු දීමට නැත' : 'Exact amount paid'}
                    </p>
                  </div>
                </div>
                <div className="font-mono font-bold text-base text-emerald-700">
                  {formatCurrency(0, settings.currency)}
                </div>
              </div>
            ) : isPaidInFull ? (
              <div className="p-3.5 bg-emerald-600 text-white rounded-xl shadow-md space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-5 h-5 text-emerald-200" />
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-100">
                      {t.changeReturn}
                    </span>
                  </div>
                  <span className="text-[11px] bg-emerald-700 px-2 py-0.5 rounded-full font-medium text-emerald-200">
                    {settings.language === 'si' ? 'කස්ටමර්ට ලබාදෙන්න' : 'Hand to customer'}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                    {formatCurrency(change, settings.currency)}
                  </div>
                </div>

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
            ) : null}
          </div>
        )}

        {/* B. CREDIT CARD SECTION */}
        {paymentMethod === 'card' && (
          <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-bold text-xs text-blue-900">Card POS Machine</div>
                  <div className="text-[11px] text-blue-700">Visa / MasterCard / UnionPay</div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-blue-950 text-base">
                {formatCurrency(grandTotal, settings.currency)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {settings.language === 'si' ? 'කාඩ්පත් අංකයේ අවසන් ඉලක්කම් 4 හෝ Reference (විකල්ප):' : 'Card Last 4 Digits / Reference (Optional):'}
              </label>
              <input
                type="text"
                value={paymentDetails}
                onChange={(e) => onUpdatePaymentDetails(e.target.value)}
                placeholder="e.g. 4589 / TXN-998"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* C. QR CODE SECTION */}
        {paymentMethod === 'qr' && (
          <div className="p-4 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-bold text-xs text-purple-900">LankaQR Online Pay</div>
                  <div className="text-[11px] text-purple-700">Scan via Flash, iPay, Q+, Genie</div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-purple-950 text-base">
                {formatCurrency(grandTotal, settings.currency)}
              </div>
            </div>

            <div className="flex items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-center space-y-1.5">
                <div className="w-24 h-24 mx-auto bg-white p-2 rounded-lg border border-slate-300 shadow-2xs flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-slate-800" />
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-700">
                  LankaQR Sri Lanka
                </div>
                <div className="text-[10px] text-slate-500">
                  {settings.language === 'si' ? 'කවුන්ටරයේ QR කේතය ස්කෑන් කර ගෙවීම් ලබාගන්න' : 'Scan counter QR code to receive payment'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {settings.language === 'si' ? 'App Transaction / Reference ID (විකල්ප):' : 'Transaction Reference (Optional):'}
              </label>
              <input
                type="text"
                value={paymentDetails}
                onChange={(e) => onUpdatePaymentDetails(e.target.value)}
                placeholder="e.g. REF-782619"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* D. CREDIT (ණය) SECTION */}
        {paymentMethod === 'credit' && (
          <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-bold text-xs text-amber-900">
                    {settings.language === 'si' ? 'ණයට ලබාදීම (Credit Sale)' : 'Customer Credit / Ledger'}
                  </div>
                  <div className="text-[11px] text-amber-700">
                    {settings.language === 'si' ? 'පාරිභෝගිකයාගේ ගිණුමට එකතු වේ' : 'Recorded in Customer Ledger'}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-amber-950 text-base">
                {formatCurrency(grandTotal, settings.currency)}
              </div>
            </div>

            {/* Customer Details info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {settings.language === 'si' ? 'දුරකථන අංකය *' : 'Phone Number *'}
                </label>
                <div className="relative">
                  <Phone className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => onUpdateCustomerPhone?.(e.target.value)}
                    placeholder="07X XXX XXXX"
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {settings.language === 'si' ? 'පාරිභෝගිකයාගේ නම' : 'Customer Name'}
                </label>
                <div className="relative">
                  <User className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => onUpdateCustomerName?.(e.target.value)}
                    placeholder="e.g. නිමල්"
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {settings.language === 'si' ? 'පසුව ගෙවන දිනය හෝ සටහන:' : 'Due Date / Credit Note:'}
              </label>
              <input
                type="text"
                value={paymentDetails}
                onChange={(e) => onUpdatePaymentDetails(e.target.value)}
                placeholder="e.g. ලබන සතියේ සඳුදා ගෙවීමට පොරොන්දු විය"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation & Actions Bar (MANDATORY: ආපසු / Back button) */}
      <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2.5">
        {/* ආපසු (Back) Button - Prompted explicitly by user */}
        <button
          id="back-to-bill-btn"
          type="button"
          onClick={() => {
            soundFx.playBeep();
            onBackToBill();
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs border border-slate-300"
          title={settings.language === 'si' ? 'නැවත පෙර බිල්පත් ලැයිස්තුවට යන්න' : 'Return to bill'}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{settings.language === 'si' ? 'ආපසු (Back)' : 'Back'}</span>
        </button>

        {/* Action Buttons: Print Bill & Complete Bill */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            id="payment-print-receipt-btn"
            type="button"
            onClick={onPrintReceipt}
            disabled={itemCount === 0}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-40 shadow-xs"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">{t.printBill}</span>
          </button>

          <button
            id="confirm-payment-complete-btn"
            type="button"
            onClick={onCompleteSale}
            disabled={itemCount === 0 || (paymentMethod === 'cash' && isShortage)}
            className="flex-1 max-w-xs flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{settings.language === 'si' ? '✓ බිල අවසන් කරන්න' : '✓ Finish Bill'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
