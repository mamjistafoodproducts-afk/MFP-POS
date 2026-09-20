import React, { useEffect } from 'react';
import { 
  Printer, 
  Share2, 
  CheckCircle2, 
  X, 
  Calendar, 
  Phone, 
  User, 
  Building2, 
  Clock,
  CreditCard,
  Plus
} from 'lucide-react';
import { Invoice, PosSettings } from '../types';
import { DEFAULT_STORE_PROFILE } from '../utils/posSettingsStorage';

interface InvoiceReceiptModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onNewBill: () => void;
  posSettings?: PosSettings;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  onClose,
  onNewBill,
  posSettings
}) => {
  const profile = posSettings?.storeProfile || DEFAULT_STORE_PROFILE;
  const paperSize = posSettings?.receiptPaperSize || '80mm';

  const handlePrint = () => {
    window.print();
  };

  // Auto-print if enabled in settings
  useEffect(() => {
    if (invoice && posSettings?.autoPrintReceipt) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [invoice, posSettings?.autoPrintReceipt]);

  // Keyboard navigation inside receipt modal
  useEffect(() => {
    if (!invoice) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePrint();
        return;
      }
      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleWhatsAppShare();
        return;
      }
      if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onNewBill();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invoice, onNewBill]);

  if (!invoice) return null;

  const handleWhatsAppShare = () => {
    const itemsText = invoice.items
      .map(
        it =>
          `• ${it.name} (${it.packSize}) x ${it.quantity} = ₹${it.total.toFixed(0)}`
      )
      .join('\n');

    const creditDueNotice =
      invoice.paymentMethod === 'Credit-7-Days'
        ? `\n\n⚠️ *7-DAY CREDIT DUE DATE: ${invoice.creditDueDate}*\nPlease clear within 7 days.`
        : '';

    const text = encodeURIComponent(
      `*${profile.storeNameHindi || profile.storeName}*\n` +
      `*INVOICE: ${invoice.invoiceNo}*\n` +
      `Date: ${new Date(invoice.date).toLocaleDateString()} ${new Date(invoice.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
      `Customer: ${invoice.customerName} (${invoice.customerMobile})\n` +
      `${invoice.customerBusinessName ? `Firm: ${invoice.customerBusinessName}\n` : ''}` +
      `--------------------------------\n` +
      `${itemsText}\n` +
      `--------------------------------\n` +
      `Subtotal: ₹${invoice.subtotal}\n` +
      `GST Tax: ₹${invoice.taxAmount}\n` +
      `*Total Amount: ₹${invoice.grandTotal}*\n` +
      `Payment Mode: *${invoice.paymentMethod}*` +
      creditDueNotice +
      `\n\n${profile.receiptFooterNote || 'Thank you for your business!'}`
    );

    const cleanMobile = invoice.customerMobile.replace(/\D/g, '');
    const url = cleanMobile && cleanMobile.length === 10 && cleanMobile !== '0000000000'
      ? `https://wa.me/91${cleanMobile}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(url, '_blank');
  };

  // Width container based on paper size
  const paperContainerClass = 
    paperSize === '58mm'
      ? 'max-w-xs text-xs'
      : paperSize === 'A4'
      ? 'max-w-2xl text-sm'
      : 'max-w-lg text-sm'; // 80mm standard

  return (
    <div id="invoice-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`relative w-full ${paperContainerClass} rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-6`}>
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <span className="text-sm font-bold text-slate-800 block">
                Invoice Generated Successfully
              </span>
              <span className="text-[10px] text-slate-400">
                Paper: {paperSize} • Press [P] to print, [W] for WhatsApp, [N] for Next
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="p-6 text-slate-800 text-sm max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Mill Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            {profile.storeNameHindi && (
              <h1 className="text-xl font-black text-amber-900 tracking-tight">
                {profile.storeNameHindi}
              </h1>
            )}
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {profile.storeName}
            </p>
            {profile.tagline && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {profile.tagline}
              </p>
            )}
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              GSTIN: {profile.gstin} | FSSAI: {profile.fssaiNumber}
            </p>
            <p className="text-[10px] text-slate-500">
              {profile.address} | Mob: {profile.phone}
            </p>
          </div>

          {/* Invoice Meta */}
          <div className="py-3 border-b border-dashed border-slate-300 text-xs flex justify-between">
            <div>
              <p><span className="text-slate-500">Invoice No:</span> <strong className="font-mono text-slate-900">{invoice.invoiceNo}</strong></p>
              <p><span className="text-slate-500">Date:</span> {new Date(invoice.date).toLocaleDateString()} {new Date(invoice.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                invoice.customerType === 'B2B' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {invoice.customerType === 'B2B' ? 'Wholesale (B2B)' : 'Retail (B2C)'}
              </span>
              <p className="text-[11px] font-medium text-slate-600 mt-1">
                Type: {invoice.paymentMethod}
              </p>
            </div>
          </div>

          {/* Customer details */}
          <div className="py-2.5 border-b border-dashed border-slate-300 text-xs">
            <div className="flex justify-between">
              <span>Customer: <strong>{invoice.customerName}</strong></span>
              <span>Mob: <strong className="font-mono">{invoice.customerMobile}</strong></span>
            </div>
            {invoice.customerBusinessName && (
              <p className="text-slate-600 mt-0.5">Firm: <strong>{invoice.customerBusinessName}</strong></p>
            )}
            {invoice.customerGst && (
              <p className="text-slate-500 font-mono text-[10px] mt-0.5">GSTIN: {invoice.customerGst}</p>
            )}
          </div>

          {/* Items Table */}
          <div className="py-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 pb-1 font-semibold">
                  <th className="py-1">Item / Pack</th>
                  <th className="py-1 text-center">Batch</th>
                  <th className="py-1 text-right">Qty</th>
                  <th className="py-1 text-right">Rate</th>
                  <th className="py-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="py-1.5">
                    <td className="py-1.5 pr-1">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.packSize} {item.hindiName ? `• ${item.hindiName}` : ''}</div>
                    </td>
                    <td className="py-1.5 text-center text-[10px] font-mono text-slate-600">
                      {item.fifoAllocations?.map(f => f.batchId.replace('BATCH-', '')).join(', ') || 'FIFO'}
                    </td>
                    <td className="py-1.5 text-right font-medium text-slate-800">{item.quantity}</td>
                    <td className="py-1.5 text-right text-slate-600 font-mono">₹{item.unitPrice}</td>
                    <td className="py-1.5 text-right font-bold text-slate-900 font-mono">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary / Totals */}
          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span className="font-mono">-₹{invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Total GST Tax:</span>
              <span className="font-mono">₹{invoice.taxAmount.toFixed(2)}</span>
            </div>
            {invoice.previousDueAdded && invoice.previousDueAdded > 0 && (
              <div className="flex justify-between text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded">
                <span>+ Previous Due Added (पिछला बकाया):</span>
                <span className="font-mono">+₹{invoice.previousDueAdded.toFixed(2)}</span>
              </div>
            )}
            {invoice.advanceAdjusted && invoice.advanceAdjusted > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                <span>- Advance Adjusted (अग्रिम राशि):</span>
                <span className="font-mono">-₹{invoice.advanceAdjusted.toFixed(2)}</span>
              </div>
            )}
            {invoice.roundOff !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Round Off:</span>
                <span className="font-mono">₹{invoice.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-300 text-base font-black text-slate-950">
              <span>Grand Total Payable:</span>
              <span className="font-mono text-lg text-amber-950">₹{invoice.grandTotal}</span>
            </div>
          </div>

          {/* Customer Ledger Balance Status after this invoice */}
          {(invoice.previousDueAdded || invoice.advanceAdjusted || invoice.previousOutstandingBefore) && (
            <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-600 space-y-0.5">
              <span className="font-bold text-slate-700 block">Customer Balance Summary:</span>
              {invoice.previousOutstandingBefore !== undefined && invoice.previousOutstandingBefore > 0 && (
                <div className="flex justify-between">
                  <span>Previous Due before this bill:</span>
                  <span className="font-mono">₹{invoice.previousOutstandingBefore.toLocaleString()}</span>
                </div>
              )}
              {invoice.previousDueAdded && invoice.previousDueAdded > 0 && invoice.paymentMethod !== 'Credit-7-Days' && (
                <div className="flex justify-between font-medium text-emerald-800">
                  <span>Due settled in this bill:</span>
                  <span className="font-mono">₹{invoice.previousDueAdded.toLocaleString()} (Paid)</span>
                </div>
              )}
              {invoice.advanceBalanceBefore !== undefined && invoice.advanceBalanceBefore > 0 && (
                <div className="flex justify-between">
                  <span>Advance balance before this bill:</span>
                  <span className="font-mono">₹{invoice.advanceBalanceBefore.toLocaleString()}</span>
                </div>
              )}
              {invoice.advanceAdjusted && invoice.advanceAdjusted > 0 && (
                <div className="flex justify-between font-medium text-emerald-800">
                  <span>Advance adjusted in this bill:</span>
                  <span className="font-mono">₹{invoice.advanceAdjusted.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* 7-Day Credit Callout */}
          {invoice.paymentMethod === 'Credit-7-Days' && (
            <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-rose-800 font-bold text-xs">
                <Clock className="h-4 w-4" />
                <span>B2B 7-DAY CREDIT BILLING</span>
              </div>
              <p className="text-xs text-rose-900 font-semibold mt-1">
                Due Date: <span className="font-mono text-sm underline">{invoice.creditDueDate}</span>
              </p>
              <p className="text-[10px] text-rose-700 mt-0.5">
                Kindly remit payment on or before the due date to maintain your wholesale credit line.
              </p>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400">
            {profile.receiptFooterNote || 'Thank you for buying fresh & pure! Quality Guaranteed.'}
            <br />
            {profile.terms}
          </div>
        </div>

        {/* Action Buttons with Keyboard Keys */}
        <div className="flex flex-col sm:flex-row items-center gap-2 border-t border-slate-200 bg-slate-50 p-4">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 px-4 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
            <kbd className="text-[10px] font-mono bg-slate-800 px-1 rounded text-slate-300">[P]</kbd>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Share2 className="h-4 w-4" />
            <span>WhatsApp Bill</span>
            <kbd className="text-[10px] font-mono bg-emerald-700 px-1 rounded text-emerald-200">[W]</kbd>
          </button>

          <button
            type="button"
            onClick={onNewBill}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-700 py-3 px-4 text-xs font-bold text-white hover:bg-amber-800 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Next Customer</span>
            <kbd className="text-[10px] font-mono bg-amber-800 px-1 rounded text-amber-200">[N]</kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
