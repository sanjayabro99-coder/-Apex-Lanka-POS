import React, { useState, useEffect } from 'react';
import { Percent, Banknote, X } from 'lucide-react';
import { StoreSettings } from '../types';
import { formatCurrency } from '../utils/currency';
import { soundFx } from '../utils/audio';

interface DiscountTabsControlProps {
  subtotal: number;
  discount: number;
  onUpdateDiscount: (discount: number) => void;
  settings: StoreSettings;
  theme?: 'dark' | 'light';
}

export const DiscountTabsControl: React.FC<DiscountTabsControlProps> = ({
  subtotal,
  discount,
  onUpdateDiscount,
  settings,
  theme = 'dark',
}) => {
  const [activeDiscountTab, setActiveDiscountTab] = useState<'amount' | 'percent'>('amount');
  const [percentValue, setPercentValue] = useState<string>(() => {
    if (subtotal > 0 && discount > 0) {
      const calcPercent = (discount / subtotal) * 100;
      return calcPercent % 1 === 0 ? calcPercent.toFixed(0) : calcPercent.toFixed(1);
    }
    return '';
  });

  // Keep percentage input in sync when discount is changed externally or reset
  useEffect(() => {
    if (discount === 0) {
      setPercentValue('');
    } else if (subtotal > 0 && activeDiscountTab === 'amount') {
      const p = (discount / subtotal) * 100;
      setPercentValue(p % 1 === 0 ? p.toFixed(0) : p.toFixed(1));
    }
  }, [discount, subtotal, activeDiscountTab]);

  // Handle Tab Switch
  const handleTabChange = (tab: 'amount' | 'percent') => {
    soundFx.playBeep();
    setActiveDiscountTab(tab);
    if (tab === 'percent' && subtotal > 0) {
      if (discount > 0) {
        const p = (discount / subtotal) * 100;
        setPercentValue(p % 1 === 0 ? p.toFixed(0) : p.toFixed(1));
      }
    }
  };

  // Handle fixed amount change
  const handleAmountChange = (raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val) || val <= 0) {
      onUpdateDiscount(0);
      setPercentValue('');
    } else {
      const capped = Math.min(subtotal, Math.max(0, val));
      onUpdateDiscount(capped);
      if (subtotal > 0) {
        const p = (capped / subtotal) * 100;
        setPercentValue(p % 1 === 0 ? p.toFixed(0) : p.toFixed(1));
      }
    }
  };

  // Handle percentage change
  const handlePercentChange = (raw: string) => {
    setPercentValue(raw);
    const p = parseFloat(raw);
    if (isNaN(p) || p <= 0 || subtotal <= 0) {
      onUpdateDiscount(0);
    } else {
      const cappedP = Math.min(100, Math.max(0, p));
      const calculatedAmount = Number(((subtotal * cappedP) / 100).toFixed(2));
      onUpdateDiscount(calculatedAmount);
    }
  };

  // Preset chips
  const applyPresetAmount = (amt: number) => {
    soundFx.playBeep();
    const capped = Math.min(subtotal, amt);
    onUpdateDiscount(capped);
  };

  const applyPresetPercent = (pct: number) => {
    soundFx.playBeep();
    setPercentValue(pct.toString());
    const calculatedAmount = Number(((subtotal * pct) / 100).toFixed(2));
    onUpdateDiscount(calculatedAmount);
  };

  const handleClear = () => {
    soundFx.playBeep();
    onUpdateDiscount(0);
    setPercentValue('');
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-xl border p-3 transition-all animate-fadeIn ${
        isDark
          ? 'bg-slate-800/95 border-slate-700 text-slate-100'
          : 'bg-white border-slate-300 text-slate-900 shadow-sm'
      }`}
    >
      {/* 2 Tabs: වට්ටම් (රු:) සහ වට්ටම් (%) */}
      <div
        className={`flex p-1 rounded-lg mb-2.5 ${
          isDark ? 'bg-slate-900/90 border border-slate-700/60' : 'bg-slate-100 border border-slate-200'
        }`}
      >
        <button
          id="discount-tab-rs"
          type="button"
          onClick={() => handleTabChange('amount')}
          className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeDiscountTab === 'amount'
              ? 'bg-blue-600 text-white shadow-xs'
              : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>{settings.language === 'si' ? 'වට්ටම් (රු:)' : 'Discount (Rs.)'}</span>
        </button>

        <button
          id="discount-tab-percent"
          type="button"
          onClick={() => handleTabChange('percent')}
          className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeDiscountTab === 'percent'
              ? 'bg-blue-600 text-white shadow-xs'
              : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>{settings.language === 'si' ? 'වට්ටම් (%)' : 'Discount (%)'}</span>
        </button>
      </div>

      {/* Tab Content 1: Amount (Rs.) */}
      {activeDiscountTab === 'amount' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold shrink-0 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {settings.currency}:
            </span>
            <div className="relative flex-1">
              <input
                id="discount-amount-input"
                type="number"
                min="0"
                max={subtotal}
                step="any"
                value={discount > 0 ? discount : ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className={`w-full px-3 py-1.5 rounded-lg text-right font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-slate-900 text-white border border-slate-600 placeholder:text-slate-500'
                    : 'bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400'
                }`}
              />
            </div>
            {discount > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                title="වට්ටම ඉවත් කරන්න (Clear)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick presets for Rs. */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {[20, 50, 100, 200, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => applyPresetAmount(amt)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-all ${
                  discount === amt
                    ? 'bg-blue-600 text-white font-bold'
                    : isDark
                      ? 'bg-slate-700/80 hover:bg-slate-700 text-slate-300 border border-slate-600/60'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Percentage (%) */}
      {activeDiscountTab === 'percent' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold shrink-0 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              %:
            </span>
            <div className="relative flex-1">
              <input
                id="discount-percent-input"
                type="number"
                min="0"
                max="100"
                step="any"
                value={percentValue}
                onChange={(e) => handlePercentChange(e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-1.5 rounded-lg text-right font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-slate-900 text-white border border-slate-600 placeholder:text-slate-500'
                    : 'bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400'
                }`}
              />
            </div>
            {discount > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                title="වට්ටම ඉවත් කරන්න (Clear)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick presets for % */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {[5, 10, 15, 20, 25, 50].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => applyPresetPercent(pct)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-all ${
                  percentValue === pct.toString()
                    ? 'bg-blue-600 text-white font-bold'
                    : isDark
                      ? 'bg-slate-700/80 hover:bg-slate-700 text-slate-300 border border-slate-600/60'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live calculation info footer */}
      {discount > 0 && (
        <div
          className={`mt-2 pt-2 border-t flex items-center justify-between text-[11px] ${
            isDark ? 'border-slate-700/80 text-slate-300' : 'border-slate-200 text-slate-600'
          }`}
        >
          <span>
            {settings.language === 'si' ? 'අඩු කළ වට්ටම:' : 'Calculated Discount:'}
          </span>
          <div className="font-mono font-bold text-amber-400">
            - {formatCurrency(discount, settings.currency)}
            {subtotal > 0 && (
              <span className="ml-1 text-[10px] text-slate-400 font-normal">
                ({((discount / subtotal) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
