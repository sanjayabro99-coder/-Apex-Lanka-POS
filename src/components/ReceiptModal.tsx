import React, { useState, useEffect } from 'react';
import { Printer, X, Check, Store, MessageSquare } from 'lucide-react';
import { CartItem, StoreSettings, PaymentMethod } from '../types';
import { TRANSLATIONS } from '../utils/defaultData';
import { formatCurrency } from '../utils/currency';
import { generateWhatsAppBillMessage, openWhatsAppChat, WhatsAppBillData } from '../utils/whatsapp';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  cashReceived: number;
  changeGiven: number;
  billNumber: string;
  settings: StoreSettings;
  dateStr?: string;
  customerPhone?: string;
  customerName?: string;
  paymentMethod?: PaymentMethod;
  paymentDetails?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  discount,
  grandTotal,
  cashReceived,
  changeGiven,
  billNumber,
  settings,
  dateStr,
  customerPhone,
  customerName,
  paymentMethod = 'cash',
  paymentDetails = '',
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[settings.language];
  const formattedDate = dateStr || new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handlePrint = () => {
    window.print();
  };

  // Keyboard shortcut: Enter to Print, Escape to Close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handlePrint();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const billData: WhatsAppBillData = {
    billNumber,
    timestamp: dateStr ? new Date(dateStr).getTime() || Date.now() : Date.now(),
    items,
    totalAmount: grandTotal,
    cashReceived,
    changeGiven,
    discount,
    customerPhone,
    customerName,
    paymentMethod,
    paymentDetails,
  };

  const handleSendWhatsApp = () => {
    const msg = generateWhatsAppBillMessage(billData, settings);
    openWhatsAppChat(customerPhone || '', msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      {/* Container dialog */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 bg-slate-800 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">{t.receiptPreview}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[320px] bg-white p-5 rounded-md shadow-md text-slate-900 font-mono text-xs border border-slate-200"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-bold uppercase tracking-wide">
                {settings.language === 'si' ? settings.shopNameSi || settings.shopName : settings.shopName}
              </h2>
              {settings.billHeaderNote && (
                <p className="text-[11px] text-slate-600 mt-0.5">{settings.billHeaderNote}</p>
              )}
              {settings.address && (
                <p className="text-[10px] text-slate-500 mt-0.5">{settings.address}</p>
              )}
              {settings.phone && (
                <p className="text-[10px] text-slate-500">Tel: {settings.phone}</p>
              )}
            </div>

            {/* Bill Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Bill No:</span>
                <span className="font-bold">{billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{formattedDate}</span>
              </div>
              {customerPhone && (
                <div className="flex justify-between text-blue-900 font-semibold pt-0.5">
                  <span className="text-slate-500">Customer:</span>
                  <span>
                    {customerPhone} {customerName ? `(${customerName})` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-[11px] font-bold text-slate-700 pb-1 border-b border-slate-200">
                <span className="flex-1">Item</span>
                <span className="w-12 text-center">Qty</span>
                <span className="w-16 text-right">Total</span>
              </div>

              <div className="divide-y divide-slate-100 pt-1">
                {items.map((it) => (
                  <div key={it.id} className="py-1.5 flex justify-between text-[11px]">
                    <div className="flex-1 pr-1 truncate">
                      <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                        <span>{settings.language === 'si' ? it.nameSi || it.name : it.nameEn || it.name}</span>
                        {it.selectedVariant && (
                          <span className="text-[9px] bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-normal border border-slate-300">
                            {it.selectedVariant}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        @{formatCurrency(it.price, settings.currency)}
                      </div>
                    </div>
                    <div className="w-12 text-center text-slate-700 pt-0.5">
                      {it.quantity} {it.unit || ''}
                    </div>
                    <div className="w-16 text-right font-bold text-slate-900 pt-0.5">
                      {it.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span>{formatCurrency(subtotal, settings.currency)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Discount:</span>
                  <span>- {formatCurrency(discount, settings.currency)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span className="font-black text-slate-950">
                  {formatCurrency(grandTotal, settings.currency)}
                </span>
              </div>

              <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-100">
                <span className="text-slate-600">Method / ක්‍රමය:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {paymentMethod === 'card' 
                    ? 'Card (කාඩ්පත්)' 
                    : paymentMethod === 'qr' 
                      ? 'LankaQR' 
                      : paymentMethod === 'credit' 
                        ? 'Credit (ණය)' 
                        : 'Cash (මුදල්)'}
                </span>
              </div>

              {paymentDetails && (
                <div className="text-[10px] text-slate-500 italic text-right">
                  Ref/Note: {paymentDetails}
                </div>
              )}

              {paymentMethod !== 'credit' && (
                <>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-slate-600">Cash Received:</span>
                    <span className="font-bold">{formatCurrency(cashReceived, settings.currency)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-1 py-0.5 rounded">
                    <span>CHANGE / ඉතුරු:</span>
                    <span className="font-black">
                      {formatCurrency(changeGiven, settings.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Online Financial Transactions Bank Details */}
            <div className="pt-2 border-t border-dashed border-slate-300 text-left text-[10px] space-y-0.5 bg-slate-50 p-2 rounded border border-slate-200">
              <p className="font-bold text-slate-900 text-[10.5px]">For online financial transactions:</p>
              <p className="text-slate-700">Bank: <span className="font-semibold">{settings.bankName || 'Bank of Ceylon'}</span></p>
              <p className="text-slate-700">A/C Name: <span className="font-semibold">{settings.bankAccountName || 'R W G S BANDARA'}</span></p>
              <p className="text-slate-700">A/C No: <span className="font-bold font-mono text-slate-950">{settings.bankAccountNumber || '82276333'}</span></p>
              {settings.bankBranch && <p className="text-slate-700">Branch: <span>{settings.bankBranch}</span></p>}
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1.5">
              <p>{settings.billFooterNote}</p>
              <div className="pt-1.5 border-t border-slate-200">
                <p className="text-[11px] font-bold text-slate-800 tracking-wide">Powered By Apex Lanka Solution</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 print:hidden">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98"
            title="Send to Customer WhatsApp"
          >
            <MessageSquare className="w-4 h-4 fill-white/20" />
            <span>WhatsApp හරහා යවන්න (Send to WhatsApp)</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              {t.close}
            </button>
            <button
              id="modal-print-btn"
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printNow}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
