import { jsPDF } from 'jspdf';
import { SaleRecord, CartItem, StoreSettings } from '../types';

export interface BillPdfData {
  billNumber: string;
  timestamp: number;
  items: CartItem[];
  totalAmount: number;
  cashReceived: number;
  changeGiven: number;
  customerPhone?: string;
  customerName?: string;
  discount?: number;
}

/**
 * Clean phone number for WhatsApp wa.me link
 * Handles Sri Lankan numbers (e.g. 0771234567 -> 94771234567, +94..., etc.)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // Sri Lankan local format starting with 0 (e.g. 077..., 071...)
  if (digits.startsWith('0') && digits.length === 10) {
    return '94' + digits.substring(1);
  }
  // Already has 94
  if (digits.startsWith('94')) {
    return digits;
  }
  // International with 94 or other country codes
  return digits;
}

/**
 * Generate formatted WhatsApp message text with receipt details
 */
export function generateWhatsAppMessage(sale: BillPdfData, settings: StoreSettings): string {
  const shopName = settings.shopNameSi || settings.shopName || 'Retail Store';
  const dateStr = new Date(sale.timestamp).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const currency = settings.currency || 'Rs.';

  let itemsText = '';
  sale.items.forEach((item, index) => {
    const itemName = item.nameSi || item.nameEn || item.name;
    itemsText += `${index + 1}. *${itemName}*\n   ${item.quantity} ${item.unit || ''} x ${currency} ${item.price.toFixed(2)} = *${currency} ${item.total.toFixed(2)}*\n`;
  });

  const bankName = settings.bankName || 'Bank of Ceylon';
  const accountName = settings.bankAccountName || 'R W G S BANDARA';
  const accountNumber = settings.bankAccountNumber || '82276333';
  const branchLine = settings.bankBranch ? `Branch: ${settings.bankBranch}\n` : '';

  const msg =
`🧾 *${shopName.toUpperCase()}*
📍 ${settings.address || 'Sri Lanka'}
📞 Tel: ${settings.phone || ''}
---------------------------------
*INVOICE / බිල්පත: ${sale.billNumber}*
📅 දිනය: ${dateStr}
${sale.customerPhone ? `👤 පාරිභෝගික: ${sale.customerPhone} ${sale.customerName ? `(${sale.customerName})` : ''}\n` : ''}---------------------------------
*භාණ්ඩ ලැයිස්තුව (Items):*
${itemsText}---------------------------------
💰 *මුළු එකතුව (Total): ${currency} ${sale.totalAmount.toFixed(2)}*
💵 ගෙවූ මුදල (Cash): ${currency} ${sale.cashReceived.toFixed(2)}
🪙 ඉතුරු මුදල (Change): ${currency} ${sale.changeGiven.toFixed(2)}
---------------------------------
🏦 *For online financial transactions:*
Bank: ${bankName}
A/C Name: ${accountName}
A/C No: ${accountNumber}
${branchLine}---------------------------------
${settings.billFooterNote || 'ස්තූතියි! නැවත පැමිණෙන්න!'}

✨ *Powered By Apex Lanka Solution*`;

  return msg;
}

/**
 * Generate a clean POS Receipt PDF using jsPDF
 */
export function createBillPdfDocument(sale: BillPdfData, settings: StoreSettings): jsPDF {
  // 80mm width standard thermal slip representation, variable height
  const baseHeight = 160 + sale.items.length * 10;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, Math.max(180, baseHeight)],
  });

  const pageWidth = 80;
  let y = 10;

  // Header - Shop Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const shopTitle = settings.shopName || 'RETAIL POS';
  doc.text(shopTitle, pageWidth / 2, y, { align: 'center' });
  y += 5;

  if (settings.shopNameSi && settings.shopNameSi !== settings.shopName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(settings.shopNameSi, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  // Address & Phone
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (settings.address) {
    const addressLines = doc.splitTextToSize(settings.address, pageWidth - 10);
    doc.text(addressLines, pageWidth / 2, y, { align: 'center' });
    y += addressLines.length * 3.5;
  }
  if (settings.phone) {
    doc.text(`Tel: ${settings.phone}`, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  // Dashed Line
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, pageWidth - 5, y);
  y += 4;

  // Bill Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`INVOICE: ${sale.billNumber}`, 5, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const dateStr = new Date(sale.timestamp).toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  doc.text(`Date: ${dateStr}`, 5, y);
  y += 4;

  if (sale.customerPhone) {
    doc.text(`Customer: ${sale.customerPhone} ${sale.customerName ? `(${sale.customerName})` : ''}`, 5, y);
    y += 4;
  }

  // Dashed Line
  doc.line(5, y, pageWidth - 5, y);
  y += 4;

  // Table Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Item', 5, y);
  doc.text('Qty', 44, y, { align: 'center' });
  doc.text('Price', 58, y, { align: 'right' });
  doc.text('Total', pageWidth - 5, y, { align: 'right' });
  y += 3;

  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.2);
  doc.line(5, y, pageWidth - 5, y);
  y += 4;

  // Items List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  sale.items.forEach((item) => {
    // English/Transliterated fallback for standard PDF fonts
    const name = item.nameEn || item.name || item.nameSi || 'Item';
    const cleanName = doc.splitTextToSize(name, 36);
    doc.text(cleanName, 5, y);

    const qtyStr = `${item.quantity}${item.unit ? ' ' + item.unit : ''}`;
    doc.text(qtyStr, 44, y, { align: 'center' });
    doc.text(item.price.toFixed(2), 58, y, { align: 'right' });
    doc.text(item.total.toFixed(2), pageWidth - 5, y, { align: 'right' });

    y += Math.max(cleanName.length * 3.5, 4.5);
  });

  // Divider
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, pageWidth - 5, y);
  y += 4;

  // Totals Breakdown
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const currency = settings.currency || 'Rs.';

  const itemsSubtotal = sale.items.reduce((s, it) => s + it.total, 0);
  doc.text('Subtotal:', 5, y);
  doc.text(`${currency} ${itemsSubtotal.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
  y += 4;

  if (sale.discount && sale.discount > 0) {
    doc.text('Discount:', 5, y);
    doc.text(`-${currency} ${sale.discount.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
    y += 4;
  }

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', 5, y);
  doc.text(`${currency} ${sale.totalAmount.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
  y += 5;

  // Cash Received and Change
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Cash Tendered:', 5, y);
  doc.text(`${currency} ${sale.cashReceived.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('CHANGE / RETURN:', 5, y);
  doc.text(`${currency} ${sale.changeGiven.toFixed(2)}`, pageWidth - 5, y, { align: 'right' });
  y += 6;

  // Divider
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, pageWidth - 5, y);
  y += 5;

  // Store footer note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  if (settings.billFooterNote) {
    const noteLines = doc.splitTextToSize(settings.billFooterNote, pageWidth - 10);
    doc.text(noteLines, pageWidth / 2, y, { align: 'center' });
    y += noteLines.length * 3.5 + 2;
  }

  // REQUIRED BRANDING: "Powered By Apex Lanka Solution"
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(200, 200, 200);
  doc.line(10, y, pageWidth - 10, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138); // Deep professional blue
  doc.text('Powered By Apex Lanka Solution', pageWidth / 2, y, { align: 'center' });

  return doc;
}

/**
 * Trigger file download of the PDF
 */
export function downloadBillPdf(sale: BillPdfData, settings: StoreSettings): string {
  const doc = createBillPdfDocument(sale, settings);
  const filename = `${sale.billNumber}-Bill.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Generate PDF as a Blob (useful for Web Share API or embedding)
 */
export function getBillPdfBlob(sale: BillPdfData, settings: StoreSettings): Blob {
  const doc = createBillPdfDocument(sale, settings);
  return doc.output('blob');
}
