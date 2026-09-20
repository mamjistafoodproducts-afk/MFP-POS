import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Calendar, 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  ArrowUpRight, 
  Download, 
  Clock, 
  Phone, 
  Building2, 
  Share2,
  FileSpreadsheet,
  Receipt,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Printer
} from 'lucide-react';
import { Invoice, Product, Customer } from '../types';
import { downloadCSV } from '../utils/storage';

interface AnalyticsReportsProps {
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
  onUpdateInvoice?: (invoice: Invoice) => void;
  onCancelInvoice?: (invoiceId: string) => void;
  onViewReceipt?: (invoice: Invoice) => void;
}

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({
  invoices,
  products,
  customers,
  onUpdateInvoice,
  onCancelInvoice,
  onViewReceipt
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [filterMode, setFilterMode] = useState<'MONTH_YEAR' | 'YEAR_ONLY' | 'ALL_TIME'>('MONTH_YEAR');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVOICES'>('OVERVIEW');

  // Invoice Ledger Search & Filter
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoicePaymentFilter, setInvoicePaymentFilter] = useState('ALL');

  // Edit Invoice State
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Cancel / Delete Invoice State
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter invoices according to selected period
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const invDate = new Date(inv.date);
      if (filterMode === 'ALL_TIME') return true;
      if (filterMode === 'YEAR_ONLY') return invDate.getFullYear() === selectedYear;
      return (
        invDate.getFullYear() === selectedYear &&
        invDate.getMonth() === selectedMonth
      );
    });
  }, [invoices, filterMode, selectedMonth, selectedYear]);

  // Aggregate Daily Sales Summary
  const salesSummary = useMemo(() => {
    let totalRevenue = 0;
    let cashRevenue = 0;
    let onlineRevenue = 0;
    let creditRevenue = 0;
    let b2bRevenue = 0;
    let b2cRevenue = 0;
    let totalTax = 0;
    let estimatedProfit = 0;

    filteredInvoices.forEach(inv => {
      if (inv.status === 'Cancelled') return;
      totalRevenue += inv.grandTotal;
      totalTax += inv.taxAmount;

      if (inv.paymentMethod === 'Cash') cashRevenue += inv.grandTotal;
      else if (inv.paymentMethod === 'Online') onlineRevenue += inv.grandTotal;
      else if (inv.paymentMethod === 'Credit-7-Days') creditRevenue += inv.grandTotal;

      if (inv.customerType === 'B2B') b2bRevenue += inv.grandTotal;
      else b2cRevenue += inv.grandTotal;

      // Estimate profit from FIFO batch allocations
      inv.items.forEach(it => {
        const itemCost = it.fifoAllocations?.reduce((c, a) => c + (a.qty * a.unitCost), 0) || (it.total * 0.75);
        estimatedProfit += (it.total - itemCost);
      });
    });

    const activeCount = filteredInvoices.filter(i => i.status !== 'Cancelled').length;
    const avgBill = activeCount > 0 ? totalRevenue / activeCount : 0;

    return {
      totalRevenue,
      billCount: activeCount,
      cashRevenue,
      onlineRevenue,
      creditRevenue,
      b2bRevenue,
      b2cRevenue,
      totalTax,
      estimatedProfit,
      avgBill
    };
  }, [filteredInvoices]);

  // Calculate Top Buyers in selected period
  const topBuyers = useMemo(() => {
    const buyerMap: Record<string, {
      customerId: string;
      customerName: string;
      customerMobile: string;
      customerType: 'B2C' | 'B2B';
      customerBusinessName?: string;
      totalSpend: number;
      orderCount: number;
      outstandingCredit: number;
    }> = {};

    filteredInvoices.forEach(inv => {
      if (inv.status === 'Cancelled') return;
      const key = inv.customerMobile || inv.customerId;
      if (!buyerMap[key]) {
        const custObj = customers.find(c => c.mobileNumber === inv.customerMobile || c.id === inv.customerId);
        buyerMap[key] = {
          customerId: inv.customerId,
          customerName: inv.customerName,
          customerMobile: inv.customerMobile,
          customerType: inv.customerType,
          customerBusinessName: custObj?.businessName,
          totalSpend: 0,
          orderCount: 0,
          outstandingCredit: custObj?.outstandingCredit || 0
        };
      }

      buyerMap[key].totalSpend += inv.grandTotal;
      buyerMap[key].orderCount += 1;
    });

    return Object.values(buyerMap).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 8);
  }, [filteredInvoices, customers]);

  // Calculate Top Selling Products
  const topProducts = useMemo(() => {
    const prodMap: Record<string, {
      productId: string;
      name: string;
      hindiName: string;
      category: string;
      packSize: string;
      unitsSold: number;
      revenue: number;
    }> = {};

    filteredInvoices.forEach(inv => {
      if (inv.status === 'Cancelled') return;
      inv.items.forEach(it => {
        if (!prodMap[it.productId]) {
          const prodObj = products.find(p => p.id === it.productId);
          prodMap[it.productId] = {
            productId: it.productId,
            name: it.productName,
            hindiName: prodObj?.hindiName || '',
            category: prodObj?.category || 'Atta',
            packSize: prodObj?.packSize || '1kg',
            unitsSold: 0,
            revenue: 0
          };
        }
        prodMap[it.productId].unitsSold += it.qty;
        prodMap[it.productId].revenue += it.total;
      });
    });

    return Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [filteredInvoices, products]);

  // Invoices filtered by search
  const displayedInvoices = useMemo(() => {
    return filteredInvoices.filter(inv => {
      const q = invoiceSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerMobile.includes(q);

      const matchPay =
        invoicePaymentFilter === 'ALL' ||
        inv.paymentMethod === invoicePaymentFilter ||
        inv.status === invoicePaymentFilter;

      return matchSearch && matchPay;
    });
  }, [filteredInvoices, invoiceSearch, invoicePaymentFilter]);

  // Export Sales Report to CSV
  const handleExportCSV = () => {
    const headers = [
      'Invoice No',
      'Date',
      'Customer Name',
      'Mobile',
      'Type',
      'Payment Method',
      'Status',
      'Items Count',
      'Subtotal',
      'Tax Amount',
      'Grand Total'
    ];

    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      new Date(inv.date).toLocaleDateString(),
      inv.customerName,
      inv.customerMobile,
      inv.customerType,
      inv.paymentMethod,
      inv.status,
      inv.items.length.toString(),
      inv.subtotal.toFixed(2),
      inv.taxAmount.toFixed(2),
      inv.grandTotal.toFixed(2)
    ]);

    const periodLabel =
      filterMode === 'ALL_TIME'
        ? 'All_Time'
        : filterMode === 'YEAR_ONLY'
        ? `${selectedYear}`
        : `${monthNames[selectedMonth]}_${selectedYear}`;

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`Sales_Report_${periodLabel}.csv`, csvContent);
  };

  // Save Edit Invoice Submit
  const handleSaveInvoiceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if (onUpdateInvoice) {
      onUpdateInvoice(editingInvoice);
    }
    setEditingInvoice(null);
  };

  // Confirm Cancel Invoice
  const handleConfirmCancel = () => {
    if (!cancellingInvoice) return;
    if (onCancelInvoice) {
      onCancelInvoice(cancellingInvoice.id);
    } else if (onUpdateInvoice) {
      onUpdateInvoice({
        ...cancellingInvoice,
        status: 'Cancelled',
        notes: `${cancellingInvoice.notes ? cancellingInvoice.notes + ' ' : ''}[CANCELLED / VOIDED on ${new Date().toLocaleDateString()}]`
      });
    }
    setCancellingInvoice(null);
  };

  return (
    <div id="analytics-reports" className="space-y-6">
      {/* Top Header & Period Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-800" />
            <h3 className="font-bold text-slate-900 text-base">
              Sales Analytics &amp; Reports (बिक्री रिपोर्ट व विश्लेषण)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter top buyers, products, and full sales registers by month &amp; year
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Tab Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs mr-2">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'OVERVIEW' ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analytics Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INVOICES')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'INVOICES' ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoice Register ({filteredInvoices.length})
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('MONTH_YEAR')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterMode === 'MONTH_YEAR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              By Month
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('YEAR_ONLY')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterMode === 'YEAR_ONLY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Full Year
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('ALL_TIME')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterMode === 'ALL_TIME' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Month Selector */}
          {filterMode === 'MONTH_YEAR' && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white py-1.5 px-3 text-xs font-semibold text-slate-800 focus:border-amber-600 focus:outline-none"
            >
              {monthNames.map((m, idx) => (
                <option key={idx} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          )}

          {/* Year Selector */}
          {filterMode !== 'ALL_TIME' && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white py-1.5 px-3 text-xs font-semibold text-slate-800 focus:border-amber-600 focus:outline-none"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          )}

          {/* Export to CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales Revenue</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-bold">
              ₹
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            ₹{salesSummary.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {salesSummary.billCount} bills issued ({filterMode === 'MONTH_YEAR' ? monthNames[selectedMonth] : 'Period'})
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Milling Profit</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">
            ₹{salesSummary.estimatedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Based on FIFO batch raw grain procurement cost
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">B2B vs B2C Split</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-blue-900">₹{salesSummary.b2bRevenue.toLocaleString()}</span>
            <span className="text-xs font-semibold text-slate-500">/ ₹{salesSummary.b2cRevenue.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Wholesale vs Retail counter split</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Ticket Size</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            ₹{salesSummary.avgBill.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            GST Collected: ₹{salesSummary.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* TAB 1: OVERVIEW ANALYTICS */}
      {activeTab === 'OVERVIEW' && (
        <>
          {/* Payment Mode Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Counter Cash (नकद)</span>
                <span className="font-mono text-xs font-black text-emerald-700">
                  {salesSummary.totalRevenue > 0 ? ((salesSummary.cashRevenue / salesSummary.totalRevenue) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900 font-mono">
                ₹{salesSummary.cashRevenue.toLocaleString()}
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full" 
                  style={{ width: `${salesSummary.totalRevenue > 0 ? (salesSummary.cashRevenue / salesSummary.totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">UPI / QR Online (ऑनलाइन)</span>
                <span className="font-mono text-xs font-black text-blue-700">
                  {salesSummary.totalRevenue > 0 ? ((salesSummary.onlineRevenue / salesSummary.totalRevenue) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900 font-mono">
                ₹{salesSummary.onlineRevenue.toLocaleString()}
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ width: `${salesSummary.totalRevenue > 0 ? (salesSummary.onlineRevenue / salesSummary.totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Credit Ledger / B2B (उधारी)</span>
                <span className="font-mono text-xs font-black text-amber-700">
                  {salesSummary.totalRevenue > 0 ? ((salesSummary.creditRevenue / salesSummary.totalRevenue) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900 font-mono">
                ₹{salesSummary.creditRevenue.toLocaleString()}
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-amber-600 rounded-full" 
                  style={{ width: `${salesSummary.totalRevenue > 0 ? (salesSummary.creditRevenue / salesSummary.totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Two Columns: Top Buyers & Top Selling Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Buyers Leaderboard */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Top Buyers Leaderboard (शीर्ष ग्राहक)
                  </h4>
                </div>
                <span className="text-xs text-slate-400">
                  {topBuyers.length} top accounts
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {topBuyers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No sales recorded for the selected period.
                  </div>
                ) : (
                  topBuyers.map((buyer, idx) => (
                    <div key={buyer.customerId} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{idx + 1}
                        </span>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {buyer.customerName}
                            </span>
                            <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                              buyer.customerType === 'B2B' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {buyer.customerType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{buyer.customerMobile}</span>
                            {buyer.customerBusinessName && (
                              <span>• {buyer.customerBusinessName}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-sm sm:text-base font-black text-slate-900 block">
                          ₹{buyer.totalSpend.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {buyer.orderCount} orders
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-amber-800" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Best Selling Milling Products (सर्वाधिक बिकने वाले उत्पाद)
                  </h4>
                </div>
                <span className="text-xs text-slate-400">
                  By volume &amp; revenue
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {topProducts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No sales recorded for the selected period.
                  </div>
                ) : (
                  topProducts.map((prod, idx) => (
                    <div key={prod.productId} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{idx + 1}
                        </span>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                              {prod.name}
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-600">
                              {prod.packSize}
                            </span>
                          </div>
                          <p className="text-xs text-amber-800 font-medium">{prod.hindiName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Category: {prod.category}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-sm sm:text-base font-black text-slate-900 block">
                          ₹{prod.revenue.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-bold text-amber-800 font-mono block">
                          {prod.unitsSold} units sold
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: INVOICE REGISTER & EDIT / VOID MANAGER */}
      {activeTab === 'INVOICES' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-800" />
                <span>Sales Invoices Register (बिक्री बिल रजिस्टर)</span>
              </h4>
              <p className="text-xs text-slate-500">
                View, modify payment methods, re-issue receipts, or void/cancel bills
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Payment Method Filter */}
              <select
                value={invoicePaymentFilter}
                onChange={e => setInvoicePaymentFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white py-1.5 px-3 text-xs font-semibold text-slate-800 focus:border-amber-600 focus:outline-none"
              >
                <option value="ALL">All Payment Types</option>
                <option value="Cash">Cash Only</option>
                <option value="Online">Online / UPI Only</option>
                <option value="Credit-7-Days">Credit Ledger Only</option>
                <option value="Cancelled">Cancelled Bills</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={e => setInvoiceSearch(e.target.value)}
              placeholder="Search by Bill Number (e.g. INV-26-), customer name, or phone number..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-amber-600 focus:outline-none"
            />
          </div>

          {/* Invoice Table */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {displayedInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No invoices found matching criteria.
              </div>
            ) : (
              displayedInvoices.map(inv => {
                const isCancelled = inv.status === 'Cancelled';

                return (
                  <div
                    key={inv.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCancelled 
                        ? 'bg-rose-50/50 border-rose-200 opacity-80' 
                        : 'bg-white border-slate-200 hover:bg-slate-50/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {inv.invoiceNumber}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          isCancelled
                            ? 'bg-rose-100 text-rose-800'
                            : inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                          {inv.paymentMethod}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1 rounded font-bold">
                          {inv.customerType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="font-bold text-slate-900">{inv.customerName}</span>
                        <span className="text-slate-500 font-mono">({inv.customerMobile})</span>
                        <span className="text-slate-400 text-[10px]">
                          • {new Date(inv.date).toLocaleDateString()} {new Date(inv.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-1">
                        {inv.items.map((it, idx) => (
                          <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                            {it.productName} ({it.qty}x)
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <div className="text-left sm:text-right mr-1">
                        <span className={`font-mono text-base font-black ${
                          isCancelled ? 'text-rose-700 line-through' : 'text-slate-900'
                        }`}>
                          ₹{inv.grandTotal.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Tax: ₹{inv.taxAmount.toFixed(2)}
                        </span>
                      </div>

                      {/* Print / View Receipt */}
                      {onViewReceipt && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(inv)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                          title="View / Print Receipt"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Edit Invoice */}
                      <button
                        type="button"
                        onClick={() => setEditingInvoice({ ...inv })}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Invoice Details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Cancel / Void Invoice */}
                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => setCancellingInvoice(inv)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Void / Cancel Invoice"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 1. Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Bill #{editingInvoice.invoiceNumber}</h3>
              </div>
              <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveInvoiceEdit} className="space-y-3.5 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editingInvoice.customerName}
                    onChange={e => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-semibold focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={editingInvoice.customerMobile}
                    onChange={e => setEditingInvoice({ ...editingInvoice, customerMobile: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={editingInvoice.paymentMethod}
                    onChange={e => setEditingInvoice({ ...editingInvoice, paymentMethod: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Cash">Cash (Counter)</option>
                    <option value="Online">Online / UPI</option>
                    <option value="Credit-7-Days">Credit-7-Days (उधारी)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Status</label>
                  <select
                    value={editingInvoice.status}
                    onChange={e => setEditingInvoice({ ...editingInvoice, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Paid">Paid (भुगतान पूर्ण)</option>
                    <option value="Pending_Credit">Pending_Credit (बकाया)</option>
                    <option value="Partially_Paid">Partially_Paid (आंशिक)</option>
                    <option value="Cancelled">Cancelled (रद्द)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={editingInvoice.notes || ''}
                  onChange={e => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                  placeholder="e.g. Paid via PhonePe UPI ID"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow-xs"
                >
                  Save Bill Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Cancel / Void Confirmation Modal */}
      {cancellingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Void / Cancel Invoice?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will mark the bill as Cancelled and adjust analytics.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-semibold text-slate-800">
              Bill #{cancellingInvoice.invoiceNumber} - ₹{cancellingInvoice.grandTotal.toLocaleString()} ({cancellingInvoice.customerName})
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingInvoice(null)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
              >
                Yes, Void Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
