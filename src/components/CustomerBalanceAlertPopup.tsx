import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Wallet, 
  Plus, 
  Minus, 
  X, 
  Check, 
  FileText, 
  Calendar, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Customer, Invoice } from '../types';

interface CustomerBalanceAlertPopupProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  pendingInvoices?: Invoice[];
  currentDueAdded: number;
  currentAdvanceAdjusted: number;
  onApplyDue: (amount: number) => void;
  onRemoveDue: () => void;
  onApplyAdvance: (amount: number) => void;
  onRemoveAdvance: () => void;
  cartTotal?: number;
}

export const CustomerBalanceAlertPopup: React.FC<CustomerBalanceAlertPopupProps> = ({
  isOpen,
  onClose,
  customer,
  pendingInvoices = [],
  currentDueAdded,
  currentAdvanceAdjusted,
  onApplyDue,
  onRemoveDue,
  onApplyAdvance,
  onRemoveAdvance,
  cartTotal = 0
}) => {
  const dueAmount = customer.outstandingCredit || 0;
  const advanceAmount = customer.advanceBalance || 0;

  // Local inputs for custom amounts
  const [customDueInput, setCustomDueInput] = useState<string>(String(dueAmount));
  const [customAdvanceInput, setCustomAdvanceInput] = useState<string>(
    String(cartTotal > 0 ? Math.min(advanceAmount, cartTotal) : advanceAmount)
  );

  // Sync inputs when customer changes
  useEffect(() => {
    setCustomDueInput(String(dueAmount));
    setCustomAdvanceInput(
      String(cartTotal > 0 ? Math.min(advanceAmount, cartTotal) : advanceAmount)
    );
  }, [customer.id, dueAmount, advanceAmount, cartTotal]);

  if (!isOpen) return null;
  if (dueAmount <= 0 && advanceAmount <= 0) return null;

  const handleAddDueSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseFloat(customDueInput);
    if (!isNaN(val) && val > 0) {
      onApplyDue(Math.min(val, dueAmount));
    }
  };

  const handleDeductAdvanceSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseFloat(customAdvanceInput);
    if (!isNaN(val) && val > 0) {
      onApplyAdvance(Math.min(val, advanceAmount));
    }
  };

  return (
    <div
      id="customer-balance-popup-container"
      className="fixed right-3 sm:right-6 top-16 z-50 w-[92vw] sm:w-96 max-w-md animate-in slide-in-from-right-8 duration-300 pointer-events-auto"
    >
      <div className="rounded-2xl border-2 border-amber-500/80 bg-white/95 backdrop-blur-md p-4 shadow-2xl ring-4 ring-amber-500/10 text-slate-800 transition-all">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-900 ring-2 ring-amber-400/50">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <span>Customer Ledger Alert</span>
                <span className="rounded bg-amber-200/80 px-1.5 py-0.2 text-[9px] font-bold text-amber-900">
                  {customer.mobileNumber}
                </span>
              </h4>
              <p className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">
                {customer.name} {customer.businessName ? `• ${customer.businessName}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Minimize popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 py-3 max-h-[75vh] overflow-y-auto pr-1">
          {/* 1. PREVIOUS BILL DUE SECTION */}
          {dueAmount > 0 && (
            <div className={`rounded-xl border p-3 transition-all ${
              currentDueAdded > 0 
                ? 'border-rose-400 bg-rose-50/70' 
                : 'border-amber-300 bg-amber-50/50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <FileText className="h-3 w-3" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Previous Bill Due (पिछला बकाया)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Unsettled balance from prior purchases
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black font-mono text-rose-700 block">
                    ₹{dueAmount.toLocaleString()}
                  </span>
                  {currentDueAdded > 0 && (
                    <span className="text-[9px] font-bold text-rose-800 bg-rose-200/80 px-1 rounded">
                      +₹{currentDueAdded} in Bill
                    </span>
                  )}
                </div>
              </div>

              {/* Unpaid Invoices Summary if found */}
              {pendingInvoices.length > 0 && (
                <div className="mt-2 pt-2 border-t border-rose-200/60 text-[10px] space-y-1">
                  <span className="text-slate-500 font-semibold block">Pending Invoices:</span>
                  {pendingInvoices.slice(0, 2).map(inv => (
                    <div key={inv.id} className="flex justify-between text-slate-700 font-mono bg-white/70 px-2 py-0.5 rounded border border-rose-200/40">
                      <span>{inv.invoiceNo} ({new Date(inv.date).toLocaleDateString()})</span>
                      <span className="font-bold text-rose-700">₹{(inv.grandTotal - (inv.creditPaidAmount || 0)).toLocaleString()} Due</span>
                    </div>
                  ))}
                  {pendingInvoices.length > 2 && (
                    <span className="text-[9px] text-slate-400 italic block">
                      +{pendingInvoices.length - 2} more unpaid invoices
                    </span>
                  )}
                </div>
              )}

              {/* Due Action Controls */}
              <div className="mt-3 pt-2.5 border-t border-rose-200/60">
                {currentDueAdded > 0 ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-rose-900 font-bold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-rose-700" />
                      <span>Added to Bill: ₹{currentDueAdded.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      id="remove-due-from-bill-btn"
                      onClick={onRemoveDue}
                      className="px-2.5 py-1 text-[11px] font-bold text-rose-800 bg-white hover:bg-rose-100 rounded-lg border border-rose-300 shadow-2xs transition-colors"
                      title="Remove previous due from current bill"
                    >
                      Remove from Bill (हटाएं)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-mono">₹</span>
                        <input
                          type="number"
                          id="input-custom-due-amount"
                          min={1}
                          max={dueAmount}
                          value={customDueInput}
                          onChange={e => setCustomDueInput(e.target.value)}
                          placeholder={String(dueAmount)}
                          className="w-full pl-5 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                        />
                      </div>
                      <button
                        type="button"
                        id="add-due-to-bill-btn"
                        onClick={() => handleAddDueSubmit()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
                        title="Add this previous due amount to current bill"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add to Bill (+ जोड़ें)</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>Quick:</span>
                        <button
                          type="button"
                          onClick={() => setCustomDueInput(String(dueAmount))}
                          className="font-mono text-rose-700 hover:underline font-bold"
                        >
                          Full (₹{dueAmount})
                        </button>
                        {dueAmount > 200 && (
                          <>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setCustomDueInput(String(Math.floor(dueAmount / 2)))}
                              className="font-mono text-rose-700 hover:underline font-bold"
                            >
                              Half (₹{Math.floor(dueAmount / 2)})
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-800 font-medium hover:underline"
                      >
                        Ignore Due (अलग रखें)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. ADVANCE PAYMENT AVAILABLE SECTION */}
          {advanceAmount > 0 && (
            <div className={`rounded-xl border p-3 transition-all ${
              currentAdvanceAdjusted > 0 
                ? 'border-emerald-400 bg-emerald-50/70' 
                : 'border-teal-300 bg-teal-50/50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Wallet className="h-3 w-3" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Advance Balance (जमा अग्रिम राशि)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Prepaid balance available to deduct
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black font-mono text-emerald-700 block">
                    ₹{advanceAmount.toLocaleString()}
                  </span>
                  {currentAdvanceAdjusted > 0 && (
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-200/80 px-1 rounded">
                      -₹{currentAdvanceAdjusted} in Bill
                    </span>
                  )}
                </div>
              </div>

              {/* Advance Action Controls */}
              <div className="mt-3 pt-2.5 border-t border-emerald-200/60">
                {currentAdvanceAdjusted > 0 ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-emerald-900 font-bold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Deducted: -₹{currentAdvanceAdjusted.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      id="remove-advance-from-bill-btn"
                      onClick={onRemoveAdvance}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-300 shadow-2xs transition-colors"
                      title="Do not deduct advance from this bill"
                    >
                      Remove from Bill (मत घटाएं)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-mono">₹</span>
                        <input
                          type="number"
                          id="input-custom-advance-amount"
                          min={1}
                          max={advanceAmount}
                          value={customAdvanceInput}
                          onChange={e => setCustomAdvanceInput(e.target.value)}
                          placeholder={String(advanceAmount)}
                          className="w-full pl-5 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                      <button
                        type="button"
                        id="deduct-advance-from-bill-btn"
                        onClick={() => handleDeductAdvanceSubmit()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                        title="Deduct advance from current bill"
                      >
                        <Minus className="h-3 w-3" />
                        <span>Deduct (- घटाएं)</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>Quick:</span>
                        <button
                          type="button"
                          onClick={() => setCustomAdvanceInput(String(advanceAmount))}
                          className="font-mono text-emerald-700 hover:underline font-bold"
                        >
                          Full (₹{advanceAmount})
                        </button>
                        {cartTotal > 0 && cartTotal < advanceAmount && (
                          <>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setCustomAdvanceInput(String(cartTotal))}
                              className="font-mono text-emerald-700 hover:underline font-bold"
                            >
                              Cover Bill (₹{cartTotal})
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-800 font-medium hover:underline"
                      >
                        Keep for Later (सुरक्षित रखें)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>Editable anytime in cart before billing</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold hover:underline"
          >
            Dismiss [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};
