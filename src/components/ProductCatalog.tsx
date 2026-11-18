import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, Sparkles, Tag, PlusCircle, Palette } from 'lucide-react';
import { ProductItem, StoreSettings } from '../types';
import { TRANSLATIONS } from '../utils/defaultData';
import { soundFx } from '../utils/audio';

interface ProductCatalogProps {
  products: ProductItem[];
  settings: StoreSettings;
  onAddToCart: (product: ProductItem, quantity?: number) => void;
  onAddCustomItem: (name: string, price: number, quantity: number, unit?: string) => void;
  onOpenManageProducts: () => void;
  isKeyboardNavEnabled?: boolean;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  settings,
  onAddToCart,
  onAddCustomItem,
  onOpenManageProducts,
  isKeyboardNavEnabled = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customNameInputRef = useRef<HTMLInputElement>(null);
  const customPriceInputRef = useRef<HTMLInputElement>(null);
  const customQtyInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[settings.language];

  // Quick custom price entry state
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customUnit, setCustomUnit] = useState('pcs');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Focus custom name input when form opens
  useEffect(() => {
    if (showCustomForm) {
      setTimeout(() => {
        customNameInputRef.current?.focus();
        customNameInputRef.current?.select();
      }, 50);
    }
  }, [showCustomForm]);

  // Open and focus manual price entry (F1 key)
  const openCustomPriceEntry = useCallback(() => {
    soundFx.playBeep();
    setShowCustomForm(true);
    // If there's text already typed in the search bar, use it as custom item name
    if (searchQuery.trim() && !customName) {
      setCustomName(searchQuery.trim());
      setSearchQuery('');
      setTimeout(() => {
        customPriceInputRef.current?.focus();
        customPriceInputRef.current?.select();
      }, 60);
    } else {
      setTimeout(() => {
        customNameInputRef.current?.focus();
        customNameInputRef.current?.select();
      }, 60);
    }
  }, [searchQuery, customName]);

  // Listen for global custom event triggered by F1 anywhere in the app
  useEffect(() => {
    const handleCustomPriceEvent = () => {
      openCustomPriceEntry();
    };

    window.addEventListener('open-custom-price-form', handleCustomPriceEvent);
    return () => window.removeEventListener('open-custom-price-form', handleCustomPriceEvent);
  }, [openCustomPriceEntry]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['all', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.code.toLowerCase().includes(q) ||
        p.nameSi.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.price.toString().includes(q)
      );
    });
  }, [products, searchQuery, selectedCategory]);

  // Keep highlightedIndex valid when filter changes
  useEffect(() => {
    if (highlightedIndex >= filteredProducts.length) {
      setHighlightedIndex(Math.max(0, filteredProducts.length - 1));
    }
  }, [filteredProducts.length, highlightedIndex]);

  // Auto scroll highlighted item into view
  useEffect(() => {
    if (filteredProducts.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
      const targetId = `product-item-${filteredProducts[highlightedIndex]?.id}`;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, filteredProducts]);

  const handleProductClick = (product: ProductItem) => {
    soundFx.playBeep();
    onAddToCart(product, 1);
  };

  const getCols = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  };

  // 4 Arrow keys (Left, Right, Up, Down) navigation across Product Catalog
  useEffect(() => {
    if (!isKeyboardNavEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isSearchInput = activeEl?.id === 'product-search-input';
      const isCustomInput = activeEl?.closest('form')?.contains(activeEl);

      // F1 to open and focus custom manual price entry (නව මිලක් එක් කිරීමට)
      if (e.key === 'F1') {
        e.preventDefault();
        openCustomPriceEntry();
        return;
      }

      // F2 to focus search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (isCustomInput) {
        // Allow form inputs to behave normally
        return;
      }

      if (isSearchInput) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          searchInputRef.current?.blur();
          setHighlightedIndex(0);
          soundFx.playBeep();
        }
        return;
      }

      // Grid navigation when focus is not inside inputs
      const isOtherInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (isOtherInput) return;

      const total = filteredProducts.length;
      if (total === 0) return;

      const cols = getCols();

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
        soundFx.playBeep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
        soundFx.playBeep();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(total - 1, prev + cols));
        soundFx.playBeep();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (highlightedIndex - cols < 0) {
          searchInputRef.current?.focus();
        } else {
          setHighlightedIndex((prev) => Math.max(0, prev - cols));
        }
        soundFx.playBeep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKeyboardNavEnabled, filteredProducts, highlightedIndex]);

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const priceNum = parseFloat(customPrice);
    const qtyNum = parseFloat(customQty) || 1;
    if (!priceNum || priceNum <= 0) {
      customPriceInputRef.current?.focus();
      return;
    }

    const finalName = customName.trim() || (settings.language === 'si' ? 'වෙනත් භාණ්ඩය' : 'Custom Item');
    soundFx.playBeep();
    onAddCustomItem(finalName, priceNum, qtyNum, customUnit);
    setCustomName('');
    setCustomPrice('');
    setCustomQty('1');
    setShowCustomForm(false);

    // Auto focus customer cash tendered input on the right side
    setTimeout(() => {
      const cashInput = document.getElementById('cash-received-input') as HTMLInputElement | null;
      if (cashInput) {
        cashInput.focus();
        cashInput.select();
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar: Search & Quick Add */}
      <div className="p-3 bg-slate-50/80 border-b border-slate-200 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="product-search-input"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                ×
              </button>
            )}
          </div>

          <button
            id="toggle-custom-entry-btn"
            type="button"
            onClick={() => {
              if (!showCustomForm) {
                openCustomPriceEntry();
              } else {
                setShowCustomForm(false);
              }
            }}
            className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              showCustomForm
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/30'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
            }`}
            title={settings.language === 'si' ? 'නව මිලක් එක් කරන්න (F1 යතුර)' : 'Add manual price (Press F1)'}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{settings.language === 'si' ? 'නව මිලක්' : 'Manual Price'}</span>
            <kbd className={`px-1.5 py-0.5 text-[10px] rounded font-mono font-black border ${
              showCustomForm
                ? 'bg-blue-700 text-white border-blue-500'
                : 'bg-slate-100 text-blue-700 border-slate-300'
            }`}>
              F1
            </kbd>
          </button>
        </div>

        {/* Custom manual price entry panel (Collapsible via F1 or Click) */}
        {showCustomForm && (
          <form
            onSubmit={handleCustomSubmit}
            className="p-3.5 bg-blue-50/80 border-2 border-blue-300 rounded-xl text-xs space-y-2.5 animate-fadeIn shadow-xs"
          >
            <div className="font-semibold text-blue-900 flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded font-mono font-black shadow-2xs">
                  F1
                </kbd>
                <span className="font-bold text-xs">
                  {settings.language === 'si' ? 'නව මිලක් එක් කිරීම (Manual Price Entry)' : 'Manual Price Entry'}
                </span>
              </div>
              <span className="text-[11px] text-blue-700 font-medium">
                {settings.language === 'si'
                  ? 'භාණ්ඩය සටහන් කර [Enter] ඔබන්න (බිලට එක් වේ)'
                  : 'Type details & press [Enter] to add to bill'}
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5 sm:col-span-4">
                <input
                  id="custom-item-name"
                  ref={customNameInputRef}
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      customPriceInputRef.current?.focus();
                      customPriceInputRef.current?.select();
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customPrice && parseFloat(customPrice) > 0) {
                        handleCustomSubmit();
                      } else {
                        customPriceInputRef.current?.focus();
                        customPriceInputRef.current?.select();
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setShowCustomForm(false);
                      searchInputRef.current?.focus();
                    }
                  }}
                  placeholder={settings.language === 'si' ? 'භාණ්ඩයේ නම' : 'Item Name (Optional)'}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px] font-bold">
                    {settings.currency}
                  </span>
                  <input
                    id="custom-item-price"
                    ref={customPriceInputRef}
                    type="number"
                    step="any"
                    required
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        customNameInputRef.current?.focus();
                        customNameInputRef.current?.select();
                      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        customQtyInputRef.current?.focus();
                        customQtyInputRef.current?.select();
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomSubmit();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setShowCustomForm(false);
                        searchInputRef.current?.focus();
                      }
                    }}
                    placeholder="0.00"
                    className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-blue-300 rounded-lg font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right shadow-2xs text-sm"
                  />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <input
                  id="custom-item-qty"
                  ref={customQtyInputRef}
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      customPriceInputRef.current?.focus();
                      customPriceInputRef.current?.select();
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCustomSubmit();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setShowCustomForm(false);
                      searchInputRef.current?.focus();
                    }
                  }}
                  placeholder="Qty"
                  className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg font-bold text-slate-900 text-center focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>
              <div className="col-span-2 sm:col-span-3 flex gap-1">
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="px-1.5 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-700 text-xs focus:outline-hidden hidden sm:block font-medium"
                >
                  <option value="pcs">කෑලි (pcs)</option>
                  <option value="kg">කිලෝ (kg)</option>
                  <option value="pkt">පැකට් (pkt)</option>
                  <option value="btl">බෝතල් (btl)</option>
                </select>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-1.5 px-3 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{settings.language === 'si' ? 'එක්කරන්න (Enter)' : 'Add (Enter)'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
            >
              {cat === 'all' ? t.allCategories : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid: List of pre-set pricing items */}
      <div className="flex-1 p-3 overflow-y-auto min-h-[300px]">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <Tag className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
            <p className="text-sm font-medium">
              {settings.language === 'si' ? 'ගැලපෙන භාණ්ඩයක් හමු නොවීය' : 'No matching products found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {settings.language === 'si'
                ? 'වෙනත් නමක් සෙවුම් කරන්න හෝ නව මිලක් ඇතුලත් කරන්න'
                : 'Try searching with another keyword or enter manual price'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredProducts.map((product, index) => {
              const displayName = settings.language === 'si' ? product.nameSi : product.nameEn;
              const subName = settings.language === 'si' ? product.nameEn : product.nameSi;
              const isHighlighted = isKeyboardNavEnabled && highlightedIndex === index;

              return (
                <button
                  key={product.id}
                  id={`product-item-${product.id}`}
                  type="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  onClick={(e) => {
                    (e.currentTarget as HTMLButtonElement).blur();
                    setHighlightedIndex(index);
                    handleProductClick(product);
                  }}
                  className={`group relative flex flex-col justify-between text-left p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer select-none ${
                    isHighlighted
                      ? 'ring-3 ring-blue-600 border-blue-500 bg-blue-50/50 shadow-md scale-[1.01] z-10'
                      : 'border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md active:scale-98'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className={`font-mono px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isHighlighted ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{product.code}
                      </span>
                      {product.variants && product.variants.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          <Palette className="w-2.5 h-2.5" />
                          <span>{product.variants.length}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 truncate max-w-[70px]">
                          {product.category}
                        </span>
                      )}
                    </div>

                    <h3 className={`font-semibold text-xs sm:text-sm line-clamp-2 leading-tight transition-colors ${
                      isHighlighted ? 'text-blue-900' : 'text-slate-800 group-hover:text-blue-700'
                    }`}>
                      {displayName}
                    </h3>

                    {subName && (
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {subName}
                      </p>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-normal">
                        {product.unit ? `1 ${product.unit}` : ''}
                      </span>
                      <div className="font-bold text-slate-900 text-sm sm:text-base font-mono">
                        <span className="text-xs text-slate-500 font-normal mr-0.5">
                          {settings.currency}
                        </span>
                        {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer bar with keyboard navigation hint */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>
            {settings.language === 'si' ? 'මුළු භාණ්ඩ:' : 'Total items:'}{' '}
            <strong className="text-slate-700">{products.length}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-600">
            <kbd className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-bold">↑ ↓ ← →</kbd>
            <span>{settings.language === 'si' ? 'තෝරන්න' : 'Navigate'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenManageProducts}
          className="text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{settings.language === 'si' ? 'මිල ලැයිස්තුව කළමනාකරණය' : 'Edit Price Catalog'}</span>
        </button>
      </div>
    </div>
  );
};
