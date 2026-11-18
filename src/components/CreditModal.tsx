import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Send,
  Calendar,
  Phone,
  User,
  DollarSign,
  ArrowRight,
  HandCoins,
  Receipt,
  FileText,
  Trash2
} from 'lucide-react';
import { CreditRecord, StoreSettings, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/currency';
import { soundFx } from '../utils/audio';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: CreditRecord[];
  onUpdateCredits?: (updated: CreditRecord[]) => void;
  onSaveCredits?: (updated: CreditRecord[]) => void;
  settings: StoreSettings;
  onRecordCreditPayment?: (
    creditId: string,
    amount: number,
    method: 'cash' | 'card' | 'qr',
    note?: string
  ) => void;
  onRecordPayment?: (
    creditId: string,
    amount: number,
    method: 'cash' | 'card' | 'qr',
    note?: string
  ) => void;
}

export const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  onClose,
  credits,
  onUpdateCredits,
  onSaveCredits,
  settings,
  onRecordCreditPayment,
  onRecordPayment,
}) => {
  const saveCredits = onUpdateCredits || onSaveCredits || (() => {});
  const recordPayment = onRecordCreditPayment || onRecordPayment || (() => {});

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending');

  // Currently paying credit record
  const [selectedCreditForPay, setSelectedCreditForPay] = useState<CreditRecord | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'qr'>('cash');
  const [payNote, setPayNote] = useState<string>('');
  const [autoRemoveSettled, setAutoRemoveSettled] = useState(true);

  // Manual new credit record form state
  const [isAddingNewCredit, setIsAddingNewCredit] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  if (!isOpen) return null;

  // Pending vs settled
  const pendingCredits = credits.filter((c) => c.status !== 'paid' && c.remainingAmount > 0);
  const settledCredits = credits.filter((c) => c.status === 'paid' || c.remainingAmount <= 0);

  // Filtered by search
  const displayedList = (activeTab === 'pending' ? pendingCredits : settledCredits).filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.customerName.toLowerCase().includes(q) ||
      (c.customerPhone && c.customerPhone.includes(q)) ||
      c.billNumber.toLowerCase().includes(q)
    );
  });

  // Summary Metrics
  const totalPendingCredit = pendingCredits.reduce((sum, c) => sum + c.remainingAmount, 0);
  const totalCollectedToday = credits.reduce((sum, c) => {
    const today = new Date().toDateString();
    const paymentsToday = (c.payments || [])
      .filter((p) => new Date(p.date).toDateString() === today)
      .reduce((pSum, p) => pSum + p.amount, 0);
    return sum + paymentsToday;
  }, 0);

  // Open pay drawer for a credit (supports percentage e.g. 50% or 100%)
  const handleOpenPay = (credit: CreditRecord, percent = 100) => {
    setSelectedCreditForPay(credit);
    if (percent === 50) {
      const half = Number((credit.remainingAmount / 2).toFixed(2));
      setPayAmountInput(half.toString());
    } else {
      setPayAmountInput(credit.remainingAmount.toString());
    }
    setPayMethod('cash');
    setPayNote('');
    soundFx.playBeep();
  };

  // Calculations for current payment in progress
  const parsedPayAmount = parseFloat(payAmountInput) || 0;
  const oldRemaining = selectedCreditForPay ? selectedCreditForPay.remainingAmount : 0;
  const newRemainingAfterPay = Math.max(0, Number((oldRemaining - parsedPayAmount).toFixed(2)));
  const isFullSettlement = selectedCreditForPay ? parsedPayAmount >= selectedCreditForPay.remainingAmount : false;

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreditForPay || parsedPayAmount <= 0) return;

    soundFx.playSuccess();
    recordPayment(
      selectedCreditForPay.id,
      parsedPayAmount,
      payMethod,
      payNote.trim() || undefined
    );

    // If fully settled and autoRemoveSettled is true, immediately remove from credit list
    if (isFullSettlement && autoRemoveSettled) {
      saveCredits(credits.filter((c) => c.id !== selectedCreditForPay.id));
    }

    setSelectedCreditForPay(null);
    setPayAmountInput('');
  };

  // Create manual credit record
  const handleCreateManualCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (!newCustName.trim() || isNaN(amt) || amt <= 0) return;

    const dateTs = new Date(newDate).getTime() || Date.now();
    const newRecord: CreditRecord = {
      id: `credit-${Date.now()}`,
      customerName: newCustName.trim(),
      customerPhone: newCustPhone.trim() || undefined,
      originalAmount: amt,
      remainingAmount: amt,
      paidAmount: 0,
      initialDate: dateTs,
      lastUpdatedDate: dateTs,
      billNumber: `CR-${Date.now().toString().slice(-4)}`,
      itemsSummary: newNote.trim() || undefined,
      status: 'pending',
      payments: [],
    };

    soundFx.playSuccess();
    saveCredits([newRecord, ...credits]);

    // Reset
    setNewCustName('');
    setNewCustPhone('');
    setNewAmount('');
    setNewNote('');
    setIsAddingNewCredit(false);
  };

  // Delete credit record
  const handleDeleteCredit = (id: string) => {
    if (window.confirm(settings.language === 'si' ? 'මෙම ණය සටහන ලැයිස්තුවෙන් ඉවත් කිරීමට අවශ්‍යද?' : 'Remove this credit record from list?')) {
      saveCredits(credits.filter((c) => c.id !== id));
      if (selectedCreditForPay?.id === id) {
        setSelectedCreditForPay(null);
      }
    }
  };

  // Clear all settled debts
  const handleClearAllSettled = () => {
    if (window.confirm(settings.language === 'si' ? 'පියවා නිමකළ සියලුම ණය සටහන් ලැයිස්තුවෙන් ඉවත් කිරීමට අවශ්‍යද?' : 'Remove all settled records from list?')) {
      saveCredits(credits.filter((c) => c.status !== 'paid' && c.remainingAmount > 0));
    }
  };

  // WhatsApp receipt for credit payment
  const handleSendWhatsAppReceipt = (credit: CreditRecord, lastPaidAmount: number, remaining: number) => {
    if (!credit.customerPhone) {
      alert(settings.language === 'si' ? 'පාරිභෝගිකයාගේ දුරකථන අංකයක් සටහන් කර නොමැත!' : 'No phone number available!');
      return;
    }
    const cleanPhone = credit.customerPhone.replace(/\D/g, '');
    const todayStr = new Date().toISOString().slice(0, 10);
    const msg = `*${settings.shopName} - ණය පියවීමේ රිසිට්පත*\n\n` +
      `ගරු *${credit.customerName}*,\n` +
      `දිනය: ${todayStr}\n` +
      `බිල්පත් අංකය: ${credit.billNumber}\n` +
      `---------------------------\n` +
      `අද දින ගෙවූ මුදල: *${settings.currency} ${lastPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}*\n` +
      `ඉතිරි ණය මුදල: *${settings.currency} ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}*\n` +
      `---------------------------\n` +
      `${remaining === 0 ? '🎉 ඔබගේ ණය මුදල සම්පූර්ණයෙන්ම පියවා නිම කරන ලදී! ස්තූතියි!' : 'ස්තූතියි! නැවත පැමිණෙන්න.'}\n` +
      `දුරකථන: ${settings.phone}`;

    window.open(`https://wa.me/${cleanPhone.startsWith('94') ? cleanPhone : '94' + cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Format date helper: YYYY.MM.DD
  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}.${m}.${day}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-400/30">
              <HandCoins className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  {settings.language === 'si' ? 'Credit - ණය කළමනාකරණය' : 'Credit Accounts & Settlements'}
                </h2>
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full font-mono">
                  {pendingCredits.length} {settings.language === 'si' ? 'නොගෙවූ' : 'Pending'}
                </span>
              </div>
              <p className="text-xs text-amber-100/80">
                {settings.language === 'si'
                  ? 'ණයට දුන් මුදල් පියවීම සහ පාරිභෝගික ණය සටහන්'
                  : 'Track and settle customer credits and payment collections'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Summary Ribbon */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 bg-amber-50/50 border-b border-amber-200/80 text-center py-2.5 px-3">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              {settings.language === 'si' ? 'මුළු නොගෙවූ ණය' : 'Total Pending Credit'}
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-amber-800">
              {formatCurrency(totalPendingCredit, settings.currency)}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              {settings.language === 'si' ? 'ණය හිමි පාරිභෝගිකයින්' : 'Credit Customers'}
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-slate-800">
              {pendingCredits.length} {settings.language === 'si' ? 'දෙනෙක්' : 'persons'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              {settings.language === 'si' ? 'අද දින එකතු වූ ණය මුදල්' : 'Collected Today'}
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-emerald-700">
              {formatCurrency(totalCollectedToday, settings.currency)}
            </span>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={settings.language === 'si' ? 'නම, දුරකථන අංකය හෝ බිල්පත් අංකය අනුව සොයන්න...' : 'Search by name, phone or bill #...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Tab switch: Pending vs Settled */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('pending');
                    setSelectedCreditForPay(null);
                  }}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {settings.language === 'si' ? 'පියවීමට ඇති (Pending)' : 'Pending'} ({pendingCredits.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settled');
                    setSelectedCreditForPay(null);
                  }}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'settled'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {settings.language === 'si' ? 'පියවා නිමකළ (Settled)' : 'Settled'} ({settledCredits.length})
                </button>
              </div>

              {activeTab === 'settled' && settledCredits.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSettled}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="පියවා නිමකළ සියලු ණය ලැයිස්තුවෙන් ඉවත් කරන්න"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{settings.language === 'si' ? 'පියවූ ණය ඉවත් කරන්න' : 'Clear Settled'}</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingNewCredit(!isAddingNewCredit)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{settings.language === 'si' ? '+ අතින් ණය සටහනක් එක්කරන්න' : '+ Add Credit Entry'}</span>
          </button>
        </div>

        {/* Manual Add Credit Panel (Collapsible) */}
        {isAddingNewCredit && (
          <form
            onSubmit={handleCreateManualCredit}
            className="p-3 bg-amber-50/90 border-b border-amber-200 animate-fadeIn space-y-2.5 text-xs"
          >
            <div className="font-bold text-amber-900 flex items-center justify-between">
              <span>{settings.language === 'si' ? 'නව ණය සටහනක් ඇතුලත් කිරීම' : 'Record New Customer Credit'}</span>
              <button
                type="button"
                onClick={() => setIsAddingNewCredit(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {settings.language === 'si' ? 'පාරිභෝගික නම *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="උදා: නිමල්"
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {settings.language === 'si' ? 'දුරකථන අංකය' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="077xxxxxxx"
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {settings.language === 'si' ? 'ණය මුදල (රු.) *' : 'Credit Amount *'}
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="3500.00"
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-amber-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {settings.language === 'si' ? 'දිනය' : 'Date'}
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={settings.language === 'si' ? 'විස්තරය හෝ භාණ්ඩ (අවශ්‍ය නම්)' : 'Note or item details (Optional)'}
                className="flex-1 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
              >
                {settings.language === 'si' ? 'සුරකින්න (Save)' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Active Payment Drawer (When "Pay" button clicked on any record) */}
          {selectedCreditForPay && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl shadow-md animate-fadeIn mb-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    Pay
                  </span>
                  <div>
                    <h3 className="font-bold text-emerald-950 text-sm sm:text-base">
                      {settings.language === 'si' ? 'ණය මුදල පියවීම (Credit Settlement)' : 'Credit Settlement'}
                    </h3>
                    <p className="text-xs text-emerald-800">
                      {settings.language === 'si' ? 'පාරිභෝගිකයා:' : 'Customer:'}{' '}
                      <strong className="text-emerald-950">{selectedCreditForPay.customerName}</strong>
                      {selectedCreditForPay.customerPhone && (
                        <span className="ml-1 text-emerald-700 font-mono">({selectedCreditForPay.customerPhone})</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCreditForPay(null)}
                  className="text-emerald-700 hover:text-emerald-950 p-1 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Credit Status Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-emerald-200 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">
                    {settings.language === 'si' ? 'ණය ගත් දිනය' : 'Date Taken'}:
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatDate(selectedCreditForPay.initialDate)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">
                    {settings.language === 'si' ? 'මුල් ණය මුදල' : 'Original Debt'}:
                  </span>
                  <span className="font-mono font-bold text-slate-700">
                    {formatCurrency(selectedCreditForPay.originalAmount, settings.currency)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">
                    {settings.language === 'si' ? 'පරණ ණය මුදල' : 'Old Debt'}:
                  </span>
                  <span className="font-mono font-black text-rose-700 text-sm">
                    {formatCurrency(selectedCreditForPay.remainingAmount, settings.currency)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">
                    {settings.language === 'si' ? 'බිල්පත් අංකය' : 'Bill #'}:
                  </span>
                  <span className="font-mono text-slate-600">
                    {selectedCreditForPay.billNumber}
                  </span>
                </div>
              </div>

              {/* Pay Input Form as requested: "පහලින් අද දින ගෙවන මුදල ලෙස Tab එකක් නිර්මාණය කර..." */}
              <form onSubmit={handleConfirmPayment} className="space-y-3">
                <div className="bg-white p-3.5 rounded-xl border-2 border-emerald-400 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>{settings.language === 'si' ? 'අද දින ගෙවන මුදල' : 'Amount Paying Today'}:</span>
                    </label>

                    {/* Quick Half and Full Pay Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const half = Number((selectedCreditForPay.remainingAmount / 2).toFixed(2));
                          setPayAmountInput(half.toString());
                        }}
                        className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-amber-300 shadow-2xs"
                      >
                        {settings.language === 'si' ? '🟡 අඩක් ගෙවන්න (50% Half)' : 'Half Pay (50%)'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayAmountInput(selectedCreditForPay.remainingAmount.toString())}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-emerald-300 shadow-2xs"
                      >
                        {settings.language === 'si' ? '🟢 සම්පූර්ණ මුදල (100% Full)' : 'Full Pay (100%)'}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-base">
                      {settings.currency}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max={selectedCreditForPay.remainingAmount}
                      required
                      value={payAmountInput}
                      onChange={(e) => setPayAmountInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-2.5 text-base sm:text-lg font-mono font-black text-emerald-900 bg-emerald-50/50 border border-emerald-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      autoFocus
                    />
                  </div>

                  {/* Percentage Quick Chips & Presets */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500">{settings.language === 'si' ? 'ප්‍රතිශත:' : 'Percentages:'}</span>
                      {[
                        { label: '25%', factor: 0.25 },
                        { label: '50% (අඩක්)', factor: 0.5 },
                        { label: '75%', factor: 0.75 },
                        { label: '100% (සම්පූර්ණ)', factor: 1.0 },
                      ].map((pct) => (
                        <button
                          key={pct.label}
                          type="button"
                          onClick={() => {
                            const val = Number((selectedCreditForPay.remainingAmount * pct.factor).toFixed(2));
                            setPayAmountInput(val.toString());
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-md font-mono text-[11px] font-bold transition-colors cursor-pointer border border-slate-200"
                        >
                          {pct.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-medium">{settings.language === 'si' ? 'ස්ථාවර:' : 'Fixed:'}</span>
                      {[500, 1000, 2000, 5000].filter(val => val <= selectedCreditForPay.remainingAmount).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPayAmountInput(preset.toString())}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded font-mono text-[11px] font-bold transition-colors cursor-pointer border border-slate-200"
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Calculation breakdown: "අපි ගෙවන මුදලින් පරණ ණය මුදල අඩු වී ඉතුරු මුදල අද දිනය සමග සටහන් වේ" */}
                <div className="p-3 bg-white rounded-xl border border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-600">
                      {settings.language === 'si' ? 'පරණ ණය මුදල' : 'Old Debt'}:{' '}
                      <strong className="font-mono text-slate-900">{formatCurrency(oldRemaining, settings.currency)}</strong>
                    </span>
                    <span className="text-slate-400">-</span>
                    <span className="text-emerald-700 font-bold">
                      {settings.language === 'si' ? 'ගෙවන මුදල' : 'Paying'}:{' '}
                      <strong className="font-mono text-emerald-800">{formatCurrency(parsedPayAmount, settings.currency)}</strong>
                    </span>
                    <span className="text-slate-400">=</span>
                    <span className="font-black text-slate-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      {settings.language === 'si' ? 'ඉතුරු මුදල' : 'Remaining'}:{' '}
                      <span className="font-mono text-amber-900 font-black">{formatCurrency(newRemainingAfterPay, settings.currency)}</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    <span>{settings.language === 'si' ? 'දිනය' : 'Date'}: </span>
                    <strong className="text-slate-800">{formatDate(Date.now())} (අද)</strong>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">
                      {settings.language === 'si' ? 'මුදල් ලැබුණු ක්‍රමය:' : 'Received via:'}
                    </span>
                    <div className="flex bg-white p-0.5 rounded-lg border border-slate-300 text-xs">
                      <button
                        type="button"
                        onClick={() => setPayMethod('cash')}
                        className={`px-3 py-1 rounded font-bold cursor-pointer transition-colors ${
                          payMethod === 'cash' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        💵 Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayMethod('card')}
                        className={`px-3 py-1 rounded font-bold cursor-pointer transition-colors ${
                          payMethod === 'card' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        💳 Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayMethod('qr')}
                        className={`px-3 py-1 rounded font-bold cursor-pointer transition-colors ${
                          payMethod === 'qr' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        📱 QR
                      </button>
                    </div>
                  </div>

                  {/* Auto-remove checkbox option */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoRemoveSettled}
                      onChange={(e) => setAutoRemoveSettled(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>
                      {settings.language === 'si'
                        ? 'ණය සම්පූර්ණයෙන් පියවූ පසු ලැයිස්තුවෙන් ඉවත් කරන්න'
                        : 'Remove from list once settled'}
                    </span>
                  </label>
                </div>

                {/* Confirm Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCreditForPay(null)}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {settings.language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={parsedPayAmount <= 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isFullSettlement
                        ? (settings.language === 'si' ? 'සම්පූර්ණයෙන්ම පියවා නිමකරන්න' : 'Settle Full Debt')
                        : (settings.language === 'si' ? 'ගෙවීම තහවුරු කරන්න' : 'Confirm Payment')}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Credits */}
          {displayedList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-medium">
                {activeTab === 'pending'
                  ? (settings.language === 'si' ? 'පියවීමට කිසිදු ණය මුදලක් නොමැත!' : 'No pending credits!')
                  : (settings.language === 'si' ? 'පියවා නිමකළ ණය සටහන් නොමැත.' : 'No settled credit history.')}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedList.map((credit) => {
                const isSelected = selectedCreditForPay?.id === credit.id;
                const isSettled = credit.status === 'paid' || credit.remainingAmount <= 0;

                return (
                  <div
                    key={credit.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/20'
                        : isSettled
                          ? 'border-slate-200 bg-slate-50/60 opacity-80'
                          : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Left: Customer Info & Dates */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-700" />
                          <span>{credit.customerName}</span>
                        </span>

                        {credit.customerPhone && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{credit.customerPhone}</span>
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{credit.billNumber}
                        </span>

                        {isSettled && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ✓ {settings.language === 'si' ? 'පියවා නිමකළා' : 'Fully Settled'}
                          </span>
                        )}
                      </div>

                      {/* Date details */}
                      <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {settings.language === 'si' ? 'ණය ගත් දිනය:' : 'Credit Date:'}{' '}
                            <strong className="text-slate-700 font-mono">{formatDate(credit.initialDate)}</strong>
                          </span>
                        </span>

                        {credit.lastUpdatedDate !== credit.initialDate && (
                          <span className="text-[11px] text-emerald-700 font-mono">
                            ({settings.language === 'si' ? 'අවසන් ගෙවීම:' : 'Last paid:'} {formatDate(credit.lastUpdatedDate)})
                          </span>
                        )}

                        {credit.itemsSummary && (
                          <span className="text-[11px] text-slate-400 truncate max-w-xs" title={credit.itemsSummary}>
                            • {credit.itemsSummary}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Amounts & Green Pay Button as requested:
                        "ඊට ඉදිරියෙන් Pay ලෙස සටහන් කල Tab එකක් හදන්න කොළ පාටින්. එක click කල විට අදල ණය මුදල දිස් වේ" */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Amount pill */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">
                          {settings.language === 'si' ? 'ගෙවීමට ඇති ණය' : 'Pending Debt'}:
                        </span>
                        <div className="font-mono font-black text-sm sm:text-base text-amber-800">
                          {formatCurrency(credit.remainingAmount, settings.currency)}
                        </div>
                        {credit.paidAmount > 0 && (
                          <span className="text-[10px] text-emerald-600 block font-mono">
                            {settings.language === 'si' ? 'ගෙවා ඇති:' : 'Paid:'} {formatCurrency(credit.paidAmount, settings.currency)}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      {!isSettled ? (
                        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                          {/* Green Pay Button (Full / Custom) */}
                          <button
                            type="button"
                            onClick={() => handleOpenPay(credit, 100)}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            title="ගෙවීමක් සිදුකරන්න"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>

                          {/* Quick Pay Half (50%) Button as requested: "අඩක් පමණක් ගෙවීමට හැකියාවක්ද නිර්මාණය කර නැත" */}
                          <button
                            type="button"
                            onClick={() => handleOpenPay(credit, 50)}
                            className="px-2.5 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            title="ණයෙන් අඩක් (50%) ක්ෂණිකව ගෙවන්න"
                          >
                            <span>අඩක් (50%)</span>
                          </button>

                          {/* Delete debtor button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCredit(credit.id)}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={settings.language === 'si' ? 'මෙම ණයගැතියා ලැයිස්තුවෙන් ඉවත් කරන්න' : 'Remove debtor from list'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {credit.customerPhone && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppReceipt(credit, credit.paidAmount, 0)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Send WhatsApp Receipt"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCredit(credit.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">
              {settings.language === 'si' ? 'මුළු ණය සටහන්:' : 'Total Records:'}{' '}
              <strong className="text-slate-800">{credits.length}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            {settings.language === 'si' ? 'වසන්න (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
