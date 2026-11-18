/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { ProductCatalog } from './components/ProductCatalog';
import { BillTable } from './components/BillTable';
import { PaymentPanel } from './components/PaymentPanel';
import { PaymentMethodsPanel } from './components/PaymentMethodsPanel';
import { VariantSelectModal } from './components/VariantSelectModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ManageProductsModal } from './components/ManageProductsModal';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { BillPdfSendModal } from './components/BillPdfSendModal';
import { CreditModal } from './components/CreditModal';
import { BottomBar } from './components/BottomBar';
import { ProductItem, CartItem, SaleRecord, StoreSettings, Customer, PaymentMethod, CreditRecord, CreditPaymentLog } from './types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, TRANSLATIONS } from './utils/defaultData';
import { soundFx } from './utils/audio';
import { getAppBackgroundClass, getBackgroundTheme } from './utils/theme';

const STORAGE_PRODUCTS_KEY = 'pos_products_v1';
const STORAGE_SETTINGS_KEY = 'pos_settings_v1';
const STORAGE_SALES_KEY = 'pos_sales_v1';
const STORAGE_CUSTOMERS_KEY = 'pos_customers_v1';
const STORAGE_BILL_COUNTER = 'pos_bill_counter_v1';
const STORAGE_CREDIT_KEY = 'pos_credit_records_v1';
const STORAGE_CREDIT_PAYMENTS_KEY = 'pos_credit_payments_log_v1';

// Seed initial credit based on user's exact example:
// "උදා: නිමල් 2026.05.05 දින රු: 3500 ණයට අරගෙන ඇත්නම්..."
const INITIAL_CREDITS: CreditRecord[] = [
  {
    id: 'credit-sample-nimal',
    customerName: 'නිමල්',
    customerPhone: '0771234567',
    originalAmount: 3500,
    remainingAmount: 3500,
    paidAmount: 0,
    initialDate: new Date('2026-05-05').getTime(),
    lastUpdatedDate: new Date('2026-05-05').getTime(),
    billNumber: 'INV-1001',
    itemsSummary: 'කිරිපිටි 400g, සුදු සීනි 1kg',
    status: 'pending',
    payments: [],
  },
];

export default function App() {
  // Load persistent state from localStorage
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SALES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [credits, setCredits] = useState<CreditRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CREDIT_KEY);
      return saved ? JSON.parse(saved) : INITIAL_CREDITS;
    } catch {
      return INITIAL_CREDITS;
    }
  });

  const [creditPaymentsLog, setCreditPaymentsLog] = useState<CreditPaymentLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CREDIT_PAYMENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSaveCreditPaymentsLog = (updated: CreditPaymentLog[]) => {
    setCreditPaymentsLog(updated);
    try {
      localStorage.setItem(STORAGE_CREDIT_PAYMENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save credit payments log', e);
    }
  };

  const [billCounter, setBillCounter] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BILL_COUNTER);
      return saved ? parseInt(saved, 10) : 1001;
    } catch {
      return 1001;
    }
  });

  // Current active transaction state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customBillNumber, setCustomBillNumber] = useState<string>('');
  const [settingsInitialTab, setSettingsInitialTab] = useState<'settings' | 'customers'>('settings');
  const [activeRightTab, setActiveRightTab] = useState<'bill' | 'payment'>('bill');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDetails, setPaymentDetails] = useState<string>('');

  // Modals state
  const [variantModalProduct, setVariantModalProduct] = useState<ProductItem | null>(null);
  const [isManageProductsOpen, setIsManageProductsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [isBillPdfSendOpen, setIsBillPdfSendOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleRecord | null>(null);
  const [reprintSale, setReprintSale] = useState<SaleRecord | null>(null);

  const t = TRANSLATIONS[settings.language];

  // Sync settings with audio manager
  useEffect(() => {
    soundFx.enabled = settings.soundEffects;
  }, [settings.soundEffects]);

  // Persist products
  const handleSaveProducts = (updated: ProductItem[]) => {
    setProducts(updated);
    try {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  };

  // Persist settings
  const handleSaveSettings = (updated: StoreSettings) => {
    setSettings(updated);
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  };

  // Persist sales
  const handleSaveSales = (updated: SaleRecord[]) => {
    setSalesHistory(updated);
    try {
      localStorage.setItem(STORAGE_SALES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save sales to localStorage', e);
    }
  };

  // Persist customers
  const handleSaveCustomers = (updated: Customer[]) => {
    setCustomers(updated);
    try {
      localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save customers to localStorage', e);
    }
  };

  // Persist credits
  const handleSaveCredits = (updated: CreditRecord[]) => {
    setCredits(updated);
    try {
      localStorage.setItem(STORAGE_CREDIT_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save credits to localStorage', e);
    }
  };

  // Record credit debt repayment
  // "පහලින් අද දින ගෙවන මුදල ලෙස Tab එකක් නිර්මාණය කර අපි ගෙවන මුදලින් පරණ ණය මුදල අඩු වී ඉතුරු මුදල අද දිනය සමග සටහන් වේ.
  //  ණය සම්පූර්ණයෙන් ගෙවා නිම කරන්නේ නම් අදාල කොටස ඉවත් වී ගෙවූ මුදල අද දින ආදායමට එකතු වේ"
  const handleRecordCreditPayment = (
    creditId: string,
    amount: number,
    method: 'cash' | 'card' | 'qr',
    note?: string
  ) => {
    const targetCredit = credits.find((c) => c.id === creditId);
    const paymentId = `pay-${Date.now()}`;
    const logItem: CreditPaymentLog = {
      id: paymentId,
      creditId: creditId,
      customerName: targetCredit?.customerName || '',
      customerPhone: targetCredit?.customerPhone,
      date: Date.now(),
      amount: amount,
      paymentMethod: method,
      note: note,
      billNumber: targetCredit?.billNumber,
    };
    handleSaveCreditPaymentsLog([logItem, ...creditPaymentsLog]);

    const updated = credits.map((c) => {
      if (c.id === creditId) {
        const newPaid = Number((c.paidAmount + amount).toFixed(2));
        const newRemaining = Math.max(0, Number((c.remainingAmount - amount).toFixed(2)));
        const newPayment = {
          id: paymentId,
          date: Date.now(),
          amount: amount,
          paymentMethod: method,
          note: note,
        };
        const isSettled = newRemaining <= 0;
        return {
          ...c,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          lastUpdatedDate: Date.now(),
          status: (isSettled ? 'paid' : 'partially_paid') as 'paid' | 'partially_paid',
          payments: [newPayment, ...(c.payments || [])],
        };
      }
      return c;
    });

    handleSaveCredits(updated);
  };

  // Full backup exporter
  const handleExportAllData = () => {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shopDetails: settings,
      productsCatalog: products,
      salesRecords: salesHistory,
      customerDirectory: customers,
      creditAccounts: credits,
      billCounter: billCounter,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `POS-FullBackup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const changeGiven = useMemo(() => {
    return cashReceived >= grandTotal ? Number((cashReceived - grandTotal).toFixed(2)) : 0;
  }, [cashReceived, grandTotal]);

  const currentBillNumber = customBillNumber.trim() || `INV-${billCounter}`;

  // Direct Save Customer from Bill or elsewhere
  const handleDirectSaveCustomer = useCallback((phone: string, name: string) => {
    if (!phone.trim() && !name.trim()) return;
    const p = phone.trim();
    const n = name.trim();
    setCustomers((prev) => {
      const existingIdx = p ? prev.findIndex((c) => c.phone === p) : -1;
      const now = Date.now();
      let updated: Customer[];
      if (existingIdx > -1) {
        updated = prev.map((c, i) =>
          i === existingIdx ? { ...c, name: n || c.name, lastVisit: now } : c
        );
      } else {
        const newCust: Customer = {
          id: `cust-${now}-${Math.random().toString(36).substring(2, 6)}`,
          phone: p,
          name: n || 'Customer',
          totalSpent: 0,
          visitsCount: 0,
          lastVisit: now,
        };
        updated = [newCust, ...prev];
      }
      handleSaveCustomers(updated);
      return updated;
    });
    soundFx.playSuccess();
  }, []);

  // Cart operations
  const handleAddToCart = useCallback((product: ProductItem, quantity = 1, variant?: string) => {
    // If product has variants and no variant is specified yet, open the selection modal!
    if (product.variants && product.variants.length > 0 && !variant) {
      setVariantModalProduct(product);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && (item.selectedVariant || '') === (variant || '')
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIndex];
        const newQty = Number((currentItem.quantity + quantity).toFixed(2));
        updated[existingIndex] = {
          ...currentItem,
          quantity: newQty,
          total: Number((newQty * currentItem.price).toFixed(2)),
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          name: product.nameSi,
          nameSi: product.nameSi,
          nameEn: product.nameEn,
          price: product.price,
          quantity: quantity,
          unit: product.unit,
          total: Number((quantity * product.price).toFixed(2)),
          selectedVariant: variant,
          availableVariants: product.variants,
        };
        return [...prev, newItem];
      }
    });
  }, []);

  const handleAddCustomItem = useCallback((name: string, price: number, quantity: number, unit = 'pcs') => {
    const newItem: CartItem = {
      id: `cart-custom-${Date.now()}`,
      name: name,
      nameSi: name,
      nameEn: name,
      price: price,
      quantity: quantity,
      unit: unit,
      total: Number((price * quantity).toFixed(2)),
    };
    setCart((prev) => [...prev, newItem]);
  }, []);

  const handleUpdateQuantity = useCallback((id: string, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity: newQty,
            total: Number((newQty * item.price).toFixed(2)),
          };
        }
        return item;
      })
    );
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearBill = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setCashReceived(0);
    setCustomerPhone('');
    setCustomerName('');
    setActiveRightTab('bill');
    setPaymentMethod('cash');
    setPaymentDetails('');
  }, []);

  // Complete Sale
  const handleCompleteSale = useCallback(() => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && cashReceived < grandTotal) return;

    soundFx.playSuccess();

    const actualCash = paymentMethod === 'cash' ? cashReceived : (paymentMethod === 'credit' ? cashReceived : grandTotal);
    const actualChange = paymentMethod === 'cash' ? changeGiven : 0;

    const newSaleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      billNumber: currentBillNumber,
      timestamp: Date.now(),
      items: [...cart],
      totalAmount: grandTotal,
      cashReceived: actualCash,
      changeGiven: actualChange,
      itemCount: cart.length,
      totalQuantity: cart.reduce((sum, it) => sum + it.quantity, 0),
      customerPhone: customerPhone.trim() || undefined,
      customerName: customerName.trim() || undefined,
      paymentMethod: paymentMethod,
      paymentDetails: paymentDetails.trim() || undefined,
    };

    const updatedSales = [newSaleRecord, ...salesHistory];
    handleSaveSales(updatedSales);

    // If payment method is Credit, record into Credit management:
    // "Credit වලට ගත් භාන්ඩ හෝ සේවාවන් සඳහා එම මුදල අද දින මුළු ආදායම කියන කොටසට එකතු නොවී පහල තීරුවේ Icon එකක් හදල එතනට එකතු කරන්න. එම කොටුව Credit ලෙස නම් කරන්න."
    if (paymentMethod === 'credit') {
      const newCreditRecord: CreditRecord = {
        id: `credit-${Date.now()}`,
        customerName: customerName.trim() || (settings.language === 'si' ? 'ණය පාරිභෝගිකයා' : 'Credit Customer'),
        customerPhone: customerPhone.trim() || undefined,
        originalAmount: grandTotal,
        remainingAmount: grandTotal,
        paidAmount: 0,
        initialDate: Date.now(),
        lastUpdatedDate: Date.now(),
        billNumber: currentBillNumber,
        itemsSummary: cart.map((it) => `${it.name}${it.selectedVariant ? ` (${it.selectedVariant})` : ''} x${it.quantity}`).join(', '),
        status: 'pending',
        payments: [],
      };
      handleSaveCredits([newCreditRecord, ...credits]);
    }

    // Save/Update Customer in directory if phone was given
    if (customerPhone.trim()) {
      const p = customerPhone.trim();
      const existingIdx = customers.findIndex((c) => c.phone === p);
      const now = Date.now();
      let updatedCustomers: Customer[];
      if (existingIdx > -1) {
        updatedCustomers = customers.map((c, i) =>
          i === existingIdx
            ? {
                ...c,
                name: customerName.trim() || c.name,
                totalSpent: Number((c.totalSpent + grandTotal).toFixed(2)),
                visitsCount: c.visitsCount + 1,
                lastVisit: now,
              }
            : c
        );
      } else {
        const newCust: Customer = {
          id: `cust-${now}`,
          phone: p,
          name: customerName.trim(),
          totalSpent: grandTotal,
          visitsCount: 1,
          lastVisit: now,
        };
        updatedCustomers = [newCust, ...customers];
      }
      handleSaveCustomers(updatedCustomers);
    }

    // Increment bill counter
    const nextCounter = billCounter + 1;
    setBillCounter(nextCounter);
    try {
      localStorage.setItem(STORAGE_BILL_COUNTER, nextCounter.toString());
    } catch {}

    // Advance custom bill number if it ends in digits (e.g. INV-1005 -> INV-1006)
    if (customBillNumber.trim()) {
      const match = customBillNumber.trim().match(/^(.*?)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const numStr = match[2];
        const nextNum = parseInt(numStr, 10) + 1;
        const paddedNext = nextNum.toString().padStart(numStr.length, '0');
        setCustomBillNumber(`${prefix}${paddedNext}`);
      } else {
        setCustomBillNumber('');
      }
    }

    // Auto prompt: Open Bill PDF Send modal to ask user's preference
    setLastCompletedSale(newSaleRecord);
    setIsBillPdfSendOpen(true);

    // Reset bill and return to bill tab
    setCart([]);
    setDiscount(0);
    setCashReceived(0);
    setCustomerPhone('');
    setCustomerName('');
    setActiveRightTab('bill');
    setPaymentMethod('cash');
    setPaymentDetails('');
  }, [
    cart,
    cashReceived,
    grandTotal,
    changeGiven,
    currentBillNumber,
    customBillNumber,
    salesHistory,
    billCounter,
    customerPhone,
    customerName,
    customers,
    paymentMethod,
    paymentDetails,
    credits,
    settings.language,
  ]);

  // Open receipt modal for current bill
  const handleOpenCurrentReceipt = useCallback(() => {
    if (cart.length === 0) return;
    setReprintSale(null);
    setIsReceiptOpen(true);
  }, [cart]);

  // Reprint past sale
  const handleReprint = useCallback((sale: SaleRecord) => {
    setReprintSale(sale);
    setIsHistoryOpen(false);
    setIsReceiptOpen(true);
  }, []);

  // Clear history
  const handleClearHistory = useCallback(() => {
    if (
      window.confirm(
        settings.language === 'si'
          ? 'විකිණුම් ඉතිහාසය සම්පූර්ණයෙන්ම මකා දැමීමට අවශ්‍යද?'
          : 'Are you sure you want to clear all sales history?'
      )
    ) {
      handleSaveSales([]);
    }
  }, [settings.language]);

  // Global Keyboard Shortcuts (Windows PC POS Standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Manual Custom Price Entry (නව මිලක් එක් කිරීමට F1 යතුර)
      if (e.key === 'F1') {
        e.preventDefault();
        soundFx.playBeep();
        if (activeRightTab !== 'bill') {
          setActiveRightTab('bill');
        }
        window.dispatchEvent(new CustomEvent('open-custom-price-form'));
        return;
      }

      // F8: Print Receipt
      if (e.key === 'F8' || (e.ctrlKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        if (cart.length > 0) {
          handleOpenCurrentReceipt();
        }
      }

      // Enter key: When on bill/payment side, switches to Payment Methods; When in Payment Methods, completes sale!
      // "හැම වෙලාවෙන Enter බට්න් එක වැඩ කරන්න ඕනේ Mouse එකට අමතරව සහ Arow Keys 4ත් වැඩ කරන්න ඕනේ"
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement | null;
        const isCustomForm = target?.closest('form') || target?.id === 'custom-item-name' || target?.id === 'custom-item-price' || target?.id === 'custom-item-qty';
        const isCatalogTarget = target?.closest('#product-search-input') || target?.closest('[id^="product-item-"]');

        const anyModalOpen =
          isManageProductsOpen ||
          isHistoryOpen ||
          isSettingsOpen ||
          isReceiptOpen ||
          isInstallGuideOpen ||
          isBillPdfSendOpen ||
          isCreditModalOpen ||
          !!variantModalProduct;

        if (!anyModalOpen && cart.length > 0 && !isCustomForm) {
          if (activeRightTab === 'bill') {
            const isBillSide = target?.closest('#open-payment-methods-btn') || 
                               target?.closest('#tab-payment-methods') || 
                               target?.closest('.bill-panel-container') ||
                               target?.id === 'cash-received-input' ||
                               !isCatalogTarget;

            if (isBillSide) {
              e.preventDefault();
              soundFx.playBeep();
              setActiveRightTab('payment');
            }
          } else if (activeRightTab === 'payment') {
            e.preventDefault();
            if (paymentMethod === 'cash' && cashReceived <= 0 && grandTotal > 0) {
              setCashReceived(grandTotal);
            }
            handleCompleteSale();
          }
        }
      }

      // F9: Direct Complete Sale shortcut
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          const canComplete =
            paymentMethod !== 'cash' ||
            (paymentMethod === 'cash' && cashReceived >= grandTotal);
          if (canComplete) {
            handleCompleteSale();
          } else {
            setActiveRightTab('payment');
          }
        }
      }

      // Escape: If in payment methods tab, return to bill tab ("ආපසු")!
      if (e.key === 'Escape') {
        if (activeRightTab === 'payment') {
          e.preventDefault();
          soundFx.playBeep();
          setActiveRightTab('bill');
          return;
        }

        if (
          !isManageProductsOpen &&
          !isHistoryOpen &&
          !isSettingsOpen &&
          !isReceiptOpen &&
          !isInstallGuideOpen &&
          !isBillPdfSendOpen &&
          !variantModalProduct
        ) {
          if (cart.length > 0) {
            if (
              window.confirm(
                settings.language === 'si' ? 'වත්මන් බිල මකා දැමීමට අවශ්‍යද?' : 'Clear current bill?'
              )
            ) {
              handleClearBill();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cart.length,
    cashReceived,
    grandTotal,
    activeRightTab,
    paymentMethod,
    handleOpenCurrentReceipt,
    handleCompleteSale,
    handleClearBill,
    isManageProductsOpen,
    isHistoryOpen,
    isSettingsOpen,
    isReceiptOpen,
    isInstallGuideOpen,
    isBillPdfSendOpen,
    variantModalProduct,
    settings.language,
  ]);

  // Today's sales metrics
  // "Cash, Credit Card, QR Pay වලින් ගෙවූ පසු මුදල් අද දින මුලු ආදායමට එකතු වන අතර
  //  Credit වලට ගත් භාන්ඩ හෝ සේවාවන් සඳහා එම මුදල අද දින මුළු ආදායම කියන කොටසට එකතු නොවී
  //  පහල තීරුවේ Icon එකක් හදල එතනට එකතු කරන්න. එම කොටුව Credit ලෙස නම් කරන්න."
  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return salesHistory.filter((s) => new Date(s.timestamp).toDateString() === today);
  }, [salesHistory]);

  // Direct sales paid immediately today (excluding pending credit sales)
  const todayDirectSales = useMemo(() => {
    return todaySales.filter((s) => s.paymentMethod !== 'credit');
  }, [todaySales]);

  // Today's collected credit payments (from both persistent payment log and active credits)
  const todayCreditPayments = useMemo(() => {
    const today = new Date().toDateString();
    let total = 0;
    let cash = 0;
    let card = 0;
    let qr = 0;

    const seenPaymentIds = new Set<string>();

    creditPaymentsLog.forEach((p) => {
      if (new Date(p.date).toDateString() === today) {
        seenPaymentIds.add(p.id);
        total += p.amount;
        if (p.paymentMethod === 'card') card += p.amount;
        else if (p.paymentMethod === 'qr') qr += p.amount;
        else cash += p.amount;
      }
    });

    credits.forEach((c) => {
      (c.payments || []).forEach((p) => {
        if (!seenPaymentIds.has(p.id) && new Date(p.date).toDateString() === today) {
          seenPaymentIds.add(p.id);
          total += p.amount;
          if (p.paymentMethod === 'card') card += p.amount;
          else if (p.paymentMethod === 'qr') qr += p.amount;
          else cash += p.amount;
        }
      });
    });

    return {
      total: Number(total.toFixed(2)),
      cash: Number(cash.toFixed(2)),
      card: Number(card.toFixed(2)),
      qr: Number(qr.toFixed(2)),
    };
  }, [credits, creditPaymentsLog]);

  // Actual collected revenue for today (Cash + Card + QR direct sales + Credit collected today)
  const todaySalesTotal = useMemo(() => {
    const directTotal = todayDirectSales.reduce((sum, s) => sum + s.totalAmount, 0);
    return Number((directTotal + todayCreditPayments.total).toFixed(2));
  }, [todayDirectSales, todayCreditPayments]);

  const todayCashTotal = useMemo(() => {
    const directCash = todayDirectSales
      .filter((s) => !s.paymentMethod || s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.totalAmount, 0);
    return Number((directCash + todayCreditPayments.cash).toFixed(2));
  }, [todayDirectSales, todayCreditPayments]);

  const todayCardTotal = useMemo(() => {
    const directCard = todayDirectSales
      .filter((s) => s.paymentMethod === 'card')
      .reduce((sum, s) => sum + s.totalAmount, 0);
    return Number((directCard + todayCreditPayments.card).toFixed(2));
  }, [todayDirectSales, todayCreditPayments]);

  const todayQrTotal = useMemo(() => {
    const directQr = todayDirectSales
      .filter((s) => s.paymentMethod === 'qr')
      .reduce((sum, s) => sum + s.totalAmount, 0);
    return Number((directQr + todayCreditPayments.qr).toFixed(2));
  }, [todayDirectSales, todayCreditPayments]);

  const pendingCredits = useMemo(() => {
    return credits.filter((c) => c.status !== 'paid' && c.remainingAmount > 0);
  }, [credits]);

  const currentTheme = getBackgroundTheme(settings.backgroundColor);

  // Synchronize document.body and html background color with active theme
  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.bgColor;
  }, [currentTheme.bgColor]);

  return (
    <div
      id="app-root-container"
      style={{ backgroundColor: currentTheme.bgColor }}
      className={`min-h-screen flex flex-col ${currentTheme.appContainerClass} text-slate-900 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300`}
    >
      {/* Windows POS Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleSaveSettings}
        onOpenManageProducts={() => setIsManageProductsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => {
          setSettingsInitialTab('settings');
          setIsSettingsOpen(true);
        }}
        onOpenCustomers={() => {
          setSettingsInitialTab('customers');
          setIsSettingsOpen(true);
        }}
        onOpenCredit={() => setIsCreditModalOpen(true)}
        pendingCreditCount={pendingCredits.length}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        todaySalesCount={todaySales.length}
        todaySalesTotal={todaySalesTotal}
      />

      {/* Shortcuts Hint Bar (Windows Desktop UX) */}
      <div className="bg-slate-800 text-slate-300 text-[11px] px-4 py-1 flex items-center justify-between border-b border-slate-700 select-none print:hidden">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded font-mono font-black text-[10px] shadow-2xs">F1</span>
          <span className="font-bold text-white">{settings.language === 'si' ? 'නව මිලක්' : 'Manual Price'}</span>
          <span className="text-slate-600">•</span>
          <span className="bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">F2</span>
          <span>{settings.language === 'si' ? 'සෙවීම' : 'Search'}</span>
          <span className="text-slate-600">•</span>
          <span className="bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">F4</span>
          <span>{settings.language === 'si' ? 'මුදල් (Cash)' : 'Tendered'}</span>
          <span className="text-slate-600">•</span>
          <span className="bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">F8</span>
          <span>{settings.language === 'si' ? 'මුද්‍රණය' : 'Print'}</span>
          <span className="text-slate-600">•</span>
          <span className="bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">F9</span>
          <span>{settings.language === 'si' ? 'විකිණුම අවසන්' : 'Finish'}</span>
          <span className="text-slate-600">•</span>
          <span className="bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">Esc</span>
          <span>{settings.language === 'si' ? 'හිස් කරන්න' : 'Clear'}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-slate-400 font-mono">
          <span>{t.billNumber}: <strong className="text-white">{currentBillNumber}</strong></span>
        </div>
      </div>

      {/* Main Two-Column Windows POS Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-hidden print:hidden">
        {/* Left Column: Product Catalog with Pre-set Prices & Categories */}
        <div className="product-catalog-container lg:col-span-6 xl:col-span-7 flex flex-col h-[calc(100vh-170px)] min-h-[480px]">
          <ProductCatalog
            products={products}
            settings={settings}
            onAddToCart={handleAddToCart}
            onAddCustomItem={handleAddCustomItem}
            onOpenManageProducts={() => setIsManageProductsOpen(true)}
            isKeyboardNavEnabled={
              activeRightTab === 'bill' &&
              !isManageProductsOpen &&
              !isHistoryOpen &&
              !isSettingsOpen &&
              !isReceiptOpen &&
              !isInstallGuideOpen &&
              !isBillPdfSendOpen &&
              !variantModalProduct
            }
          />
        </div>

        {/* Right Column: Active Bill Table and Payment Methods Panel Tabs */}
        <div className="bill-panel-container lg:col-span-6 xl:col-span-5 flex flex-col gap-2.5 h-[calc(100vh-170px)] min-h-[480px]">
          {/* Top Tab Bar between Bill and Payment Methods */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/90 rounded-xl shrink-0 border border-slate-300/80 shadow-2xs">
            <button
              id="tab-bill-items"
              type="button"
              onClick={() => setActiveRightTab('bill')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeRightTab === 'bill'
                  ? 'bg-white text-blue-950 shadow-xs ring-1 ring-slate-300/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>🛒 {settings.language === 'si' ? '1. බිල්පත් භාණ්ඩ' : '1. Bill Items'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                cart.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
              }`}>
                {cart.length}
              </span>
            </button>

            <button
              id="tab-payment-methods"
              type="button"
              onClick={() => {
                if (cart.length > 0) setActiveRightTab('payment');
              }}
              disabled={cart.length === 0}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeRightTab === 'payment'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : cart.length > 0
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                    : 'text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <span>💳 {settings.language === 'si' ? '2. Payment Methods' : '2. Payment Methods'}</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/10 text-inherit font-semibold">
                Enter ➔
              </span>
            </button>
          </div>

          {/* Tab 1: Bill Table & Quick Panel */}
          {activeRightTab === 'bill' ? (
            <>
              {/* Active Bill Table */}
              <div className="flex-1 min-h-[220px]">
                <BillTable
                  items={cart}
                  settings={settings}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearBill={handleClearBill}
                  customerPhone={customerPhone}
                  customerName={customerName}
                  onUpdateCustomerPhone={setCustomerPhone}
                  onUpdateCustomerName={setCustomerName}
                  savedCustomers={customers}
                  billNumber={currentBillNumber}
                  onUpdateBillNumber={setCustomBillNumber}
                  onSaveCustomerDirectly={handleDirectSaveCustomer}
                  onOpenCustomerModal={() => {
                    setSettingsInitialTab('customers');
                    setIsSettingsOpen(true);
                  }}
                />
              </div>

              {/* Payment & Balance to Return Engine */}
              <div className="shrink-0">
                <PaymentPanel
                  subtotal={subtotal}
                  discount={discount}
                  onUpdateDiscount={setDiscount}
                  cashReceived={cashReceived}
                  onUpdateCashReceived={setCashReceived}
                  settings={settings}
                  onPrintReceipt={handleOpenCurrentReceipt}
                  onCompleteSale={handleCompleteSale}
                  onOpenPaymentMethods={() => {
                    if (cart.length > 0) setActiveRightTab('payment');
                  }}
                  itemCount={cart.length}
                />
              </div>
            </>
          ) : (
            /* Tab 2: Full Payment Methods Panel (Cash, Card, QR, Credit with Big Icons & Presets) */
            <div className="flex-1 h-full min-h-0">
              <PaymentMethodsPanel
                subtotal={subtotal}
                discount={discount}
                onUpdateDiscount={setDiscount}
                cashReceived={cashReceived}
                onUpdateCashReceived={setCashReceived}
                paymentMethod={paymentMethod}
                onSelectPaymentMethod={setPaymentMethod}
                paymentDetails={paymentDetails}
                onUpdatePaymentDetails={setPaymentDetails}
                settings={settings}
                onBackToBill={() => setActiveRightTab('bill')}
                onPrintReceipt={handleOpenCurrentReceipt}
                onCompleteSale={handleCompleteSale}
                itemCount={cart.length}
                billNumber={currentBillNumber}
                customerPhone={customerPhone}
                customerName={customerName}
                onUpdateCustomerPhone={setCustomerPhone}
                onUpdateCustomerName={setCustomerName}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Bar: Today's Revenue breakdown (Cash, Card, QR) & Prominent Credit box
          "පහල තීරුවේ Icon එකක් හදල එතනට එකතු කරන්න. එම කොටුව Credit ලෙස නම් කරන්න. මුදල් ලැබුනු දවසක අදාල මුදල පියවීමට අවශ්‍ය ලෙස සකසන්න" */}
      <BottomBar
        settings={settings}
        todaySalesTotal={todaySalesTotal}
        todaySalesCount={todaySales.length}
        todayCashTotal={todayCashTotal}
        todayCardTotal={todayCardTotal}
        todayQrTotal={todayQrTotal}
        pendingCredits={pendingCredits}
        onOpenCreditModal={() => setIsCreditModalOpen(true)}
      />

      {/* Receipt Modal (Supports print directly to paper) */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        items={reprintSale ? reprintSale.items : cart}
        subtotal={reprintSale ? reprintSale.totalAmount : subtotal}
        discount={reprintSale ? 0 : discount}
        grandTotal={reprintSale ? reprintSale.totalAmount : grandTotal}
        cashReceived={reprintSale ? reprintSale.cashReceived : (paymentMethod === 'cash' ? cashReceived : grandTotal)}
        changeGiven={reprintSale ? reprintSale.changeGiven : (paymentMethod === 'cash' ? changeGiven : 0)}
        billNumber={reprintSale ? reprintSale.billNumber : currentBillNumber}
        settings={settings}
        dateStr={reprintSale ? new Date(reprintSale.timestamp).toLocaleString() : undefined}
        customerPhone={reprintSale ? reprintSale.customerPhone : customerPhone}
        customerName={reprintSale ? reprintSale.customerName : customerName}
        paymentMethod={reprintSale ? reprintSale.paymentMethod : paymentMethod}
        paymentDetails={reprintSale ? reprintSale.paymentDetails : paymentDetails}
      />

      {/* Variant Selection Modal (Color / Specification for Product) */}
      <VariantSelectModal
        isOpen={!!variantModalProduct}
        onClose={() => setVariantModalProduct(null)}
        product={variantModalProduct}
        settings={settings}
        onConfirmVariant={(prod, variant, qty) => {
          handleAddToCart(prod, qty, variant);
          setVariantModalProduct(null);
        }}
      />

      {/* Credit & Debt Settlement Modal
          "එම කොටුව Credit ලෙස නම් කරන්න. මුදල් ලැබුනු දවසක අදාල මුදල පියවීමට අවශ්‍ය ලෙස සකසන්න...
           ණය සම්පූර්ණයෙන් ගෙවා නිම කරන්නේ නම් අදාල කොටස ඉවත් වී ගෙවූ මුදල අද දින ආදායමට එකතු වේ" */}
      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        settings={settings}
        credits={credits}
        onUpdateCredits={handleSaveCredits}
        onSaveCredits={handleSaveCredits}
        onRecordCreditPayment={handleRecordCreditPayment}
        onRecordPayment={handleRecordCreditPayment}
      />

      {/* Product Catalog / Pre-set Prices Manager */}
      <ManageProductsModal
        isOpen={isManageProductsOpen}
        onClose={() => setIsManageProductsOpen(false)}
        products={products}
        settings={settings}
        onSaveProducts={handleSaveProducts}
      />

      {/* Sales History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sales={salesHistory}
        settings={settings}
        onReprint={handleReprint}
        onClearHistory={handleClearHistory}
      />

      {/* Settings Modal (Shop Name, Phone, Currency, Notes, My Customers Directory) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setSettingsInitialTab('settings');
        }}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        customers={customers}
        onUpdateCustomers={handleSaveCustomers}
        billCounter={billCounter}
        onUpdateBillCounter={(counter) => {
          setBillCounter(counter);
          try {
            localStorage.setItem(STORAGE_BILL_COUNTER, counter.toString());
          } catch {}
        }}
        initialTab={settingsInitialTab}
        onSelectCustomerForBill={(c) => {
          setCustomerPhone(c.phone);
          setCustomerName(c.name);
        }}
      />

      {/* Windows PC Setup & Installation Guide Modal */}
      <InstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
        settings={settings}
        onExportAllData={handleExportAllData}
      />

      {/* Auto Bill PDF Send Confirmation Modal */}
      <BillPdfSendModal
        isOpen={isBillPdfSendOpen}
        sale={lastCompletedSale}
        settings={settings}
        onClose={() => setIsBillPdfSendOpen(false)}
      />
    </div>
  );
}
