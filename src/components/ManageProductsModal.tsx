import React, { useState, useRef } from 'react';
import { X, Plus, Edit2, Trash2, Check, RotateCcw, Package, Search, Download, Upload, Palette, FileText } from 'lucide-react';
import { ProductItem, StoreSettings } from '../types';
import { TRANSLATIONS, INITIAL_PRODUCTS } from '../utils/defaultData';
import { formatCurrency } from '../utils/currency';

interface ManageProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  settings: StoreSettings;
  onSaveProducts: (products: ProductItem[]) => void;
}

export const ManageProductsModal: React.FC<ManageProductsModalProps> = ({
  isOpen,
  onClose,
  products,
  settings,
  onSaveProducts,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[settings.language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productList, setProductList] = useState<ProductItem[]>(products);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // New item form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFormTab, setNewFormTab] = useState<'general' | 'variants'>('general');
  const [newNameSi, setNewNameSi] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('සාමාන්‍ය');
  const [newUnit, setNewUnit] = useState('pcs');
  const [newVariants, setNewVariants] = useState<string[]>(['', '', '', '', '']);

  // Edit item form state
  const [editFormTab, setEditFormTab] = useState<'general' | 'variants'>('general');
  const [editNameSi, setEditNameSi] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editVariants, setEditVariants] = useState<string[]>(['', '', '', '', '']);

  const startEdit = (p: ProductItem) => {
    setEditingId(p.id);
    setEditNameSi(p.nameSi);
    setEditNameEn(p.nameEn);
    setEditCode(p.code);
    setEditPrice(p.price.toString());
    setEditCategory(p.category);
    setEditUnit(p.unit);
    const existing = p.variants || [];
    setEditVariants([
      existing[0] || '',
      existing[1] || '',
      existing[2] || '',
      existing[3] || '',
      existing[4] || '',
    ]);
    setEditFormTab('general');
  };

  const saveEdit = (id: string) => {
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const cleanVariants = editVariants.map((v) => v.trim()).filter(Boolean);

    const updated = productList.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          code: editCode || p.code,
          nameSi: editNameSi || p.nameSi,
          nameEn: editNameEn || p.nameEn,
          price: priceNum,
          category: editCategory || p.category,
          unit: editUnit || p.unit,
          variants: cleanVariants.length > 0 ? cleanVariants : undefined,
        };
      }
      return p;
    });

    setProductList(updated);
    onSaveProducts(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = productList.filter((p) => p.id !== id);
    setProductList(updated);
    onSaveProducts(updated);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const cleanVariants = newVariants.map((v) => v.trim()).filter(Boolean);

    const newItem: ProductItem = {
      id: `prod-${Date.now()}`,
      code: newCode || (productList.length + 101).toString(),
      nameSi: newNameSi || newNameEn || 'භාණ්ඩය',
      nameEn: newNameEn || newNameSi || 'Item',
      price: priceNum,
      category: newCategory || 'සාමාන්‍ය',
      unit: newUnit || 'pcs',
      variants: cleanVariants.length > 0 ? cleanVariants : undefined,
    };

    const updated = [newItem, ...productList];
    setProductList(updated);
    onSaveProducts(updated);

    // Reset form
    setNewNameSi('');
    setNewNameEn('');
    setNewCode('');
    setNewPrice('');
    setNewVariants(['', '', '', '', '']);
    setNewFormTab('general');
    setIsAddingNew(false);
  };

  const handleExportProducts = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(productList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `products-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported) && imported.length > 0) {
          setProductList(imported);
          onSaveProducts(imported);
          alert(settings.language === 'si' ? 'භාණ්ඩ ලැයිස්තුව සාර්ථකව ඇතුලත් කරන ලදී!' : 'Products imported successfully!');
        } else {
          alert('Invalid file format');
        }
      } catch (err) {
        alert('Could not parse JSON file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm(settings.language === 'si' ? 'පෙරනිමි භාණ්ඩ ලැයිස්තුව නැවත ලබාගැනීමට අවශ්‍යද?' : 'Reset to default products list?')) {
      setProductList(INITIAL_PRODUCTS);
      onSaveProducts(INITIAL_PRODUCTS);
    }
  };

  const filtered = productList.filter((p) => {
    const q = searchFilter.toLowerCase();
    return (
      p.code.toLowerCase().includes(q) ||
      p.nameSi.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">{t.manageProducts}</h3>
              <p className="text-xs text-slate-400">
                {settings.language === 'si' ? 'භාණ්ඩවල මිල ගණන් කලින් ඇතුලත් කිරීම හා වෙනස් කිරීම' : 'Pre-configure product prices and information'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={settings.language === 'si' ? 'සොයන්න...' : 'Search items...'}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1"
              title={settings.language === 'si' ? 'ගොනුවකින් භාණ්ඩ ලැයිස්තුවක් ඇතුලත් කරන්න' : 'Import products from JSON'}
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{settings.language === 'si' ? 'Import (ඇතුලත්)' : 'Import'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportProducts}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1"
              title={settings.language === 'si' ? 'මිල ලැයිස්තුව Backup ගොනුවක් ලෙස බාගත කරන්න' : 'Export products as JSON'}
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{settings.language === 'si' ? 'Backup (බාගත)' : 'Export'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetDefaultItems}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewProduct}</span>
            </button>
          </div>
        </div>

        {/* New Item Form Drawer */}
        {isAddingNew && (
          <form
            onSubmit={handleCreateNew}
            className="p-4 bg-blue-50/80 border-b border-blue-200 space-y-3 animate-fadeIn text-xs"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>{t.addNewProduct}</span>
              </h4>

              {/* Sub-tabs: General Info vs Colors/Variants (5 slots) */}
              <div className="inline-flex rounded-lg bg-white p-0.5 border border-blue-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setNewFormTab('general')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    newFormTab === 'general'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>1. මූලික විස්තර (General)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewFormTab('variants')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    newFormTab === 'variants'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>2. වර්ණ / විශේෂතා (කොටු 5ක්)</span>
                  {newVariants.filter((v) => v.trim()).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {newVariants.filter((v) => v.trim()).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab 1: General Details */}
            {newFormTab === 'general' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">කේතය (Code)</label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="e.g. 115"
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">සිංහල නම (Sinhala Name) *</label>
                    <input
                      type="text"
                      required
                      value={newNameSi}
                      onChange={(e) => setNewNameSi(e.target.value)}
                      placeholder="e.g. බෝල්පොයින්ට් පෑන"
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">English Name</label>
                    <input
                      type="text"
                      value={newNameEn}
                      onChange={(e) => setNewNameEn(e.target.value)}
                      placeholder="e.g. Ballpoint Pen"
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">මිල / Price ({settings.currency}) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0.01"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded font-bold font-mono text-slate-900 text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">කාණ්ඩය (Category)</label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="වියළි ආහාර, සහල්, පාන..."
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ඒකකය (Unit)</label>
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded text-slate-900"
                    >
                      <option value="pcs">කෑලි (pcs)</option>
                      <option value="kg">කිලෝ (kg)</option>
                      <option value="g">ග්‍රෑම් (g)</option>
                      <option value="pkt">පැකට් (pkt)</option>
                      <option value="btl">බෝතල් (btl)</option>
                    </select>
                  </div>

                  <div className="col-span-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setNewFormTab('variants')}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-blue-100/60 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                    >
                      <span>වර්ණ හෝ විශේෂතා එක්කිරීමට (කොටු 5ක්) ➔</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Colors & Specifications (5 Separate Boxes as requested) */}
            {newFormTab === 'variants' && (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                  <div>
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-blue-600" />
                      <span>භාණ්ඩයේ වර්ණ හෝ විශේෂතා (වෙනම කොටු 5ක්)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      උදා: පෑන සඳහා නිල්, කළු, රතු, කොළ, කහ හෝ වෙනත් විශේෂතා 5ක් දක්වා වෙන වෙනම ඇතුලත් කරන්න.
                    </p>
                  </div>

                  {/* Quick Color Helper Buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">ක්ෂණික:</span>
                    {[
                      { label: 'නිල් පාට', color: 'bg-blue-600 text-white' },
                      { label: 'කළු පාට', color: 'bg-slate-900 text-white' },
                      { label: 'රතු පාට', color: 'bg-rose-600 text-white' },
                      { label: 'කොළ පාට', color: 'bg-emerald-600 text-white' },
                      { label: 'කහ පාට', color: 'bg-amber-400 text-slate-900' },
                      { label: 'සුදු පාට', color: 'bg-slate-100 text-slate-800 border border-slate-300' },
                    ].map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => {
                          // Place into first empty slot, or slot 0
                          const firstEmpty = newVariants.findIndex((v) => !v.trim());
                          const targetIdx = firstEmpty > -1 ? firstEmpty : 0;
                          const next = [...newVariants];
                          next[targetIdx] = c.label;
                          setNewVariants(next);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-transform active:scale-95 ${c.color}`}
                      >
                        + {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5 Input Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {newVariants.map((val, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="block text-slate-700 font-semibold text-[11px]">
                        කොටුව {idx + 1} {idx === 0 && <span className="text-blue-600">(ප්‍රධාන)</span>}
                      </label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => {
                          const next = [...newVariants];
                          next[idx] = e.target.value;
                          setNewVariants(next);
                        }}
                        placeholder={`විශේෂතාව ${idx + 1}`}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-blue-200">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{settings.language === 'si' ? 'ලැයිස්තුවට එක්කරන්න' : 'Add to Catalog'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Product Items Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 px-3 w-16">කේතය</th>
                <th className="py-2.5 px-3">භාණ්ඩයේ නම (සිංහල / English)</th>
                <th className="py-2.5 px-3 w-44">වර්ණ / විශේෂතා (5 Slots)</th>
                <th className="py-2.5 px-3 w-28">කාණ්ඩය</th>
                <th className="py-2.5 px-3 w-16 text-center">ඒකකය</th>
                <th className="py-2.5 px-3 w-28 text-right">මිල ({settings.currency})</th>
                <th className="py-2.5 px-3 w-24 text-center">ක්‍රියා</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/70 border-y-2 border-blue-300">
                      <td colSpan={7} className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                            <span className="font-bold text-blue-900 text-xs flex items-center gap-1">
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              භාණ්ඩය සංස්කරණය: {item.nameSi}
                            </span>
                            <div className="inline-flex rounded bg-white p-0.5 border border-blue-200">
                              <button
                                type="button"
                                onClick={() => setEditFormTab('general')}
                                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                  editFormTab === 'general' ? 'bg-blue-600 text-white' : 'text-slate-600'
                                }`}
                              >
                                මූලික විස්තර
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditFormTab('variants')}
                                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                  editFormTab === 'variants' ? 'bg-blue-600 text-white' : 'text-slate-600'
                                }`}
                              >
                                වර්ණ / විශේෂතා (කොටු 5)
                              </button>
                            </div>
                          </div>

                          {editFormTab === 'general' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                              <div>
                                <label className="block text-slate-600 text-[10px] font-semibold">කේතය</label>
                                <input
                                  type="text"
                                  value={editCode}
                                  onChange={(e) => setEditCode(e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-xs"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-slate-600 text-[10px] font-semibold">සිංහල නම</label>
                                <input
                                  type="text"
                                  value={editNameSi}
                                  onChange={(e) => setEditNameSi(e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-xs font-semibold"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-slate-600 text-[10px] font-semibold">English Name</label>
                                <input
                                  type="text"
                                  value={editNameEn}
                                  onChange={(e) => setEditNameEn(e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-blue-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-600 text-[10px] font-semibold">මිල ({settings.currency})</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-xs font-bold font-mono text-right"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 bg-white p-3 rounded-lg border border-blue-200">
                              <label className="block text-slate-700 font-semibold text-[11px]">
                                වර්ණ හෝ විශේෂතා සඳහා කොටු 5ක් (Colors / Specs):
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                {editVariants.map((val, vi) => (
                                  <div key={vi}>
                                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                                      කොටුව {vi + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={(e) => {
                                        const next = [...editVariants];
                                        next[vi] = e.target.value;
                                        setEditVariants(next);
                                      }}
                                      placeholder={`විශේෂතාව ${vi + 1}`}
                                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-100"
                            >
                              අවලංගු කරන්න
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEdit(item.id)}
                              className="px-4 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              තහවුරු කරන්න (Save)
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-500">
                      #{item.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{item.nameSi}</div>
                      {item.nameEn && (
                        <div className="text-[11px] text-slate-400">{item.nameEn}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.variants && item.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.variants.map((v, vi) => (
                            <span
                              key={vi}
                              className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-medium"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">නැත (None)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                      {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.price, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            {settings.language === 'si' ? 'ලියාපදිංචි භාණ්ඩ:' : 'Total items:'}{' '}
            <strong className="text-slate-800">{productList.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
