import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  RotateCcw,
  User,
  Phone,
  Edit2,
  Check,
  X,
  BookmarkPlus,
  Users,
  Search,
  CheckCircle2,
  FileText,
  Palette
} from 'lucide-react';
import { CartItem, StoreSettings, Customer } from '../types';
import { TRANSLATIONS } from '../utils/defaultData';
import { formatCurrency } from '../utils/currency';
import { soundFx } from '../utils/audio';

interface BillTableProps {
  items: CartItem[];
  settings: StoreSettings;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearBill: () => void;
  customerPhone: string;
  customerName: string;
  onUpdateCustomerPhone: (phone: string) => void;
  onUpdateCustomerName: (name: string) => void;
  savedCustomers?: Customer[];
  billNumber: string;
  onUpdateBillNumber: (newNumber: string) => void;
  onSaveCustomerDirectly: (phone: string, name: string) => void;
  onOpenCustomerModal?: () => void;
}

export const BillTable: React.FC<BillTableProps> = ({
  items,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onClearBill,
  customerPhone,
  customerName,
  onUpdateCustomerPhone,
  onUpdateCustomerName,
  savedCustomers = [],
  billNumber,
  onUpdateBillNumber,
  onSaveCustomerDirectly,
  onOpenCustomerModal,
}) => {
  const t = TRANSLATIONS[settings.language];
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerPickerSearch, setCustomerPickerSearch] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // In-line Bill Number Editing State
  const [isEditingBillNumber, setIsEditingBillNumber] = useState(false);
  const [tempBillNumber, setTempBillNumber] = useState(billNumber);

  const handleQtyChange = (id: string, delta: number, currentQty: number) => {
    const updated = Math.max(0.1, Number((currentQty + delta).toFixed(2)));
    onUpdateQuantity(id, updated);
  };

  const handleQtyInput = (id: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      onUpdateQuantity(id, num);
    }
  };

  const handleRemove = (id: string) => {
    soundFx.playRemove();
    onRemoveItem(id);
  };

  const handleClear = () => {
    if (items.length === 0) return;
    soundFx.playRemove();
    onClearBill();
  };

  // Bill Number save
  const handleSaveBillNumber = () => {
    if (tempBillNumber.trim()) {
      onUpdateBillNumber(tempBillNumber.trim());
      soundFx.playBeep();
    }
    setIsEditingBillNumber(false);
  };

  // Direct Save Customer button
  const handleQuickSaveCustomer = () => {
    if (!customerPhone.trim() && !customerName.trim()) return;
    onSaveCustomerDirectly(customerPhone.trim(), customerName.trim());
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Check if current phone/name is already a saved customer
  const existingCustomer = customerPhone.trim()
    ? savedCustomers.find((c) => c.phone === customerPhone.trim())
    : null;

  // Filter existing customers matching input
  const phoneSuggestions = customerPhone.trim()
    ? savedCustomers.filter(
        (c) =>
          c.phone.includes(customerPhone.trim()) ||
          c.name.toLowerCase().includes(customerPhone.toLowerCase().trim())
      ).slice(0, 5)
    : [];

  const handleSelectCustomer = (c: Customer) => {
    onUpdateCustomerPhone(c.phone);
    onUpdateCustomerName(c.name);
    setShowPhoneSuggestions(false);
    setShowCustomerPicker(false);
    soundFx.playBeep();
  };

  // Filter for Customer Picker Drawer
  const pickerFilteredCustomers = savedCustomers.filter((c) => {
    const q = customerPickerSearch.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Bill Table Top Header */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-sm">{t.currentBill}</h2>
              <span className="text-[11px] text-slate-500">
                ({items.length} {settings.language === 'si' ? 'වර්ග' : 'lines'} /{' '}
                {items.reduce((sum, item) => sum + item.quantity, 0).toFixed(1)}{' '}
                {settings.language === 'si' ? 'ඒකක' : 'qty'})
              </span>
            </div>
          </div>
        </div>

        {/* Bill Number Display & Quick Inline Editor */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-blue-200 rounded-lg px-2.5 py-1 shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] text-slate-500 font-medium">
              {settings.language === 'si' ? 'බිල්පත් අංකය:' : 'Bill No:'}
            </span>

            {isEditingBillNumber ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempBillNumber}
                  onChange={(e) => setTempBillNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBillNumber();
                    if (e.key === 'Escape') setIsEditingBillNumber(false);
                  }}
                  autoFocus
                  placeholder="e.g. INV-1001"
                  className="w-28 px-1.5 py-0.5 text-xs font-mono font-bold text-blue-800 bg-blue-50 border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleSaveBillNumber}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  title="Save Bill Number"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBillNumber(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTempBillNumber(billNumber);
                  setIsEditingBillNumber(true);
                }}
                className="flex items-center gap-1 text-xs font-mono font-bold text-blue-700 hover:text-blue-900 hover:bg-blue-50/80 px-1 py-0.5 rounded transition-colors group"
                title={settings.language === 'si' ? 'බිල්පත් අංකය වෙනස් කරන්න (Edit Bill Number)' : 'Click to Edit Bill Number'}
              >
                <span>{billNumber}</span>
                <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
              </button>
            )}
          </div>

          {items.length > 0 && (
            <button
              id="clear-bill-btn"
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors border border-transparent hover:border-rose-200 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.clearBill}</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Info Bar with Customer Tab / Quick Save */}
      <div className="px-3 py-2 bg-blue-50/60 border-b border-slate-200 text-xs">
        {/* Sub-bar: Customer Tabs & Actions */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            {/* Tab: Saved Customers Picker */}
            <button
              type="button"
              onClick={() => setShowCustomerPicker(!showCustomerPicker)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                showCustomerPicker
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{settings.language === 'si' ? 'නිතර එන අය (Saved Customers)' : 'My Customers'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono">
                {savedCustomers.length}
              </span>
            </button>

            {/* Quick Save Customer Button */}
            {(customerPhone.trim() || customerName.trim()) && (
              <button
                type="button"
                onClick={handleQuickSaveCustomer}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                title={settings.language === 'si' ? 'මෙම පාරිභෝගිකයා My Customers වෙත සුරකින්න' : 'Save customer for future bills'}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>{settings.language === 'si' ? 'Save Customer' : 'Save Customer'}</span>
              </button>
            )}

            {saveSuccessMsg && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md animate-fadeIn">
                <CheckCircle2 className="w-3 h-3" />
                <span>{settings.language === 'si' ? 'සුරැකිණි!' : 'Saved!'}</span>
              </span>
            )}
          </div>

          {existingCustomer && (
            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
              ⭐ {existingCustomer.name || 'Saved Customer'} ({existingCustomer.visitsCount || 1} {settings.language === 'si' ? 'වාර' : 'bills'})
            </span>
          )}
        </div>

        {/* Customer Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          {/* Phone / Customer WhatsApp Number */}
          <div className="sm:col-span-6 relative">
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  onUpdateCustomerPhone(e.target.value);
                  setShowPhoneSuggestions(true);
                }}
                onFocus={() => setShowPhoneSuggestions(true)}
                placeholder={settings.language === 'si' ? 'WhatsApp දුරකථන අංකය (උදා: 0771234567)' : 'Customer WhatsApp Phone'}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-blue-200 rounded-lg text-slate-900 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Suggestions dropdown while typing */}
            {showPhoneSuggestions && phoneSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                {phoneSuggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full text-left p-2 hover:bg-blue-50 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-slate-800 font-mono">{c.phone}</span>
                      {c.name && <span className="text-slate-600 ml-1.5 font-sans">({c.name})</span>}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {c.visitsCount} {settings.language === 'si' ? 'බිල්පත්' : 'bills'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer Name */}
          <div className="sm:col-span-6 relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => onUpdateCustomerName(e.target.value)}
              placeholder={settings.language === 'si' ? 'පාරිභෝගිකයාගේ නම (Customer Name)' : 'Customer Name (Optional)'}
              className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Quick Customer Picker Dropdown Popover */}
        {showCustomerPicker && (
          <div className="mt-2 p-2.5 bg-white border border-blue-300 rounded-xl shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="relative flex-1">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerPickerSearch}
                  onChange={(e) => setCustomerPickerSearch(e.target.value)}
                  placeholder={settings.language === 'si' ? 'සුරකින ලද පාරිභෝගිකයින් සොයන්න...' : 'Search saved customers...'}
                  className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerPicker(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 mt-1">
              {pickerFilteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  {savedCustomers.length === 0
                    ? (settings.language === 'si' ? 'තවමත් පාරිභෝගිකයන් සුරැකී නොමැත. අංකය සහ නම ලියා Save කරන්න.' : 'No saved customers yet. Type phone & name and click Save.')
                    : (settings.language === 'si' ? 'සොයන නම හමු නොවීය.' : 'No matching customers.')}
                </div>
              ) : (
                pickerFilteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full text-left p-2 hover:bg-blue-50 transition-colors flex items-center justify-between rounded-lg group"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-700">
                        {c.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{c.phone}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-[10px] bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-800 font-semibold px-2 py-0.5 rounded">
                        {c.visitsCount || 0} {settings.language === 'si' ? 'වාර' : 'bills'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto min-h-[220px]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 mb-3 stroke-1 text-slate-300 animate-pulse" />
            <p className="text-sm font-semibold text-slate-600">
              {settings.language === 'si' ? 'බිල හිස්ව පවතී' : 'Current Bill is Empty'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {t.emptyCart}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const displayName =
                settings.language === 'si'
                  ? item.nameSi || item.name
                  : item.nameEn || item.name;

              return (
                <div
                  key={item.id}
                  className="p-3 hover:bg-slate-50/80 transition-colors flex items-center gap-3"
                >
                  {/* Number indicator */}
                  <span className="w-5 text-center text-xs font-mono text-slate-400">
                    {index + 1}
                  </span>

                  {/* Name & Unit Price */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {displayName}
                      </h4>
                      {item.selectedVariant && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                          <Palette className="w-2.5 h-2.5" />
                          <span>{item.selectedVariant}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      <span>{formatCurrency(item.price, settings.currency)}</span>
                      {item.unit && <span className="text-slate-400"> / {item.unit}</span>}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, -1, item.quantity)}
                      className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs text-xs font-bold"
                      title="Decrease"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={item.quantity}
                      onChange={(e) => handleQtyInput(item.id, e.target.value)}
                      className="w-12 text-center bg-white border border-slate-300 rounded font-semibold text-xs text-slate-800 py-0.5"
                    />

                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, 1, item.quantity)}
                      className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs text-xs font-bold"
                      title="Increase"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="w-24 text-right">
                    <div className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                      {formatCurrency(item.total, settings.currency)}
                    </div>
                  </div>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title={settings.language === 'si' ? 'ඉවත් කරන්න' : 'Remove item'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
