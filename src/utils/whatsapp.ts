import { CartItem, StoreSettings, SaleRecord } from '../types';

export interface WhatsAppBillData {
  billNumber: string;
  timestamp: number;
  items: CartItem[];
  totalAmount: number;
  cashReceived: number;
  changeGiven: number;
  paymentMethod?: string;
  paymentDetails?: string;
  customerPhone?: string;
  customerName?: string;
  discount?: number;
}

/**
 * Format any Sri Lankan or international phone number into standard international format
 * Examples:
 *   "0771234567" -> "94771234567"
 *   "071 234 5678" -> "94712345678"
 *   "+94771234567" -> "94771234567"
 *   "771234567" -> "94771234567"
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // Local SL mobile format: 07X XXX XXXX (10 digits starting with 0)
  if (digits.startsWith('0') && digits.length === 10) {
    return '94' + digits.substring(1);
  }

  // 9 digits without leading 0: 7X XXX XXXX
  if (digits.length === 9 && digits.startsWith('7')) {
    return '94' + digits;
  }

  // Already prefixed with 94
  if (digits.startsWith('94')) {
    return digits;
  }

  return digits;
}

/**
 * Generate a beautifully formatted WhatsApp text receipt
 */
export function generateWhatsAppBillMessage(sale: WhatsAppBillData, settings: StoreSettings): string {
  const shopName = settings.shopNameSi || settings.shopName || 'Retail Store';
  const currency = settings.currency || 'Rs.';
  const dateObj = new Date(sale.timestamp);
  const dateStr = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  let itemsText = '';
  sale.items.forEach((item, index) => {
    const baseName = item.nameSi || item.nameEn || item.name;
    const itemName = item.selectedVariant ? `${baseName} [${item.selectedVariant}]` : baseName;
    const qtyStr = `${item.quantity}${item.unit ? ' ' + item.unit : ''}`;
    itemsText += `${index + 1}. *${itemName}*\n   ${qtyStr} x ${currency} ${item.price.toFixed(2)} = *${currency} ${item.total.toFixed(2)}*\n`;
  });

  const methodDisplay = sale.paymentMethod === 'card' 
    ? 'Credit / Debit Card' 
    : sale.paymentMethod === 'qr' 
      ? 'QR Code (LankaQR)' 
      : sale.paymentMethod === 'credit' 
        ? 'Credit (ණයට ලබාදීම)' 
        : 'Cash (මුදල්)';

  const discountLine = sale.discount && sale.discount > 0 
    ? `🏷️ වට්ටම (Discount): - ${currency} ${sale.discount.toFixed(2)}\n` 
    : '';

  const detailsLine = sale.paymentDetails 
    ? `📝 සටහන (Note): ${sale.paymentDetails}\n` 
    : '';

  const bankName = settings.bankName || 'Bank of Ceylon';
  const accountName = settings.bankAccountName || 'R W G S BANDARA';
  const accountNumber = settings.bankAccountNumber || '82276333';
  const branchLine = settings.bankBranch ? `Branch: ${settings.bankBranch}\n` : '';

  const bankBlock = 
`══════════════════════
🏦 *For online financial transactions:*
Bank: ${bankName}
A/C Name: ${accountName}
A/C No: ${accountNumber}
${branchLine}`;

  const message =
`🧾 *${shopName.toUpperCase()}*
📍 ${settings.address || 'Sri Lanka'}
📞 Tel: ${settings.phone || ''}
══════════════════════
*INVOICE / බිල්පත: ${sale.billNumber}*
📅 දිනය: ${dateStr} | ${timeStr}
${sale.customerPhone ? `👤 පාරිභෝගික: ${sale.customerPhone} ${sale.customerName ? `(${sale.customerName})` : ''}\n` : ''}══════════════════════
*භාණ්ඩ ලැයිස්තුව (Items):*
${itemsText}══════════════════════
${discountLine}💰 *මුළු එකතුව (Total): ${currency} ${sale.totalAmount.toFixed(2)}*
💳 *ගෙවීම් ක්‍රමය (Method): ${methodDisplay}*
${sale.paymentMethod !== 'credit' ? `💵 ගෙවූ මුදල (Paid): ${currency} ${sale.cashReceived.toFixed(2)}\n🪙 ඉතුරු මුදල (Change): ${currency} ${sale.changeGiven.toFixed(2)}\n` : ''}${detailsLine}${bankBlock}══════════════════════
${settings.billFooterNote || 'ස්තූතියි! නැවත පැමිණෙන්න!'}

✨ *Powered By Apex Lanka Solution*`;

  return message;
}

/**
 * Open WhatsApp directly with targeted customer phone number and message pre-filled
 */
export function openWhatsAppChat(phone: string, message: string): boolean {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);

  // Direct WhatsApp Web / App universal link
  // If a valid phone number is present, it directly targets that person's chat
  const waUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  // Attempt window open
  const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
  return !!win;
}
