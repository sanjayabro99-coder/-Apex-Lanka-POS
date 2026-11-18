import React, { useState } from 'react';
import { X, History, Printer, Trash2, Calendar, ShoppingBag, Search, Phone, User, MessageSquare, Sparkles } from 'lucide-react';
import { SaleRecord, StoreSettings } from '../types';
import { TRANSLATIONS } from '../utils/defaultData';
import { formatCurrency } from '../utils/currency';
import { generateWhatsAppBillMessage, openWhatsAppChat } from '../utils/whatsapp';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleRecord[];
  settings: StoreSettings;
  onReprint: (sale: SaleRecord) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  sales,
  settings,
  onReprint,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[settings.language];
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(sales[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSales = sales.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.billNumber.toLowerCase().includes(q) ||
      (s.customerPhone && s.customerPhone.toLowerCase().includes(q)) ||
      (s.customerName && s.customerName.toLowerCase().includes(q))
    );
  });

  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">{t.salesHistory}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip & Search */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500 mr-1.5">{t.billsCount}:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{sales.length}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1.5">{t.todayTotal}:</span>
              <span className="font-bold text-emerald-600 font-mono text-sm">
                {formatCurrency(totalRevenue, settings.currency)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={settings.language === 'si' ? 'දුරකථන / බිල් අංකය...' : 'Search Phone / Bill...'}
                className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {sales.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{settings.language === 'si' ? 'ඉතිහාසය මකන්න' : 'Clear History'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content: Master / Detail */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[350px]">
          {/* Left: List of Sales */}
          <div className="md:col-span-6 border-r border-slate-200 overflow-y-auto divide-y divide-slate-100">
            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 stroke-1 text-slate-300" />
                <p>{settings.language === 'si' ? 'කිසිදු වාර්තාවක් හමු නොවීය' : 'No sales records found'}</p>
              </div>
            ) : (
              filteredSales.map((sale) => {
                const isSelected = selectedSale?.id === sale.id;
                const time = new Date(sale.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {sale.billNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {time}
                        </span>
                      </div>

                      {sale.customerPhone && (
                        <div className="text-[11px] text-blue-700 font-mono font-medium flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{sale.customerPhone}</span>
                          {sale.customerName && <span className="text-slate-600 font-sans">({sale.customerName})</span>}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {sale.items.length} {settings.language === 'si' ? 'භාණ්ඩ වර්ග' : 'items'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                        {formatCurrency(sale.totalAmount, settings.currency)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-mono">
                        {settings.language === 'si' ? 'ඉතුරු' : 'Chg'}: {formatCurrency(sale.changeGiven, settings.currency)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Selected Sale Breakdown & Actions */}
          <div className="md:col-span-6 p-4 overflow-y-auto bg-slate-50/50 flex flex-col justify-between">
            {selectedSale ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 font-mono">
                      {selectedSale.billNumber}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {new Date(selectedSale.timestamp).toLocaleString()}
                    </p>
                    {selectedSale.customerPhone && (
                      <div className="mt-1 text-xs text-blue-900 font-semibold flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        <Phone className="w-3 h-3 text-blue-600" />
                        <span>පාරිභෝගික: {selectedSale.customerPhone}</span>
                        {selectedSale.customerName && <span>({selectedSale.customerName})</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = generateWhatsAppBillMessage(selectedSale, settings);
                        openWhatsAppChat(selectedSale.customerPhone || '', msg);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-2xs transition-colors"
                      title="Send to Customer WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onReprint(selectedSale)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{settings.language === 'si' ? 'මුද්‍රණය' : 'Print'}</span>
                    </button>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-1.5 text-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">
                    {settings.language === 'si' ? 'භාණ්ඩ ලැයිස්තුව' : 'Items'}
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {selectedSale.items.map((it) => (
                      <div key={it.id} className="py-1.5 flex justify-between text-xs">
                        <div className="truncate max-w-[170px]">
                          <span className="font-semibold text-slate-800">
                            {settings.language === 'si' ? it.nameSi || it.name : it.nameEn || it.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            @{it.price} × {it.quantity} {it.unit}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(it.total, settings.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>{t.grandTotal}:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(selectedSale.totalAmount, settings.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t.cashReceived}:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(selectedSale.cashReceived, settings.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 text-emerald-600 font-bold">
                    <span>{t.changeReturn}:</span>
                    <span>{formatCurrency(selectedSale.changeGiven, settings.currency)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                {settings.language === 'si' ? 'විස්තර බැලීමට බිල්පතක් තෝරන්න' : 'Select a bill to view details'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Powered By Apex Lanka Solution</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
