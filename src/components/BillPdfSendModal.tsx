import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Phone,
  User,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Send,
  ExternalLink,
  Copy,
  Receipt
} from 'lucide-react';
import { StoreSettings, SaleRecord } from '../types';
import { formatCurrency } from '../utils/currency';
import {
  WhatsAppBillData,
  formatPhoneForWhatsApp,
  generateWhatsAppBillMessage,
  openWhatsAppChat
} from '../utils/whatsapp';
import { soundFx } from '../utils/audio';

interface BillPdfSendModalProps {
  isOpen: boolean;
  sale: SaleRecord | null;
  settings: StoreSettings;
  onClose: () => void;
  onYesSent?: () => void;
}

export const BillPdfSendModal: React.FC<BillPdfSendModalProps> = ({
  isOpen,
  sale,
  settings,
  onClose,
  onYesSent,
}) => {
  if (!isOpen || !sale) return null;

  const [phone, setPhone] = useState(sale.customerPhone || '');
  const [customerName, setCustomerName] = useState(sale.customerName || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const billData: WhatsAppBillData = {
    billNumber: sale.billNumber,
    timestamp: sale.timestamp,
    items: sale.items,
    totalAmount: sale.totalAmount,
    cashReceived: sale.cashReceived,
    changeGiven: sale.changeGiven,
    customerPhone: phone.trim() || undefined,
    customerName: customerName.trim() || undefined,
  };

  const formattedInternationalPhone = formatPhoneForWhatsApp(phone);
  const fullWhatsAppMessage = generateWhatsAppBillMessage(billData, settings);

  // Handle "Yes" - Open customer's chat directly in WhatsApp with bill ready
  const handleYes = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);
    soundFx.playSuccess();

    try {
      // Direct open targeted chat on WhatsApp
      openWhatsAppChat(phone, fullWhatsAppMessage);

      setSendSuccess(true);
      if (onYesSent) onYesSent();

      // Close modal after brief feedback
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Failed to open WhatsApp:', err);
      setIsProcessing(false);
    }
  }, [phone, fullWhatsAppMessage, isProcessing, onYesSent, onClose]);

  // Handle "No" - Do not send
  const handleNo = useCallback(() => {
    soundFx.playBeep();
    onClose();
  }, [onClose]);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [selectedAction, setSelectedAction] = useState<'yes' | 'no'>('yes');

  // Keyboard shortcut: Pressing Enter activates the WhatsApp send or selected action, Arrow keys switch!
  // "Bill WhatsApp Send කියන Tab එකත් Arow keys වැඩ කරන්න හදන්න"
  // "හැම වෙලාවෙන Enter බට්න් එක වැඩ කරන්න ඕනේ Mouse එකට අමතරව සහ Arow Keys 4ත් වැඩ කරන්න ඕනේ"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        if (isInput) activeEl.blur();
        setSelectedAction('no');
        soundFx.playBeep();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        if (isInput) activeEl.blur();
        setSelectedAction('yes');
        soundFx.playBeep();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        if (isInput) activeEl.blur();
        setSelectedAction((prev) => (prev === 'yes' ? 'no' : 'yes'));
        soundFx.playBeep();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        phoneInputRef.current?.focus();
        soundFx.playBeep();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedAction === 'no') {
          handleNo();
        } else {
          handleYes();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleNo();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleYes, handleNo, selectedAction]);

  // Copy message text helper
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(fullWhatsAppMessage);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col">
        {/* Modal Header: "Bill WhatsApp Send" */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
              <MessageSquare className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Bill WhatsApp Send</h2>
              <p className="text-xs text-emerald-100 font-medium">
                WhatsApp මඟින් බිල පාරිභෝගිකයාට යැවීමට විමසීම
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNo}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close / No"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-slate-800">
          {/* Bill Completion Success Notice */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-emerald-950 text-sm">
                බිල්පත සාර්ථකව අවසන් විය! (Bill Completed)
              </p>
              <p className="text-emerald-800">
                පහත අංකයට WhatsApp හරහා සෘජුවම බිල්පත යැවීමට සූදානම් කර ඇත.
              </p>
            </div>
          </div>

          {/* Customer Phone Input with Auto Chat Detection */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>කස්ටමර්ගේ WhatsApp අංකය (Customer WhatsApp):</span>
              </span>
              {formattedInternationalPhone ? (
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  +{formattedInternationalPhone}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">07XXXXXXXX හෝ 947XXXXXXXX</span>
              )}
            </label>

            <div className="relative">
              <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={phoneInputRef}
                id="whatsapp-phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selectedAction === 'no') {
                      handleNo();
                    } else {
                      handleYes();
                    }
                  }
                }}
                placeholder="උදා: 0771234567"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-emerald-300 focus:border-emerald-600 rounded-xl text-slate-900 font-mono text-base font-bold tracking-wide focus:ring-2 focus:ring-emerald-200 focus:outline-hidden shadow-2xs transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-500">
                {formattedInternationalPhone
                  ? `✓ WhatsApp විවෘත වූ පසු කෙලින්ම මෙම අංකයේ චැට් එකට බිල ඇතුලත් වේ.`
                  : `කස්ටමර්ගේ අංකය ඇතුලත් කරන්න. Contact එක Save කිරීම අවශ්‍ය නොවේ.`}
              </p>
            </div>
          </div>

          {/* Bill Summary Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
              <span className="text-slate-500 font-medium">බිල්පත් අංකය (Invoice):</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {sale.billNumber}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">භාණ්ඩ ප්‍රමාණය (Items):</span>
              <span className="font-semibold text-slate-700">
                {sale.items.length} වර්ග ({sale.items.reduce((acc, it) => acc + it.quantity, 0)} qty)
              </span>
            </div>

            <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-200">
              <span className="font-bold text-slate-700">මුළු මුදල (Total):</span>
              <span className="font-mono font-extrabold text-emerald-700 text-base">
                {formatCurrency(sale.totalAmount, settings.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>ගෙවූ මුදල: {formatCurrency(sale.cashReceived, settings.currency)}</span>
              <span className="text-blue-700 font-semibold">
                ඉතුරු: {formatCurrency(sale.changeGiven, settings.currency)}
              </span>
            </div>
          </div>

          {/* Prompt Question */}
          <div className="text-center pt-1">
            <p className="font-bold text-slate-900 text-sm">
              කස්ටමර්ගේ WhatsApp වෙත බිල යැවීමට ඔබ කැමතිද?
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              (Do you want to send this bill to Customer WhatsApp?)
            </p>
          </div>

          {/* Action Buttons: Yes / No */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* NO Button */}
            <button
              id="bill-pdf-send-no"
              type="button"
              onClick={handleNo}
              onMouseEnter={() => setSelectedAction('no')}
              disabled={isProcessing}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                selectedAction === 'no'
                  ? 'bg-slate-200 text-slate-900 ring-2 ring-slate-400 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>No (අවශ්‍ය නැත)</span>
            </button>

            {/* YES Button */}
            <button
              id="bill-pdf-send-yes"
              type="button"
              onClick={handleYes}
              onMouseEnter={() => setSelectedAction('yes')}
              disabled={isProcessing}
              className={`py-3 px-4 rounded-xl text-sm font-extrabold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                selectedAction === 'yes'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white ring-3 ring-emerald-400 border border-emerald-500'
                  : 'bg-emerald-700 text-white opacity-90'
              }`}
            >
              {sendSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                  <span>WhatsApp වෙත විවෘත විය!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Yes (යවන්න)</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Copy Bill Text helper if needed */}
          <div className="flex items-center justify-center pt-1">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedText ? 'බිලේ Text එක Copy විය!' : 'බිලේ Text එක Copy කරගන්න'}</span>
            </button>
          </div>
        </div>

        {/* MANDATORY FOOTER: Powered By Apex Lanka Solution */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-xs font-bold text-slate-700 tracking-wide flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Powered By Apex Lanka Solution</span>
          </p>
        </div>
      </div>
    </div>
  );
};
