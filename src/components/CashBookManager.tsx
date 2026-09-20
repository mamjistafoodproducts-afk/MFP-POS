import React, { useState, useMemo } from 'react';
import { 
  Banknote, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Calendar, 
  Calculator, 
  Receipt, 
  User, 
  Building2, 
  Clock,
  Sparkles,
  Coins,
  Edit2,
  Trash2,
  X,
  AlertTriangle
} from 'lucide-react';
import { CashTransaction, CashCategory, Customer } from '../types';

interface CashBookManagerProps {
  transactions: CashTransaction[];
  customers: Customer[];
  onAddTransaction: (tx: CashTransaction) => void;
  onUpdateTransaction?: (tx: CashTransaction) => void;
  onDeleteTransaction?: (txId: string) => void;
  onCustomerRepayment?: (customerId: string, amount: number) => void;
}

const CATEGORY_LABELS: Record<CashCategory, { label: string; hindi: string; type: 'CASH_IN' | 'CASH_OUT' }> = {
  BILLING_CASH: { label: 'Counter Cash Billing', hindi: 'दुकान नकद बिक्री', type: 'CASH_IN' },
  CREDIT_REPAYMENT: { label: 'Customer Credit Repayment', hindi: 'उधारी वसूली (क्रेडिट भुगतान)', type: 'CASH_IN' },
  OWNER_CAPITAL: { label: 'Owner Capital / Cash In', hindi: 'मालिक द्वारा नकद जमा', type: 'CASH_IN' },
  SUPPLIER_PAYMENT: { label: 'Supplier Cash Payment', hindi: 'सप्लायर को नकद भुगतान', type: 'CASH_OUT' },
  GRAIN_PURCHASE: { label: 'Raw Grain / Mandi Cash', hindi: 'कच्चा माल/अनाज नकद खरीद', type: 'CASH_OUT' },
  LABOR_WAGES: { label: 'Labor Wages & Hamali', hindi: 'मजदूरी एवं पल्लेदारी', type: 'CASH_OUT' },
  ELECTRICITY_MILLING: { label: 'Electricity & Milling Fuel', hindi: 'चक्की बिजली/डीजल खर्च', type: 'CASH_OUT' },
  PACKAGING_MATERIAL: { label: 'Packaging Bags & Pouches', hindi: 'पैकिंग बोरी व पाउच खर्च', type: 'CASH_OUT' },
  TEA_EXPENSE: { label: 'Daily Tea & Refreshments', hindi: 'दुकान चाय-पानी खर्च', type: 'CASH_OUT' },
  MISC: { label: 'Miscellaneous Expense', hindi: 'अन्य फुटकर खर्च', type: 'CASH_OUT' }
};

export const CashBookManager: React.FC<CashBookManagerProps> = ({
  transactions,
  customers,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onCustomerRepayment
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [entryType, setEntryType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
  const [selectedCategory, setSelectedCategory] = useState<CashCategory>('BILLING_CASH');
  const [amountInput, setAmountInput] = useState<string>('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Edit Transaction State
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null);

  // Delete Transaction State
  const [deletingTx, setDeletingTx] = useState<CashTransaction | null>(null);

  // Cash Drawer Denomination Calculator State (गल्ला मिलान)
  const [denominations, setDenominations] = useState<Record<number, number>>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0
  });

  const handleDenomChange = (denom: number, countStr: string) => {
    const val = parseInt(countStr) || 0;
    setDenominations(prev => ({
      ...prev,
      [denom]: Math.max(0, val)
    }));
  };

  const calculatedDrawerCash = useMemo(() => {
    return Object.entries(denominations).reduce((acc, [denom, count]) => {
      return acc + (Number(denom) * Number(count));
    }, 0);
  }, [denominations]);

  // Aggregate Today's Cash Flow
  const { totalCashIn, totalCashOut, netBalance } = useMemo(() => {
    let inSum = 0;
    let outSum = 0;

    transactions.forEach(t => {
      if (t.type === 'CASH_IN') inSum += t.amount;
      else outSum += t.amount;
    });

    return {
      totalCashIn: inSum,
      totalCashOut: outSum,
      netBalance: inSum - outSum
    };
  }, [transactions]);

  const drawerDifference = calculatedDrawerCash - netBalance;

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) return;

    let desc = descriptionInput.trim();
    if (selectedCategory === 'CREDIT_REPAYMENT' && selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        desc = `Credit payment from ${cust.name}${cust.businessName ? ` (${cust.businessName})` : ''}: ${desc}`;
        if (onCustomerRepayment) {
          onCustomerRepayment(cust.id, amount);
        }
      }
    }

    const newTx: CashTransaction = {
      id: `ctx-${Date.now()}`,
      date: new Date().toISOString(),
      type: entryType,
      category: selectedCategory,
      amount,
      description: desc || CATEGORY_LABELS[selectedCategory].label,
      refId: selectedCustomerId || undefined
    };

    onAddTransaction(newTx);
    setShowAddModal(false);
    setAmountInput('');
    setDescriptionInput('');
    setSelectedCustomerId('');
  };

  const handleSaveTransactionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    if (onUpdateTransaction) {
      onUpdateTransaction(editingTransaction);
    }
    setEditingTransaction(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingTx) return;
    if (onDeleteTransaction) {
      onDeleteTransaction(deletingTx.id);
    }
    setDeletingTx(null);
  };

  return (
    <div id="cash-book-manager" className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Cash in Drawer</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold">
              ₹
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">₹{netBalance.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Calculated from day's in &amp; out transactions</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Cash Received</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">+₹{totalCashIn.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Counter sales &amp; credit repayments</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Cash Paid Out</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-700">-₹{totalCashOut.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Wages, Mandi grains, tea, diesel expenses</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Physical Drawer Tally</span>
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              drawerDifference === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              <Coins className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">₹{calculatedDrawerCash.toLocaleString()}</p>
          <p className={`text-[11px] mt-0.5 font-bold ${
            drawerDifference === 0 ? 'text-emerald-600' : 'text-amber-700'
          }`}>
            {drawerDifference === 0 ? '✓ Exact Matched' : `Diff: ${drawerDifference > 0 ? '+' : ''}₹${drawerDifference}`}
          </p>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Cash Book &amp; Day Book Register (रोकड़ बही / गल्ला)
          </h3>
          <p className="text-xs text-slate-500">
            Instant logging, note tallying, and editable transactions for accurate daily audit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEntryType('CASH_OUT');
              setSelectedCategory('LABOR_WAGES');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 shadow-2xs whitespace-nowrap"
          >
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
            <span>Cash Out (भुगतान)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEntryType('CASH_IN');
              setSelectedCategory('BILLING_CASH');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs whitespace-nowrap"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Cash In (प्राप्ति)</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Transactions Register vs Denomination Tally */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions List */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-800" />
              <h4 className="font-bold text-slate-900 text-sm">
                Cash Transaction Ledger (आज का लेन-देन)
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {transactions.length} entries recorded
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No cash transactions recorded for today.
              </div>
            ) : (
              [...transactions].reverse().map(tx => {
                const isCashIn = tx.type === 'CASH_IN';
                const catInfo = CATEGORY_LABELS[tx.category] || {
                  label: tx.category,
                  hindi: ''
                };

                return (
                  <div key={tx.id} className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold shrink-0 ${
                        isCashIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {isCashIn ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {catInfo.label}
                          </span>
                          <span className="text-[11px] text-amber-800 hidden sm:inline">
                            ({catInfo.hindi})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {tx.refId && ` • Ref: ${tx.refId}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`font-mono text-sm sm:text-base font-black ${
                          isCashIn ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isCashIn ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </span>
                        <span className={`block text-[10px] font-bold uppercase tracking-wider ${
                          isCashIn ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isCashIn ? 'CASH IN' : 'CASH OUT'}
                        </span>
                      </div>

                      {/* Edit Transaction */}
                      <button
                        type="button"
                        onClick={() => setEditingTransaction({ ...tx })}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Entry"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Transaction */}
                      <button
                        type="button"
                        onClick={() => setDeletingTx(tx)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cash Denomination Tally (गल्ला मिलान) */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calculator className="h-5 w-5 text-amber-800" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Cash Drawer Tally (गल्ला नोट मिलान)
              </h3>
              <p className="text-[11px] text-slate-500">Count physical currency notes in register</p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {[500, 200, 100, 50, 20, 10, 5].map(denom => (
              <div key={denom} className="flex items-center justify-between text-xs">
                <span className="font-bold font-mono text-slate-700 w-16">
                  ₹{denom} x
                </span>
                <input
                  type="number"
                  min={0}
                  value={denominations[denom] || ''}
                  onChange={e => handleDenomChange(denom, e.target.value)}
                  placeholder="0"
                  className="w-20 text-center rounded-lg border border-slate-300 py-1 px-2 font-mono text-xs focus:border-amber-600 focus:outline-none"
                />
                <span className="font-mono font-bold text-slate-900 w-20 text-right">
                  = ₹{(denom * (denominations[denom] || 0)).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Physical Counted:</span>
              <span className="font-mono font-bold text-slate-900">₹{calculatedDrawerCash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>System Register Balance:</span>
              <span className="font-mono font-bold text-slate-900">₹{netBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-xs font-bold">
              <span>Difference / अंतर:</span>
              <span className={`font-mono text-sm font-black ${
                drawerDifference === 0 
                  ? 'text-emerald-700' 
                  : drawerDifference > 0 
                  ? 'text-blue-700' 
                  : 'text-rose-700'
              }`}>
                {drawerDifference === 0 ? '✓ Exact Match' : `${drawerDifference > 0 ? '+' : ''}₹${drawerDifference}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Add Cash In/Out Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-amber-800" />
                <h3 className="font-bold text-slate-900 text-base">
                  Record Cash Entry (नकद प्रविष्टि)
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4 pt-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('CASH_IN');
                    setSelectedCategory('BILLING_CASH');
                  }}
                  className={`py-2 rounded-lg font-bold transition-all text-xs ${
                    entryType === 'CASH_IN'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cash In (प्राप्ति / आय)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('CASH_OUT');
                    setSelectedCategory('LABOR_WAGES');
                  }}
                  className={`py-2 rounded-lg font-bold transition-all text-xs ${
                    entryType === 'CASH_OUT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cash Out (व्यय / भुगतान)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amount (राशि ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-8 pr-3 text-base font-bold font-mono text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Category (श्रेणी) *
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value as CashCategory)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 font-medium focus:border-amber-600 focus:outline-none"
                >
                  {Object.entries(CATEGORY_LABELS)
                    .filter(([_, info]) => info.type === entryType)
                    .map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label} ({info.hindi})
                      </option>
                    ))}
                </select>
              </div>

              {/* If Category is Customer Credit Repayment */}
              {selectedCategory === 'CREDIT_REPAYMENT' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Credit Customer (ग्राहक चयन)
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 font-medium focus:border-amber-600 focus:outline-none"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers
                      .filter(c => c.outstandingCredit > 0 || c.type === 'B2B')
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.businessName ? `(${c.businessName})` : ''} - Due: ₹{c.outstandingCredit}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Note / Remarks (विवरण)
                </label>
                <input
                  type="text"
                  value={descriptionInput}
                  onChange={e => setDescriptionInput(e.target.value)}
                  placeholder="e.g. Unloading labor for 50 bags grain"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-700 px-5 py-2 text-xs font-bold text-white hover:bg-amber-800 shadow-xs"
                >
                  Save Cash Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Edit Cash Transaction
                </h3>
              </div>
              <button 
                onClick={() => setEditingTransaction(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransactionEdit} className="space-y-4 pt-4 text-xs">
              {/* Type */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTransaction({ ...editingTransaction, type: 'CASH_IN' })}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    editingTransaction.type === 'CASH_IN'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Cash In (प्राप्ति)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTransaction({ ...editingTransaction, type: 'CASH_OUT' })}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    editingTransaction.type === 'CASH_OUT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Cash Out (व्यय)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editingTransaction.amount}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-base font-bold font-mono text-slate-900 focus:border-amber-600 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={editingTransaction.category}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    category: e.target.value as CashCategory
                  })}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label} ({info.hindi})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  value={editingTransaction.description}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    description: e.target.value
                  })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Date / Time
                </label>
                <input
                  type="text"
                  value={editingTransaction.date}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    date: e.target.value
                  })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Delete Cash Transaction?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will adjust your calculated cash drawer balance.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-semibold text-slate-800">
              {deletingTx.type === 'CASH_IN' ? '+' : '-'}₹{deletingTx.amount.toLocaleString()} - {deletingTx.description}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
