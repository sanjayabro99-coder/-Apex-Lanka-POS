import React, { useState } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Save,
  Store,
  Phone,
  MapPin,
  Tag,
  Users,
  Search,
  UserPlus,
  Trash2,
  Edit2,
  Check,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  FileText,
  CreditCard,
  Palette
} from 'lucide-react';
import { StoreSettings, Customer } from '../types';
import { TRANSLATIONS } from '../utils/defaultData';
import { formatCurrency } from '../utils/currency';
import { formatPhoneForWhatsApp, openWhatsAppChat } from '../utils/whatsapp';
import { soundFx } from '../utils/audio';
import { BACKGROUND_THEMES, DEFAULT_THEME, getBackgroundTheme } from '../utils/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
  billCounter: number;
  onUpdateBillCounter: (counter: number) => void;
  initialTab?: 'settings' | 'customers' | 'background';
  onSelectCustomerForBill?: (customer: Customer) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  customers,
  onUpdateCustomers,
  billCounter,
  onUpdateBillCounter,
  initialTab = 'settings',
  onSelectCustomerForBill,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[settings.language];
  const [activeTab, setActiveTab] = useState<'settings' | 'customers' | 'background'>(initialTab);
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [editableCounter, setEditableCounter] = useState<number>(billCounter);

  // Customer Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [customerSuccessMsg, setCustomerSuccessMsg] = useState('');

  const handleSubmitSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    if (editableCounter !== billCounter && editableCounter > 0) {
      onUpdateBillCounter(editableCounter);
    }
    soundFx.playSuccess();
    onClose();
  };

  // Add Customer Handler
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerPhone.trim() && !newCustomerName.trim()) return;

    const phone = newCustomerPhone.trim();
    const name = newCustomerName.trim() || 'Customer';

    // Check if phone already exists
    if (phone && customers.some((c) => c.phone === phone)) {
      alert(
        settings.language === 'si'
          ? 'මෙම දුරකථන අංකය සහිත පාරිභෝගිකයෙකු දැනටමත් ලියාපදිංචිව ඇත.'
          : 'A customer with this phone number already exists.'
      );
      return;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      phone,
      name,
      totalSpent: 0,
      visitsCount: 0,
      lastVisit: Date.now(),
    };

    const updated = [newCust, ...customers];
    onUpdateCustomers(updated);
    soundFx.playSuccess();

    setNewCustomerName('');
    setNewCustomerPhone('');
    setCustomerSuccessMsg(
      settings.language === 'si'
        ? `✓ ${name} සාර්ථකව පාරිභෝගික ලැයිස්තුවට එක් විය!`
        : `✓ ${name} added to customer directory!`
    );
    setTimeout(() => setCustomerSuccessMsg(''), 3000);
  };

  // Start Edit Customer
  const handleStartEdit = (c: Customer) => {
    setEditingCustomerId(c.id);
    setEditName(c.name);
    setEditPhone(c.phone);
  };

  // Save Edit Customer
  const handleSaveEdit = (id: string) => {
    const updated = customers.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          name: editName.trim() || c.name,
          phone: editPhone.trim() || c.phone,
        };
      }
      return c;
    });
    onUpdateCustomers(updated);
    setEditingCustomerId(null);
    soundFx.playBeep();
  };

  // Delete Customer
  const handleDeleteCustomer = (id: string, name: string) => {
    const confirmMsg =
      settings.language === 'si'
        ? `"${name}" පාරිභෝගිකයා මකා දැමීමට ඔබට සහතිකද?`
        : `Are you sure you want to delete "${name}"?`;
    if (window.confirm(confirmMsg)) {
      onUpdateCustomers(customers.filter((c) => c.id !== id));
      soundFx.playRemove();
    }
  };

  // WhatsApp Customer
  const handleWhatsAppCustomer = (phone: string, name: string) => {
    const shop = settings.shopNameSi || settings.shopName || 'Retail Store';
    const text = `ආයුබෝවන් ${name}! ${shop} වෙතින් ඔබට සුබ දවසක් වේවා! ✨ (Powered By Apex Lanka Solution)`;
    openWhatsAppChat(phone, text);
  };

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const currentTheme = getBackgroundTheme(formData.backgroundColor);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${activeTab === 'background' ? 'bg-slate-900/35 backdrop-blur-[2px]' : 'bg-slate-900/70 backdrop-blur-xs'} animate-fadeIn transition-colors duration-200`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base">
              {settings.language === 'si' ? 'පද්ධති සැකසුම් සහ පාරිභෝගිකයින්' : 'Settings & Customers'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            id="tab-settings"
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-t border-x ${
              activeTab === 'settings'
                ? 'bg-white text-blue-600 border-slate-200 shadow-2xs font-extrabold'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>{settings.language === 'si' ? 'වෙළඳසැල් සැකසුම් (General Settings)' : 'General Settings'}</span>
          </button>

          <button
            id="tab-my-customers"
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-t border-x ${
              activeTab === 'customers'
                ? 'bg-white text-emerald-600 border-slate-200 shadow-2xs font-extrabold'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{settings.language === 'si' ? 'My Customers (පාරිභෝගික නාමාවලිය)' : 'My Customers'}</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
              {customers.length}
            </span>
          </button>

          <button
            id="tab-background-colour"
            type="button"
            onClick={() => setActiveTab('background')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-t border-x cursor-pointer ${
              activeTab === 'background'
                ? 'bg-white text-indigo-600 border-slate-200 shadow-2xs font-extrabold'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Background Colour</span>
          </button>
        </div>

        {/* TAB 1: GENERAL SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSubmitSettings} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
            {/* Shop Names */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>{settings.language === 'si' ? 'වෙළඳසැල් විස්තර' : 'Store Information'}</span>
              </h4>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {settings.language === 'si' ? 'වෙළඳසැලේ නම (සිංහල)' : 'Store Name (Sinhala)'}
                </label>
                <input
                  type="text"
                  value={formData.shopNameSi}
                  onChange={(e) => setFormData({ ...formData, shopNameSi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {settings.language === 'si' ? 'වෙළඳසැලේ නම (English)' : 'Store Name (English)'}
                </label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Contact Details & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{settings.language === 'si' ? 'දුරකථන අංකය' : 'Phone Number'}</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{settings.language === 'si' ? 'මුදල් ඒකකය (Currency)' : 'Currency'}</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="රු.">රු. (Sri Lankan Rupee)</option>
                  <option value="Rs.">Rs. (Rupees)</option>
                  <option value="LKR">LKR</option>
                  <option value="$">$ (USD)</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{settings.language === 'si' ? 'ලිපිනය' : 'Address'}</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Bill Number Counter Configuration */}
            <div className="pt-2 border-t border-slate-200">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{settings.language === 'si' ? 'බිල්පත් අංක සැකසුම (Invoice Counter)' : 'Invoice Counter'}</span>
              </h4>
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex items-center justify-between gap-4">
                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-0.5">
                    {settings.language === 'si' ? 'ඊළඟ බිල්පත් අංකය (Next Bill Counter)' : 'Next Bill Number Counter'}
                  </label>
                  <p className="text-[11px] text-slate-600">
                    {settings.language === 'si'
                      ? `දැනට ඊළඟ බිල නිර්මාණය වන්නේ INV-${editableCounter} ලෙසයි. ඔබට අවශ්‍ය නම් වෙනස් කරන්න.`
                      : `Next bill will be generated as INV-${editableCounter}. You can change starting number.`}
                  </p>
                </div>
                <div className="w-28 shrink-0">
                  <input
                    type="number"
                    min="1"
                    value={editableCounter}
                    onChange={(e) => setEditableCounter(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-center font-mono font-bold text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details for Online Financial Transactions */}
            <div className="pt-2 border-t border-slate-200">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>{settings.language === 'si' ? 'බැංකු ගිණුම් විස්තර (Online Financial Transactions)' : 'Bank Account Details'}</span>
              </h4>
              <p className="text-[11px] text-slate-500 mb-2.5">
                {settings.language === 'si'
                  ? 'WhatsApp හා මුද්‍රිත බිල්පත්වල "For online financial transactions" යටතේ පාරිභෝගිකයාට පෙන්වන ගිණුම් තොරතුරු:'
                  : 'Bank information displayed under "For online financial transactions" on WhatsApp and printed bills:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {settings.language === 'si' ? 'බැංකුවේ නම (Bank Name)' : 'Bank Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.bankName ?? 'Bank of Ceylon'}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Bank of Ceylon"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {settings.language === 'si' ? 'ගිණුමේ නම (A/C Name)' : 'Account Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountName ?? 'R W G S BANDARA'}
                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                    placeholder="R W G S BANDARA"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {settings.language === 'si' ? 'ගිණුම් අංකය (A/C No)' : 'Account Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber ?? '82276333'}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="82276333"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-slate-900 font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {settings.language === 'si' ? 'ශාඛාව (Branch - කැමති නම්)' : 'Branch (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.bankBranch ?? ''}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    placeholder="Colombo / Optional"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Receipt Notes */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {settings.language === 'si' ? 'බිල්පතේ ඉහළ පාඨය (Header Note)' : 'Bill Header Note'}
                </label>
                <input
                  type="text"
                  value={formData.billHeaderNote}
                  onChange={(e) => setFormData({ ...formData, billHeaderNote: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {settings.language === 'si' ? 'බිල්පතේ පහළ පාඨය (Footer Note)' : 'Bill Footer Note'}
                </label>
                <input
                  type="text"
                  value={formData.billFooterNote}
                  onChange={(e) => setFormData({ ...formData, billFooterNote: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-blue-600 mt-1 font-medium">
                  * සෑම බිල්පතකම (Print, WhatsApp) පහළින් <strong>Powered By Apex Lanka Solution</strong> ස්වයංක්‍රීයව සටහන් වේ.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold">
                Powered By Apex Lanka Solution
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.saveChanges}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: MY CUSTOMERS DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 flex flex-col">
            {/* Customer Add Form */}
            <form onSubmit={handleAddCustomer} className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
              <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>{settings.language === 'si' ? 'නිතර පැමිණෙන නව පාරිභෝගිකයෙකු සුරකින්න (+ Add Customer)' : 'Add New Customer'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {settings.language === 'si' ? 'පාරිභෝගිකයාගේ නම (Customer Name):' : 'Customer Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="උදා: කමල් පෙරේරා"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {settings.language === 'si' ? 'WhatsApp දුරකථන අංකය (WhatsApp Number):' : 'WhatsApp Number:'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="උදා: 0771234567"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-emerald-700">
                  {customerSuccessMsg || (settings.language === 'si' ? '* මෙහි සුරකින පාරිභෝගිකයන් බිල්පත් නිකුත් කිරීමේදී ක්ෂණිකව තෝරාගත හැක.' : '* Saved customers can be selected directly while billing.')}
                </span>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{settings.language === 'si' ? 'පාරිභෝගිකයා සුරකින්න (Save)' : 'Save Customer'}</span>
                </button>
              </div>
            </form>

            {/* Search Box & Customer Count */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={settings.language === 'si' ? 'නමින් හෝ WhatsApp අංකයෙන් සොයන්න...' : 'Search by name or WhatsApp...'}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="text-[11px] font-semibold text-slate-500 self-end sm:self-center">
                <span>{settings.language === 'si' ? 'මුළු පාරිභෝගිකයින්:' : 'Total Customers:'} </span>
                <span className="font-bold text-emerald-700 font-mono">{filteredCustomers.length}</span>
              </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 max-h-[340px]">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                  <p className="font-semibold text-slate-600">
                    {searchQuery
                      ? (settings.language === 'si' ? 'සොයන නම හෝ අංකය හමු නොවීය' : 'No matching customer found')
                      : (settings.language === 'si' ? 'තවමත් පාරිභෝගිකයින් සුරැකී නොමැත' : 'No customers saved yet')}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {settings.language === 'si'
                      ? 'ඉහත පෝරමයෙන් හෝ බිල්පතක් නිකුත් කරන අතරතුර නව පාරිභෝගිකයන් සුරැකිය හැක.'
                      : 'Add frequent customers above or save them directly when billing.'}
                  </p>
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const isEditing = editingCustomerId === c.id;

                  return (
                    <div
                      key={c.id}
                      className="p-3 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Customer Info / In-line Edit */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                          {c.name.charAt(0).toUpperCase() || 'C'}
                        </div>

                        {isEditing ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2 py-1 border border-blue-400 rounded text-xs"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="px-2 py-1 border border-blue-400 rounded font-mono text-xs"
                              placeholder="Phone"
                            />
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-900 text-xs truncate">{c.name}</h5>
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{c.phone}</span>
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-3 mt-0.5">
                              <span>
                                {settings.language === 'si' ? 'පැමිණි වාර:' : 'Visits:'}{' '}
                                <strong className="text-slate-700">{c.visitsCount || 0}</strong>
                              </span>
                              {c.totalSpent > 0 && (
                                <span>
                                  {settings.language === 'si' ? 'මිලදී ගැනීම්:' : 'Spent:'}{' '}
                                  <strong className="text-emerald-700 font-mono">
                                    {formatCurrency(c.totalSpent, settings.currency)}
                                  </strong>
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(c.id)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCustomerId(null)}
                              className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Select for bill if handler is passed */}
                            {onSelectCustomerForBill && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectCustomerForBill(c);
                                  onClose();
                                }}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold border border-blue-200 flex items-center gap-1 transition-colors"
                                title="බිල්පතට තෝරන්න"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>{settings.language === 'si' ? 'බිලට තෝරන්න' : 'Select'}</span>
                              </button>
                            )}

                            {/* Direct WhatsApp Chat */}
                            <button
                              type="button"
                              onClick={() => handleWhatsAppCustomer(c.phone, c.name)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                              title="WhatsApp හරහා පණිවිඩයක් යවන්න"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(c)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(c.id, c.name)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Powered By Apex Lanka Solution</span>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
              >
                {t.close}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: BACKGROUND COLOUR */}
        {activeTab === 'background' && (
          <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
            {/* Live Preview of Current Background */}
            <div
              style={{ backgroundColor: currentTheme.bgColor }}
              className="p-4 rounded-xl border-2 border-slate-300/80 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${currentTheme.previewBg} border-2 ${currentTheme.previewBorder} flex items-center justify-center text-white shadow-xs shrink-0`}
                >
                  <Palette className="w-5 h-5 drop-shadow-xs" />
                </div>
                <div>
                  <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>{settings.language === 'si' ? 'වත්මන් පසුබිම් වර්ණය:' : 'Active Background:'}</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/90 text-slate-900 border border-slate-300 font-extrabold shadow-2xs">
                      {currentTheme.name} ({currentTheme.nameSi})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                    {settings.language === 'si'
                      ? 'පහත වර්ණයක් මත ක්ලික් කළ සැනින් පද්ධතියේ පසුබිම ක්ෂණිකව මාරු වේ.'
                      : 'Clicking any color below immediately transforms the POS workspace background.'}
                  </div>
                </div>
              </div>

              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${currentTheme.accentBadge} shrink-0 text-center`}>
                {currentTheme.description}
              </div>
            </div>

            {/* Grid of Background Themes (Default + 6 Colors) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[DEFAULT_THEME, ...BACKGROUND_THEMES].map((theme) => {
                const isSelected =
                  (formData.backgroundColor || 'Default').toLowerCase() === theme.id.toLowerCase() ||
                  (formData.backgroundColor || 'Default').toLowerCase() === theme.name.toLowerCase();

                return (
                  <button
                    key={theme.id}
                    id={`theme-btn-${theme.id.toLowerCase()}`}
                    type="button"
                    onClick={() => {
                      const updated = { ...formData, backgroundColor: theme.id };
                      setFormData(updated);
                      onSaveSettings(updated);
                      document.body.style.backgroundColor = theme.bgColor;
                      soundFx.playBeep();
                    }}
                    style={{ backgroundColor: isSelected ? theme.bgColor : undefined }}
                    className={`relative p-3.5 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-2.5 cursor-pointer group ${
                      isSelected
                        ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/30 scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Color Swatch Circle */}
                    <div
                      className={`w-12 h-12 rounded-xl ${theme.previewBg} shadow-inner flex items-center justify-center border-2 ${theme.previewBorder} transition-transform group-hover:scale-105`}
                    >
                      <span className="text-white font-extrabold text-[11px] tracking-wider drop-shadow-xs">
                        {theme.name}
                      </span>
                    </div>

                    {/* Color Name in English & Sinhala */}
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        {theme.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {theme.nameSi}
                      </div>
                    </div>

                    {/* Color Strip Indicator */}
                    <div
                      style={{ backgroundColor: theme.bgColor }}
                      className="w-full h-2 rounded-full border border-slate-300/80 shadow-2xs"
                    />
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                id="reset-default-bg-btn"
                type="button"
                onClick={() => {
                  const updated = { ...formData, backgroundColor: 'Default' };
                  setFormData(updated);
                  onSaveSettings(updated);
                  document.body.style.backgroundColor = DEFAULT_THEME.bgColor;
                  soundFx.playBeep();
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
              >
                {settings.language === 'si' ? 'පෙරනිමි වර්ණය (Reset Default)' : 'Reset to Default'}
              </button>

              <button
                id="save-bg-color-btn"
                type="button"
                onClick={() => {
                  onSaveSettings(formData);
                  const theme = getBackgroundTheme(formData.backgroundColor);
                  document.body.style.backgroundColor = theme.bgColor;
                  soundFx.playSuccess();
                  onClose();
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{settings.language === 'si' ? 'වර්ණය සුරකින්න (Save)' : 'Save Colour'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
