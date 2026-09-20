import React, { useState, useMemo } from 'react';
import { 
  Smartphone, 
  Users, 
  ShoppingBag, 
  PackageCheck, 
  CreditCard, 
  Receipt, 
  Search, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Phone, 
  Building2, 
  Scan, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  ArrowRight, 
  Check, 
  Trash2, 
  Calendar, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  QrCode,
  Banknote,
  Send,
  Eye,
  Edit2
} from 'lucide-react';
import { 
  Customer, 
  Product, 
  WholesaleOrder, 
  WholesaleOrderItem, 
  FieldPaymentReceipt 
} from '../types';
import { WholesaleOrderVolumeChart } from './WholesaleOrderVolumeChart';
import { BarcodeBadge } from './BarcodeBadge';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface WholesaleCompanionAppProps {
  customers: Customer[];
  products: Product[];
  wholesaleOrders: WholesaleOrder[];
  fieldPayments: FieldPaymentReceipt[];
  onSaveOrder: (order: WholesaleOrder) => void;
  onUpdateWholesaleOrder?: (order: WholesaleOrder) => void;
  onDeleteWholesaleOrder?: (orderId: string) => void;
  onDeleteFieldPayment?: (receiptId: string) => void;
  onRecordPayment: (receipt: FieldPaymentReceipt, updatedCustomer: Customer) => void;
  onSyncAll: () => Promise<void>;
  isOnline: boolean;
  lastSyncedAt: string | null;
}

export const WholesaleCompanionApp: React.FC<WholesaleCompanionAppProps> = ({
  customers,
  products,
  wholesaleOrders,
  fieldPayments,
  onSaveOrder,
  onUpdateWholesaleOrder,
  onDeleteWholesaleOrder,
  onDeleteFieldPayment,
  onRecordPayment,
  onSyncAll,
  isOnline,
  lastSyncedAt
}) => {
  // Mobile frame simulator toggle
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'NEW_ORDER' | 'STOCK' | 'PAYMENTS' | 'ORDERS'>('CUSTOMERS');
  
  // State for Customer View
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);

  // State for New Order creation
  const [orderCustomerId, setOrderCustomerId] = useState<string>(
    customers.find(c => c.type === 'B2B')?.id || customers[0]?.id || ''
  );
  const [orderItems, setOrderItems] = useState<WholesaleOrderItem[]>([]);
  const [orderPaymentTerms, setOrderPaymentTerms] = useState<'Credit-7-Days' | 'Advance-UPI' | 'Cash-on-Delivery'>('Credit-7-Days');
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccessModal, setOrderSuccessModal] = useState<WholesaleOrder | null>(null);

  // Barcode Scanner inside companion app
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  // State for Payment Recording
  const [paymentCustomerId, setPaymentCustomerId] = useState<string>(
    customers.find(c => c.type === 'B2B')?.id || customers[0]?.id || ''
  );
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Cheque' | 'UPI_QR'>('Cash');
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<FieldPaymentReceipt | null>(null);

  // Edit / Delete states for wholesale orders & payments
  const [editingWholesaleOrder, setEditingWholesaleOrder] = useState<WholesaleOrder | null>(null);
  const [deletingWholesaleOrder, setDeletingWholesaleOrder] = useState<WholesaleOrder | null>(null);
  const [deletingPaymentReceipt, setDeletingPaymentReceipt] = useState<FieldPaymentReceipt | null>(null);

  // Stock Search & Low-Stock Filter
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategory, setStockCategory] = useState('ALL');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Low stock products reached minStockThreshold
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.totalStock <= p.minStockThreshold);
  }, [products]);

  // Sync animation
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter wholesale (B2B) customers primarily
  const b2bCustomers = useMemo(() => {
    return customers.filter(c => c.type === 'B2B');
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return b2bCustomers;
    return b2bCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.businessName?.toLowerCase().includes(q) ||
      c.mobileNumber.includes(q)
    );
  }, [b2bCustomers, customerSearch]);

  const selectedOrderCustomer = useMemo(() => {
    return customers.find(c => c.id === orderCustomerId);
  }, [customers, orderCustomerId]);

  const selectedPaymentCustomer = useMemo(() => {
    return customers.find(c => c.id === paymentCustomerId);
  }, [customers, paymentCustomerId]);

  // Handle manual or scanned product addition to wholesale order
  const handleAddProductToOrder = (product: Product, quantity = 1) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.wholesaleRate }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          hindiName: product.hindiName,
          packSize: product.packSize,
          unit: product.unit,
          quantity,
          wholesaleRate: product.wholesalePrice,
          total: quantity * product.wholesalePrice
        }
      ];
    });
  };

  const handleUpdateOrderItemQty = (productId: string, delta: number) => {
    setOrderItems(prev =>
      prev
        .map(item => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0
              ? { ...item, quantity: nextQty, total: nextQty * item.wholesaleRate }
              : null;
          }
          return item;
        })
        .filter(Boolean) as WholesaleOrderItem[]
    );
  };

  const handleRemoveOrderItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Order Totals
  const orderSubtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const volumeDiscount = orderSubtotal >= 20000 ? Math.floor(orderSubtotal * 0.02) : 0;
  const orderGrandTotal = orderSubtotal - volumeDiscount;

  // Submit wholesale order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderCustomer) {
      alert('Please select a wholesale customer.');
      return;
    }
    if (orderItems.length === 0) {
      alert('Please add at least 1 wholesale product to the order.');
      return;
    }

    // Check credit limit if 7-day credit chosen
    const availableCredit = (selectedOrderCustomer.creditLimit || 50000) - (selectedOrderCustomer.outstandingCredit || 0);
    if (orderPaymentTerms === 'Credit-7-Days' && orderGrandTotal > availableCredit) {
      const proceed = confirm(
        `Order amount (₹${orderGrandTotal.toLocaleString()}) exceeds customer's available credit limit (₹${availableCredit.toLocaleString()}). Submit for Special Credit Approval?`
      );
      if (!proceed) return;
    }

    const newOrder: WholesaleOrder = {
      id: `wo-26-${Date.now().toString().slice(-4)}`,
      orderNumber: `WO-26-${Math.floor(100 + Math.random() * 900)}`,
      customerId: selectedOrderCustomer.id,
      customerName: selectedOrderCustomer.name,
      customerBusinessName: selectedOrderCustomer.businessName,
      customerMobile: selectedOrderCustomer.mobileNumber,
      salesRepName: 'Amit Meena (Field Rep #1)',
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: deliveryDate,
      items: orderItems,
      subtotal: orderSubtotal,
      volumeDiscount,
      grandTotal: orderGrandTotal,
      status: 'Confirmed',
      paymentTerms: orderPaymentTerms,
      notes: orderNotes.trim() || undefined,
      synced: isOnline
    };

    onSaveOrder(newOrder);
    setOrderSuccessModal(newOrder);
    setOrderItems([]);
    setOrderNotes('');
  };

  // Submit field payment collection
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount) || 0;
    if (!selectedPaymentCustomer) {
      alert('Please select a wholesale buyer.');
      return;
    }
    if (amt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const newReceipt: FieldPaymentReceipt = {
      id: `fpr-${Date.now()}`,
      receiptNo: `RCP-FL-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: selectedPaymentCustomer.id,
      customerName: selectedPaymentCustomer.name,
      customerBusinessName: selectedPaymentCustomer.businessName,
      customerMobile: selectedPaymentCustomer.mobileNumber,
      amount: amt,
      paymentMode,
      referenceNo: paymentRefNo.trim() || undefined,
      collectedAt: new Date().toISOString(),
      salesRepName: 'Amit Meena (Field Rep #1)',
      notes: paymentNotes.trim() || undefined,
      synced: isOnline
    };

    // Update customer outstanding credit
    const updatedCustomer: Customer = {
      ...selectedPaymentCustomer,
      outstandingCredit: Math.max(0, (selectedPaymentCustomer.outstandingCredit || 0) - amt)
    };

    onRecordPayment(newReceipt, updatedCustomer);
    setPaymentSuccessReceipt(newReceipt);
    setPaymentAmount('');
    setPaymentRefNo('');
    setPaymentNotes('');
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await onSyncAll();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="wholesale-companion-app-wrapper" className="flex flex-col items-center justify-start w-full py-2">
      {/* Top Banner & Display Mode Controls */}
      <div className="w-full max-w-5xl mb-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>अन्नपूर्णा थोक सेल्स साथी (Wholesale Sales Companion App)</span>
              <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2">
                Field Officer Edition
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Real-time credit check, mobile order booking, stock availability, and field payment collection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync status */}
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync POS'}</span>
          </button>

          {/* Viewport Frame Toggle */}
          <button
            type="button"
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
              isPhoneFrame
                ? 'bg-blue-50 text-blue-800 border-blue-200 font-bold'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>{isPhoneFrame ? 'Phone Frame' : 'Wide Screen'}</span>
          </button>
        </div>
      </div>

      {/* Main Container: either simulated phone frame or responsive full width */}
      <div 
        className={`transition-all duration-200 ${
          isPhoneFrame 
            ? 'w-full max-w-[430px] rounded-[42px] border-[10px] border-slate-900 shadow-2xl overflow-hidden bg-slate-900' 
            : 'w-full max-w-5xl rounded-2xl border border-slate-200 shadow-md bg-white'
        }`}
      >
        {/* Phone Notch & Status Bar (in phone frame mode) */}
        {isPhoneFrame && (
          <div className="bg-slate-900 px-7 pt-3 pb-1 flex items-center justify-between text-white text-[11px] font-mono select-none">
            <span>09:41 AM</span>
            {/* Dynamic Island Notch */}
            <div className="h-4 w-24 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              {isOnline ? <Wifi className="h-3 w-3 text-emerald-400" /> : <WifiOff className="h-3 w-3 text-amber-400" />}
              <span>5G</span>
              <span className="text-[10px]">98%</span>
            </div>
          </div>
        )}

        {/* Mobile App Screen Content */}
        <div className="bg-slate-50 min-h-[640px] flex flex-col">
          {/* Mobile App Header */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 px-4 py-3 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-xs font-bold font-mono">
                AM
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight flex items-center gap-1">
                  <span>Amit Meena</span>
                  <span className="text-[9px] bg-blue-400/20 text-blue-200 px-1.5 py-0.2 rounded font-normal">
                    Field Rep #1
                  </span>
                </h3>
                <p className="text-[10px] text-blue-200">
                  Mandi &amp; Wholesale Route • Annapurna Mills
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="h-8 w-8 rounded-lg bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center shadow-xs transition-colors"
                title="Scan Product Barcode"
              >
                <Scan className="h-4 w-4" />
              </button>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="bg-white border-b border-slate-200 px-3 py-2 grid grid-cols-3 divide-x divide-slate-100 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">B2B Clients</span>
              <span className="font-bold text-slate-900 text-xs font-mono">{b2bCustomers.length} Active</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Today Orders</span>
              <span className="font-bold text-blue-800 text-xs font-mono">{wholesaleOrders.length} Booked</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Collections</span>
              <span className="font-bold text-emerald-700 text-xs font-mono">
                ₹{fieldPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Tab Navigation Ribbon */}
          <div className="bg-white border-b border-slate-200 px-2 flex items-center justify-around text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              id="mob-tab-customers"
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'CUSTOMERS'
                  ? 'border-blue-700 text-blue-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Credit &amp; Clients</span>
            </button>

            <button
              type="button"
              id="mob-tab-order"
              onClick={() => setActiveTab('NEW_ORDER')}
              className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'NEW_ORDER'
                  ? 'border-blue-700 text-blue-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Order</span>
              {orderItems.length > 0 && (
                <span className="h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] font-mono flex items-center justify-center">
                  {orderItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              id="mob-tab-stock"
              onClick={() => setActiveTab('STOCK')}
              className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'STOCK'
                  ? 'border-blue-700 text-blue-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PackageCheck className="h-3.5 w-3.5" />
              <span>Mill Stock</span>
              {lowStockProducts.length > 0 && (
                <span className="relative flex items-center justify-center ml-0.5" title={`${lowStockProducts.length} items at or below min stock threshold`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex items-center gap-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs animate-pulse">
                    <AlertTriangle className="h-2.5 w-2.5 animate-bounce" />
                    <span>{lowStockProducts.length} LOW</span>
                  </span>
                </span>
              )}
            </button>

            <button
              type="button"
              id="mob-tab-payments"
              onClick={() => setActiveTab('PAYMENTS')}
              className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'PAYMENTS'
                  ? 'border-blue-700 text-blue-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Collect ₹</span>
            </button>

            <button
              type="button"
              id="mob-tab-orders"
              onClick={() => setActiveTab('ORDERS')}
              className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'ORDERS'
                  ? 'border-blue-700 text-blue-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Orders ({wholesaleOrders.length})</span>
            </button>
          </div>

          {/* TAB 1: CUSTOMER CREDIT & ACCOUNTS */}
          {activeTab === 'CUSTOMERS' && (
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[520px]">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search buyer name, shop, or mobile..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                />
              </div>

              {/* Customer Cards */}
              <div className="space-y-2.5">
                {filteredCustomers.map(customer => {
                  const creditLimit = customer.creditLimit || 50000;
                  const outstanding = customer.outstandingCredit || 0;
                  const availableCredit = Math.max(0, creditLimit - outstanding);
                  const creditUtilization = Math.round((outstanding / creditLimit) * 100);

                  return (
                    <div
                      key={customer.id}
                      className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-xs hover:border-blue-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{customer.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              ({customer.mobileNumber})
                            </span>
                          </h4>
                          {customer.businessName && (
                            <p className="text-[11px] font-semibold text-blue-900 mt-0.5 flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              {customer.businessName}
                            </p>
                          )}
                          {customer.address && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {customer.address}
                            </p>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          creditUtilization > 75 
                            ? 'bg-rose-100 text-rose-800' 
                            : creditUtilization > 40
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {creditUtilization}% Used
                        </span>
                      </div>

                      {/* Credit Bar */}
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">7-Day Credit Limit:</span>
                          <span className="font-bold text-slate-800 font-mono">
                            ₹{creditLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Current Outstanding:</span>
                          <span className={`font-bold font-mono ${outstanding > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            ₹{outstanding.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200">
                          <span className="font-semibold text-slate-700">Available to Order:</span>
                          <span className="font-black text-emerald-700 font-mono">
                            ₹{availableCredit.toLocaleString()}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              creditUtilization > 75 ? 'bg-rose-600' : creditUtilization > 40 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(100, creditUtilization)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setOrderCustomerId(customer.id);
                            setActiveTab('NEW_ORDER');
                          }}
                          className="flex-1 rounded-xl bg-blue-700 py-1.5 text-xs font-bold text-white hover:bg-blue-800 flex items-center justify-center gap-1 shadow-xs transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Book Order</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPaymentCustomerId(customer.id);
                            setActiveTab('PAYMENTS');
                          }}
                          className="flex-1 rounded-xl bg-emerald-700 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 flex items-center justify-center gap-1 shadow-xs transition-colors"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Collect ₹</span>
                        </button>

                        <a
                          href={`tel:${customer.mobileNumber}`}
                          className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-700"
                          title="Call Buyer"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE & SUBMIT ORDER */}
          {activeTab === 'NEW_ORDER' && (
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[520px]">
              <form onSubmit={handleSubmitOrder} className="space-y-3">
                {/* Select Wholesale Customer */}
                <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Wholesale Customer / थोक खरीदार <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={orderCustomerId}
                    onChange={e => setOrderCustomerId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  >
                    {b2bCustomers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.businessName || 'Store'} ({c.mobileNumber})
                      </option>
                    ))}
                  </select>

                  {selectedOrderCustomer && (
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600">
                      <span>Available Credit Limit:</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        ₹{Math.max(0, (selectedOrderCustomer.creditLimit || 50000) - (selectedOrderCustomer.outstandingCredit || 0)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Catalog Picker */}
                <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Wholesale Products / स्टॉक सूची
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBarcodeScannerOpen(true)}
                      className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Scan className="h-3 w-3" />
                      <span>Scan Barcode</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {products.map(prod => {
                      const itemInOrder = orderItems.find(i => i.productId === prod.id);
                      return (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <h5 className="font-bold text-slate-900 truncate text-[11px]">
                              {prod.name}
                            </h5>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="font-mono bg-white px-1 py-0.2 rounded border">
                                {prod.packSize}
                              </span>
                              <span className="font-bold text-blue-800">
                                ₹{prod.wholesalePrice} / {prod.unit}
                              </span>
                              <span className={`font-semibold ${
                                prod.totalStock <= prod.minStockThreshold ? 'text-amber-600' : 'text-slate-600'
                              }`}>
                                • Stock: {prod.totalStock} {prod.unit}s
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {itemInOrder ? (
                              <div className="flex items-center gap-1 bg-white border border-blue-400 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderItemQty(prod.id, -1)}
                                  className="h-5 w-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-5 text-center font-bold text-blue-900 text-xs font-mono">
                                  {itemInOrder.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderItemQty(prod.id, 1)}
                                  className="h-5 w-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddProductToOrder(prod, 1)}
                                className="rounded-lg bg-blue-700 px-2 py-1 text-[11px] font-bold text-white hover:bg-blue-800 shadow-xs"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Order Summary */}
                {orderItems.length > 0 && (
                  <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3 space-y-2 text-xs">
                    <span className="font-bold text-blue-950 uppercase tracking-wider text-[11px] block">
                      Order Breakdown ({orderItems.length} items)
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto divide-y divide-blue-100">
                      {orderItems.map(item => (
                        <div key={item.productId} className="pt-1 flex items-center justify-between">
                          <span className="truncate pr-2 font-medium text-slate-800">
                            {item.quantity}x {item.name} ({item.packSize})
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold text-slate-900">
                              ₹{item.total}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItem(item.productId)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-blue-200 space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-mono">₹{orderSubtotal.toLocaleString()}</span>
                      </div>
                      {volumeDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Volume Bulk Discount (2%):</span>
                          <span className="font-mono">- ₹{volumeDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-slate-950 text-sm pt-1 border-t border-blue-200">
                        <span>Grand Total:</span>
                        <span className="font-mono text-blue-900">₹{orderGrandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Terms & Expected Delivery */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Terms / भुगतान शर्त
                    </label>
                    <select
                      value={orderPaymentTerms}
                      onChange={e => setOrderPaymentTerms(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2 text-xs font-semibold text-slate-800 focus:outline-none"
                    >
                      <option value="Credit-7-Days">7-Day Credit (B2B)</option>
                      <option value="Advance-UPI">Advance Online UPI</option>
                      <option value="Cash-on-Delivery">Cash on Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Delivery Date / तारीख
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2 text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Special Instructions / डिस्पैच नोट
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="e.g. Deliver before 11 AM, Ganesh Utsav lot..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={orderItems.length === 0}
                  className="w-full rounded-xl bg-blue-700 py-3 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Submit Wholesale Order (₹{orderGrandTotal.toLocaleString()})</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: STOCK AVAILABILITY CHECK */}
          {activeTab === 'STOCK' && (
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[520px]">
              {/* Animated Low-Stock Alert Banner to Immediately Grab Sales Rep's Attention */}
              {lowStockProducts.length > 0 && (
                <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500 bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100/70 p-3 shadow-sm space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <AlertTriangle className="h-5 w-5 relative z-10 animate-bounce" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-950">
                            Urgent Sales Rep Stock Notice
                          </h4>
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-xs animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                            {lowStockProducts.length} Items At Min Threshold
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-900 mt-1 font-medium leading-tight">
                          Items highlighted in red have hit or breached their <strong>minStockThreshold</strong>. Verify available lot batch with the mill before committing large delivery orders.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowOnlyLowStock(prev => !prev)}
                      className={`shrink-0 rounded-xl px-2.5 py-1.5 text-[11px] font-black transition-all shadow-xs border whitespace-nowrap ${
                        showOnlyLowStock
                          ? 'bg-rose-700 text-white border-rose-800 ring-2 ring-rose-400'
                          : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      {showOnlyLowStock ? 'Show All Products' : `🚨 Filter ${lowStockProducts.length} Low Items`}
                    </button>
                  </div>
                </div>
              )}

              {/* Category Filter & Search */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={stockSearch}
                    onChange={e => setStockSearch(e.target.value)}
                    placeholder="Check stock by Atta, Besan, Sattu, SKU..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
                  {['ALL', 'Atta', 'Besan', 'Sattu', 'Masale'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setStockCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                        stockCategory === cat
                          ? 'bg-blue-800 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}

                  {lowStockProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap border ml-auto ${
                        showOnlyLowStock
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-300'
                          : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3 animate-bounce text-rose-600" />
                      <span>Low Threshold ({lowStockProducts.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Stock List */}
              <div className="space-y-2.5">
                {products
                  .filter(p => {
                    if (showOnlyLowStock && p.totalStock > p.minStockThreshold) return false;
                    const matchCat = stockCategory === 'ALL' || p.category === stockCategory;
                    const q = stockSearch.toLowerCase().trim();
                    const matchQuery =
                      !q ||
                      p.name.toLowerCase().includes(q) ||
                      p.sku.toLowerCase().includes(q) ||
                      p.hindiName.toLowerCase().includes(q);
                    return matchCat && matchQuery;
                  })
                  .map(prod => {
                    const isLow = prod.totalStock <= prod.minStockThreshold;
                    const isOut = prod.totalStock <= 0;
                    return (
                      <div
                        key={prod.id}
                        className={`rounded-2xl p-3.5 shadow-xs space-y-2.5 transition-all ${
                          isOut
                            ? 'bg-rose-50/95 border-2 border-rose-600 ring-2 ring-rose-500/20 shadow-rose-100'
                            : isLow
                            ? 'bg-gradient-to-br from-rose-50/90 via-amber-50/40 to-white border-2 border-rose-400 ring-2 ring-rose-400/20 shadow-rose-100/70'
                            : 'bg-white border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Urgent Animated Low-Stock Alert Badge on Item */}
                        {isLow && (
                          <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                              </span>
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-200 animate-bounce shrink-0" />
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                {isOut
                                  ? 'OUT OF STOCK (0 Available)'
                                  : `MIN STOCK THRESHOLD REACHED (${prod.totalStock} / Min: ${prod.minStockThreshold} ${prod.unit}s)`}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono font-bold bg-rose-800/80 px-1.5 py-0.5 rounded text-amber-200 shrink-0">
                              LIMIT: {prod.minStockThreshold}
                            </span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-900">
                                {prod.name}
                              </h4>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                isLow ? 'bg-rose-200 text-rose-900 font-black' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {prod.packSize}
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-600">
                              {prod.hindiName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 flex-wrap">
                              <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-700 font-bold">
                                {prod.category}
                              </span>
                              <span>SKU: {prod.sku}</span>
                              <span className="font-mono text-slate-400">Barcode: {prod.barcode}</span>
                              <span className={`font-mono font-bold ${isLow ? 'text-rose-700' : 'text-slate-500'}`}>
                                Min: {prod.minStockThreshold}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-base font-black font-mono block ${
                              isOut
                                ? 'text-rose-700 animate-pulse'
                                : isLow
                                ? 'text-rose-600 animate-pulse'
                                : 'text-emerald-700'
                            }`}>
                              {prod.totalStock} {prod.unit}s
                            </span>
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 border border-rose-300 shadow-2xs mt-0.5 animate-bounce">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                <span>Low Stock Alert</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Ready In Mill</span>
                            )}
                          </div>
                        </div>

                        {/* Low Stock Warning Gauge Bar */}
                        {isLow && (
                          <div className="rounded-xl bg-rose-100/70 p-2 border border-rose-200/80">
                            <div className="flex items-center justify-between text-[10px] font-bold text-rose-900 mb-1">
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
                                <span>Current vs Min Limit:</span>
                              </span>
                              <span className="font-mono font-black">
                                {prod.totalStock} / {prod.minStockThreshold} {prod.unit}s
                              </span>
                            </div>
                            <div className="h-2 w-full bg-rose-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-600 rounded-full animate-pulse transition-all"
                                style={{ width: `${Math.min(100, Math.max(10, (prod.totalStock / (prod.minStockThreshold || 1)) * 100))}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-rose-700 mt-1 font-semibold">
                              ⚠️ Low stock notice: Confirm mill buffer before booking large quantity for this SKU.
                            </p>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-blue-900">
                            Wholesale Rate: ₹{prod.wholesalePrice}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              handleAddProductToOrder(prod, 1);
                              setActiveTab('NEW_ORDER');
                            }}
                            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all shadow-xs ${
                              isLow
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                            }`}
                          >
                            {isLow ? '⚠️ Add (Low Stock)' : '+ Add to Order'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 4: RECORD FIELD PAYMENT */}
          {activeTab === 'PAYMENTS' && (
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[520px]">
              <form onSubmit={handleSubmitPayment} className="space-y-3">
                {/* Select Wholesale Customer */}
                <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Wholesale Customer / ग्राहक चुनें <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentCustomerId}
                    onChange={e => setPaymentCustomerId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                  >
                    {b2bCustomers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.businessName || 'Store'} (Due: ₹{c.outstandingCredit.toLocaleString()})
                      </option>
                    ))}
                  </select>

                  {selectedPaymentCustomer && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600">Current Outstanding Credit:</span>
                      <span className="font-black text-rose-700 font-mono text-sm">
                        ₹{selectedPaymentCustomer.outstandingCredit.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Amount to collect */}
                <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Payment Amount Received (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-3 text-base font-mono font-black text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Quick Select Outstanding Chips */}
                  {selectedPaymentCustomer && selectedPaymentCustomer.outstandingCredit > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1 text-[11px]">
                      <span className="text-slate-400">Quick:</span>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(selectedPaymentCustomer.outstandingCredit))}
                        className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 font-semibold hover:bg-emerald-100"
                      >
                        Full Outstanding (₹{selectedPaymentCustomer.outstandingCredit.toLocaleString()})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(Math.floor(selectedPaymentCustomer.outstandingCredit / 2)))}
                        className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 font-semibold hover:bg-slate-200"
                      >
                        50% Partial
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Mode */}
                <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Collection Mode / माध्यम
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[
                      { id: 'Cash', label: 'Cash (नकद)', icon: Banknote },
                      { id: 'UPI_QR', label: 'UPI QR', icon: QrCode },
                      { id: 'Cheque', label: 'Cheque (चेक)', icon: Receipt }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id as any)}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                          paymentMode === mode.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500/30'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <mode.icon className="h-4 w-4 mb-0.5" />
                        <span className="text-[11px]">{mode.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Reference No for Cheque or UPI */}
                  {paymentMode !== 'Cash' && (
                    <div className="pt-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        {paymentMode === 'Cheque' ? 'Cheque No. & Bank Name:' : 'UPI Transaction ID / UTR:'}
                      </label>
                      <input
                        type="text"
                        value={paymentRefNo}
                        onChange={e => setPaymentRefNo(e.target.value)}
                        placeholder={paymentMode === 'Cheque' ? 'e.g. CHQ-489201 SBI Mandi' : 'e.g. UPI4892109841'}
                        className="w-full rounded-xl border border-slate-300 py-1.5 px-2.5 text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Notes / टिप्पणी
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Partial recovery against Bill #INV-26-0001"
                    className="w-full rounded-xl border border-slate-300 py-1.5 px-2.5 text-xs focus:outline-none"
                  />
                </div>

                {/* Submit Payment */}
                <button
                  type="submit"
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="w-full rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Issue Field Receipt (रसीद जारी करें)</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: ORDERS & FIELD RECEIPTS LIST */}
          {activeTab === 'ORDERS' && (
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[520px]">
              {/* 7-Day Wholesale Order Volume Bar Chart Visualization */}
              <WholesaleOrderVolumeChart orders={wholesaleOrders} />

              <div className="flex items-center justify-between pt-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Wholesale Orders Booked ({wholesaleOrders.length})
                </h4>
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync to POS</span>
                </button>
              </div>

              <div className="space-y-2">
                {wholesaleOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">
                            {order.orderNumber}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            order.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'Dispatched'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-800 mt-0.5">
                          {order.customerName}
                        </h5>
                        {order.customerBusinessName && (
                          <p className="text-[10px] text-slate-500">
                            {order.customerBusinessName}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-blue-900 block">
                          ₹{order.grandTotal.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {order.paymentTerms}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                      <div>
                        <span>Delivery: {order.expectedDeliveryDate}</span>
                        <span className="ml-2 font-semibold">({order.items.length} lines)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingWholesaleOrder({ ...order })}
                          className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Order"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingWholesaleOrder(order)}
                          className="p-1 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Order"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Field Payments */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Recent Field Payment Collections ({fieldPayments.length})
                </h4>
                <div className="space-y-1.5">
                  {fieldPayments.map(receipt => (
                    <div
                      key={receipt.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          {receipt.receiptNo} • {receipt.paymentMode}
                        </span>
                        <p className="font-semibold text-slate-900 text-xs">
                          {receipt.customerName}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(receipt.collectedAt).toLocaleDateString()} {new Date(receipt.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-700 text-sm">
                          + ₹{receipt.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDeletingPaymentReceipt(receipt)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Field Receipt"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Success Modals inside companion app */}
          {orderSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Order Submitted Successfully!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Order #{orderSuccessModal.orderNumber} for {orderSuccessModal.customerName} has been booked and queued for dispatch.
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total:</span>
                    <span className="font-mono font-bold">₹{orderSuccessModal.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Terms:</span>
                    <span className="font-semibold">{orderSuccessModal.paymentTerms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected Delivery:</span>
                    <span className="font-semibold">{orderSuccessModal.expectedDeliveryDate}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOrderSuccessModal(null)}
                  className="w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800"
                >
                  Done / Book Next Order
                </button>
              </div>
            </div>
          )}

          {paymentSuccessReceipt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Receipt className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Payment Collected!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Receipt #{paymentSuccessReceipt.receiptNo} generated for {paymentSuccessReceipt.customerName}.
                  </p>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-emerald-800 font-semibold">Amount Received:</span>
                    <span className="font-mono font-black text-emerald-950 text-sm">
                      ₹{paymentSuccessReceipt.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Mode:</span>
                    <span className="font-semibold">{paymentSuccessReceipt.paymentMode}</span>
                  </div>
                  {paymentSuccessReceipt.referenceNo && (
                    <div className="flex justify-between text-slate-600">
                      <span>Ref / UTR:</span>
                      <span className="font-mono">{paymentSuccessReceipt.referenceNo}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setPaymentSuccessReceipt(null)}
                  className="w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  Receipt Issued / Done
                </button>
              </div>
            </div>
          )}

          {/* Edit Wholesale Order Modal */}
          {editingWholesaleOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Edit2 className="h-4 w-4 text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Edit Order #{editingWholesaleOrder.orderNumber}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingWholesaleOrder(null)}
                    className="text-slate-400 hover:text-slate-700 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onUpdateWholesaleOrder) {
                      onUpdateWholesaleOrder(editingWholesaleOrder);
                    }
                    setEditingWholesaleOrder(null);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Order Status
                    </label>
                    <select
                      value={editingWholesaleOrder.status}
                      onChange={e => setEditingWholesaleOrder({
                        ...editingWholesaleOrder,
                        status: e.target.value as any
                      })}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 focus:outline-none focus:border-amber-600"
                    >
                      <option value="Pending_Approval">Pending Approval</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={editingWholesaleOrder.expectedDeliveryDate}
                      onChange={e => setEditingWholesaleOrder({
                        ...editingWholesaleOrder,
                        expectedDeliveryDate: e.target.value
                      })}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:border-amber-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={editingWholesaleOrder.paymentTerms}
                      onChange={e => setEditingWholesaleOrder({
                        ...editingWholesaleOrder,
                        paymentTerms: e.target.value as any
                      })}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 focus:outline-none focus:border-amber-600"
                    >
                      <option value="Credit-7-Days">Credit 7 Days</option>
                      <option value="Advance-UPI">Advance UPI</option>
                      <option value="Cash-on-Delivery">Cash on Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={editingWholesaleOrder.notes || ''}
                      onChange={e => setEditingWholesaleOrder({
                        ...editingWholesaleOrder,
                        notes: e.target.value
                      })}
                      placeholder="e.g. Urgent morning dispatch"
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingWholesaleOrder(null)}
                      className="flex-1 rounded-xl border border-slate-300 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-blue-700 py-2 font-bold text-white hover:bg-blue-800 shadow-xs"
                    >
                      Save Order
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Wholesale Order Confirmation */}
          {deletingWholesaleOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-center">
                <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Delete Order #{deletingWholesaleOrder.orderNumber}?
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Are you sure you want to remove this wholesale booking for {deletingWholesaleOrder.customerName}?
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingWholesaleOrder(null)}
                    className="flex-1 rounded-xl border border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteWholesaleOrder) {
                        onDeleteWholesaleOrder(deletingWholesaleOrder.id);
                      }
                      setDeletingWholesaleOrder(null);
                    }}
                    className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Field Payment Confirmation */}
          {deletingPaymentReceipt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 text-center">
                <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Delete Field Receipt #{deletingPaymentReceipt.receiptNo}?
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Receipt for ₹{deletingPaymentReceipt.amount.toLocaleString()} from {deletingPaymentReceipt.customerName}.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingPaymentReceipt(null)}
                    className="flex-1 rounded-xl border border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteFieldPayment) {
                        onDeleteFieldPayment(deletingPaymentReceipt.id);
                      }
                      setDeletingPaymentReceipt(null);
                    }}
                    className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Barcode scanner inside companion */}
          <BarcodeScannerModal
            isOpen={isBarcodeScannerOpen}
            onClose={() => setIsBarcodeScannerOpen(false)}
            products={products}
            onProductScanned={(prod, qty) => {
              handleAddProductToOrder(prod, qty);
              setActiveTab('NEW_ORDER');
            }}
            isB2B={true}
          />
        </div>
      </div>
    </div>
  );
};
