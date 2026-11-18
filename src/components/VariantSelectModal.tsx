import React, { useState, useEffect } from 'react';
import { X, Check, Palette, Plus, Minus, ShoppingBag } from 'lucide-react';
import { ProductItem, StoreSettings } from '../types';
import { formatCurrency } from '../utils/currency';
import { soundFx } from '../utils/audio';

interface VariantSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  settings: StoreSettings;
  onConfirmVariant?: (product: ProductItem, variant: string, quantity: number) => void;
  onSelectVariant?: (variant: string, quantity: number) => void;
}

// Helper to determine dot color for common color names
function getColorBadgeClass(variantName: string): string {
  const lower = variantName.toLowerCase();
  if (lower.includes('නිල්') || lower.includes('blue')) return 'bg-blue-600 text-white';
  if (lower.includes('කළු') || lower.includes('black')) return 'bg-slate-900 text-white';
  if (lower.includes('රතු') || lower.includes('red')) return 'bg-rose-600 text-white';
  if (lower.includes('කොළ') || lower.includes('green')) return 'bg-emerald-600 text-white';
  if (lower.includes('කහ') || lower.includes('yellow')) return 'bg-amber-400 text-slate-900';
  if (lower.includes('තැඹිලි') || lower.includes('orange')) return 'bg-orange-500 text-white';
  if (lower.includes('සුදු') || lower.includes('white')) return 'bg-white border-2 border-slate-400 text-slate-900';
  if (lower.includes('දම්') || lower.includes('purple')) return 'bg-purple-600 text-white';
  if (lower.includes('රෝස') || lower.includes('pink')) return 'bg-pink-500 text-white';
  return 'bg-blue-600 text-white';
}

export const VariantSelectModal: React.FC<VariantSelectModalProps> = ({
  isOpen,
  onClose,
  product,
  settings,
  onConfirmVariant,
  onSelectVariant,
}) => {
  if (!isOpen || !product) return null;

  const variants = product.variants && product.variants.length > 0 ? product.variants : [];
  const [selectedVariant, setSelectedVariant] = useState<string>(variants[0] || '');
  const [quantity, setQuantity] = useState<number>(1);

  // Sync initial selection when product changes
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant('');
    }
    setQuantity(1);
  }, [product]);

  const handleConfirm = () => {
    const finalVariant = selectedVariant || variants[0] || (settings.language === 'si' ? 'සාමාන්‍ය' : 'Standard');
    soundFx.playBeep();
    if (onConfirmVariant) {
      onConfirmVariant(product, finalVariant, quantity);
    } else if (onSelectVariant) {
      onSelectVariant(finalVariant, quantity);
    }
    onClose();
  };

  // 4 Arrow keys (Left, Right, Up, Down) & Enter navigation for Variants
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        if (variants.length > 0) {
          const currentIndex = variants.indexOf(selectedVariant);
          const nextIndex = currentIndex < variants.length - 1 ? currentIndex + 1 : 0;
          setSelectedVariant(variants[nextIndex]);
          soundFx.playBeep();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (variants.length > 0) {
          const currentIndex = variants.indexOf(selectedVariant);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : variants.length - 1;
          setSelectedVariant(variants[prevIndex]);
          soundFx.playBeep();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [variants, selectedVariant, quantity, onConfirmVariant, onSelectVariant, onClose, product, settings]);

  const total = Number((product.price * quantity).toFixed(2));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
      tabIndex={-1}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Palette className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {settings.language === 'si' ? 'වර්ණය හෝ විශේෂතාව තෝරන්න' : 'Select Color / Specification'}
              </h3>
              <p className="text-xs text-blue-100">
                #{product.code} - {settings.language === 'si' ? product.nameSi : product.nameEn}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Product Price Info */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                {settings.language === 'si' ? 'ඒකක මිල' : 'Unit Price'}:
              </span>
              <div className="font-mono font-bold text-slate-900 text-base">
                {formatCurrency(product.price, settings.currency)} {product.unit ? `/ ${product.unit}` : ''}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">
                {settings.language === 'si' ? 'මුළු වටිනාකම' : 'Total'}:
              </span>
              <div className="font-mono font-black text-blue-700 text-lg">
                {formatCurrency(total, settings.currency)}
              </div>
            </div>
          </div>

          {/* Variants Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {settings.language === 'si'
                ? 'පාරිභෝගිකයා ලබාගත් වර්ණය හෝ විශේෂතාව තෝරන්න (5 දක්වා):'
                : 'Choose the customer variant (up to 5):'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {variants.map((variant, idx) => {
                const isSelected = selectedVariant === variant;
                const dotClass = getColorBadgeClass(variant);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(variant);
                      soundFx.playBeep();
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full shrink-0 shadow-2xs ${dotClass}`} />
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 flex-1">
                      {variant}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity selector */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700">
              {settings.language === 'si' ? 'ප්‍රමාණය (Quantity):' : 'Quantity:'}
            </span>
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-base transition-colors shadow-2xs"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-16 text-center font-bold font-mono text-sm bg-white border border-slate-300 rounded-lg py-1"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-base transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {settings.language === 'si' ? 'ආපසු (Cancel)' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedVariant}
            className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{settings.language === 'si' ? 'බිලට එක්කරන්න (Add to Bill)' : 'Add to Bill'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
