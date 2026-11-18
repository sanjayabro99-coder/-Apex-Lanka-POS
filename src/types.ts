export type Language = 'si' | 'en';

export type PaymentMethod = 'cash' | 'credit' | 'qr' | 'card';

export interface ProductItem {
  id: string;
  code: string;
  nameSi: string;
  nameEn: string;
  price: number;
  category: string;
  unit: string; // e.g. 'කෑලි (pcs)', 'kg', 'පැකට් (pkt)', 'ලීටර් (L)'
  color?: string;
  variants?: string[]; // Up to 5 colors/specifications
}

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  nameSi: string;
  nameEn: string;
  price: number;
  quantity: number;
  unit: string;
  total: number;
  selectedVariant?: string;
  availableVariants?: string[];
}

export interface SaleRecord {
  id: string;
  billNumber: string;
  timestamp: number;
  items: CartItem[];
  totalAmount: number;
  cashReceived: number;
  changeGiven: number;
  itemCount: number;
  totalQuantity: number;
  customerPhone?: string;
  customerName?: string;
  paymentMethod?: PaymentMethod;
  paymentDetails?: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  totalSpent: number;
  visitsCount: number;
  lastVisit: number;
}

export interface CreditPayment {
  id: string;
  date: number; // timestamp
  amount: number;
  paymentMethod?: 'cash' | 'card' | 'qr';
  note?: string;
}

export interface CreditPaymentLog {
  id: string;
  creditId: string;
  customerName: string;
  customerPhone?: string;
  date: number; // timestamp
  amount: number;
  paymentMethod: 'cash' | 'card' | 'qr';
  note?: string;
  billNumber?: string;
}

export interface CreditRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  originalAmount: number;
  remainingAmount: number;
  paidAmount: number;
  initialDate: number; // timestamp
  lastUpdatedDate: number; // timestamp
  billNumber: string;
  itemsSummary?: string;
  status: 'pending' | 'partially_paid' | 'paid';
  payments: CreditPayment[];
}

export interface StoreSettings {
  shopName: string;
  shopNameSi: string;
  address: string;
  phone: string;
  billHeaderNote: string;
  billFooterNote: string;
  currency: string;
  soundEffects: boolean;
  language: Language;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  backgroundColor?: string;
}
