import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingBag, 
  Layers, 
  Banknote, 
  Trophy, 
  Building2, 
  Download, 
  Lock, 
  Plus, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  User,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Wheat,
  Crown,
  Smartphone,
  Gift,
  FileSpreadsheet,
  Keyboard,
  Settings,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { 
  Product, 
  Customer, 
  Invoice, 
  Supplier, 
  PurchaseOrder, 
  CashTransaction, 
  FifoBatch,
  WholesaleOrder,
  FieldPayment,
  LoyaltyHistoryEntry,
  PosSettings,
  UserRole
} from './types';
import { 
  loadStoredData, 
  saveAllData, 
  syncWithBackend, 
  calculateInventoryAlerts 
} from './utils/storage';
import { addBatchToProduct, updateBatchInProduct, deleteBatchFromProduct } from './utils/fifoEngine';
import { getCustomerTier } from './utils/loyaltyEngine';
import { 
  getStoredGoogleToken, 
  getGoogleSheetConfig, 
  appendInvoiceToGoogleSheet 
} from './utils/googleSheetsService';
import { getStoredPosSettings, saveStoredPosSettings } from './utils/posSettingsStorage';
import { PasscodeModal } from './components/PasscodeModal';
import { CustomerCaptureModal } from './components/CustomerCaptureModal';
import { PosRegister } from './components/PosRegister';
import { InvoiceReceiptModal } from './components/InvoiceReceiptModal';
import { InventoryManager } from './components/InventoryManager';
import { CashBookManager } from './components/CashBookManager';
import { AnalyticsReports } from './components/AnalyticsReports';
import { SupplierManager } from './components/SupplierManager';
import { DataExportHub } from './components/DataExportHub';
import { OfflineSyncBar } from './components/OfflineSyncBar';
import { LoyaltyRewardsView } from './components/LoyaltyRewardsView';
import { WholesaleCompanionApp } from './components/WholesaleCompanionApp';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { PosSettingsModal } from './components/PosSettingsModal';
import { PasscodeSettingsModal } from './components/PasscodeSettingsModal';

export default function App() {
  // App Security & Initial State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('OWNER');
  const [showPasscodeSettingsModal, setShowPasscodeSettingsModal] = useState(false);
  const [pendingElevatedAction, setPendingElevatedAction] = useState<{
    title: string;
    description: string;
    onSuccess: () => void;
  } | null>(null);
  const [showCustomerCapture, setShowCustomerCapture] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'POS' | 'INVENTORY' | 'CASHBOOK' | 'ANALYTICS' | 'SUPPLIERS' | 'LOYALTY' | 'WHOLESALE_APP' | 'EXPORT'
  >('POS');

  // Core Data Entities
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [wholesaleOrders, setWholesaleOrders] = useState<WholesaleOrder[]>([]);
  const [fieldPayments, setFieldPayments] = useState<FieldPayment[]>([]);

  // Current active customer for billing
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [activeCustomerInitialDue, setActiveCustomerInitialDue] = useState<number>(0);
  const [activeCustomerInitialAdvance, setActiveCustomerInitialAdvance] = useState<number>(0);

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<Invoice | null>(null);
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState(false);

  // POS Customization & Keyboard Shortcuts state
  const [posSettings, setPosSettings] = useState<PosSettings>(() => getStoredPosSettings());
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleUpdatePosSettings = (newSettings: PosSettings) => {
    setPosSettings(newSettings);
    saveStoredPosSettings(newSettings);
  };

  // Offline-first sync status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Load initial data on mount
  useEffect(() => {
    const data = loadStoredData();
    setProducts(data.products);
    setCustomers(data.customers);
    setInvoices(data.invoices);
    setSuppliers(data.suppliers);
    setPurchaseOrders(data.purchaseOrders);
    setCashTransactions(data.cashTransactions);
    setWholesaleOrders(data.wholesaleOrders || []);
    setFieldPayments(data.fieldPayments || []);

    // Initial customer fallback
    if (data.customers.length > 0) {
      setCurrentCustomer(data.customers[0]);
    }

    // Attempt initial background sync to seed backend
    syncWithBackend({
      sales: data.invoices,
      inventory: data.products,
      suppliers: data.suppliers,
      customers: data.customers,
      cashBook: data.cashTransactions,
      wholesaleOrders: data.wholesaleOrders || [],
      fieldPayments: data.fieldPayments || []
    }).then(res => {
      if (res.success) {
        setLastSyncedAt(res.timestamp || new Date().toISOString());
      }
    });
  }, []);

  // Sync helper
  const handleBackgroundSync = useCallback(async () => {
    if (!navigator.onLine || isSimulatedOffline) return;

    try {
      const res = await syncWithBackend({
        sales: invoices,
        inventory: products,
        suppliers,
        customers,
        cashBook: cashTransactions,
        wholesaleOrders,
        fieldPayments
      });
      if (res.success) {
        setLastSyncedAt(res.timestamp || new Date().toISOString());
        setPendingSyncCount(0);
        // Mark all invoices as synced
        setInvoices(prev => prev.map(inv => ({ ...inv, synced: true })));
      }
    } catch (e) {
      console.warn('Background sync deferred:', e);
    }
  }, [invoices, products, suppliers, customers, cashTransactions, wholesaleOrders, fieldPayments, isSimulatedOffline]);

  // Listen for online / offline window events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto sync on reconnection
      handleBackgroundSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleBackgroundSync]);

  // Passcode unlock handler with role detection
  const handlePasscodeSuccess = (role: UserRole = 'OWNER') => {
    setUserRole(role);
    setIsUnlocked(true);
    // If logged in as Cashier, restrict starting view to POS daily billing
    if (role === 'CASHIER') {
      setActiveTab('POS');
    }
    // User requested: "when I open My POS Software I have to enter Passcode and then I saw a popup of Enter Customer Mobile Number"
    setShowCustomerCapture(true);
  };

  // Lock the screen again
  const handleLockScreen = () => {
    setIsUnlocked(false);
  };

  // Role-gated tab click handler
  const handleTabClick = (tab: typeof activeTab, tabLabel: string) => {
    if (userRole === 'CASHIER' && tab !== 'POS') {
      setPendingElevatedAction({
        title: `Owner Access Required: ${tabLabel}`,
        description: `Owner passcode is required to access "${tabLabel}". Cashier mode is restricted to Daily Billing only without customization or editing.`,
        onSuccess: () => {
          setActiveTab(tab);
        }
      });
      return;
    }
    setActiveTab(tab);
  };

  // Role-gated settings handler
  const handleOpenPosSettings = () => {
    if (userRole === 'CASHIER') {
      setPendingElevatedAction({
        title: 'Unlock POS Settings & Customization',
        description: 'Owner passcode is required to customize POS preferences, shortcut keys, and bill header details.',
        onSuccess: () => {
          setShowSettingsModal(true);
        }
      });
      return;
    }
    setShowSettingsModal(true);
  };

  // Role-gated passcode settings handler
  const handleOpenPasscodeSettings = () => {
    if (userRole === 'CASHIER') {
      setPendingElevatedAction({
        title: 'Manage Passcodes',
        description: 'Owner passcode is required to update Owner and Cashier passcodes.',
        onSuccess: () => {
          setShowPasscodeSettingsModal(true);
        }
      });
      return;
    }
    setShowPasscodeSettingsModal(true);
  };

  // App-level global keyboard listener (F1, F11, F12, F10)
  useEffect(() => {
    const handleAppGlobalKeyDown = (e: KeyboardEvent) => {
      // F1: Help / Shortcuts Sheet
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }
      // F11: POS Settings & Customization
      if (e.key === 'F11' || (e.ctrlKey && e.key === ',')) {
        e.preventDefault();
        setShowSettingsModal(prev => !prev);
        return;
      }
      // F12: Lock screen
      if (e.key === 'F12') {
        e.preventDefault();
        handleLockScreen();
        return;
      }
      // F10: Re-open last invoice if any
      if (e.key === 'F10' && !activeReceipt && invoices.length > 0) {
        e.preventDefault();
        setActiveReceipt(invoices[0]);
        return;
      }
    };

    window.addEventListener('keydown', handleAppGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleAppGlobalKeyDown);
  }, [invoices, activeReceipt]);

  // Add new customer
  const handleAddNewCustomer = (newCust: Customer) => {
    setCustomers(prev => {
      const updated = [...prev, newCust];
      saveAllData({ customers: updated });
      return updated;
    });
  };

  // Select customer from modal
  const handleCustomerSelected = (cust: Customer, initialDueToAdd?: number, initialAdvanceToAdjust?: number) => {
    setCurrentCustomer(cust);
    setActiveCustomerInitialDue(initialDueToAdd || 0);
    setActiveCustomerInitialAdvance(initialAdvanceToAdjust || 0);
    setShowCustomerCapture(false);
    setActiveTab('POS');
  };

  // Complete a sale
  const handleCompleteSale = (newInvoice: Invoice, updatedProducts: Product[]) => {
    // 1. Save invoice
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);

    // 2. Update stock
    setProducts(updatedProducts);

    // 3. Update customer stats, credit, advance balance, and Loyalty Points
    const updatedCustomers = customers.map(c => {
      if (c.id === newInvoice.customerId || c.mobileNumber === newInvoice.customerMobile) {
        const isCreditSale = newInvoice.paymentMethod === 'Credit-7-Days';
        const newTotalSpend = (c.totalPurchases || 0) + newInvoice.grandTotal;
        const currentPoints = c.loyaltyPoints || 0;
        const pointsEarned = newInvoice.pointsEarned || 0;
        const pointsRedeemed = newInvoice.pointsRedeemed || 0;
        const netPoints = Math.max(0, currentPoints - pointsRedeemed + pointsEarned);
        const newTier = getCustomerTier(newTotalSpend);

        // Previous Due & Advance Balance Calculation
        const prevDue = c.outstandingCredit || 0;
        const prevAdvance = c.advanceBalance || 0;

        let newOutstanding = prevDue;
        if (isCreditSale) {
          // If credit sale, add bill total minus any previously already accounted due
          newOutstanding = prevDue + (newInvoice.grandTotal - (newInvoice.previousDueAdded || 0));
        } else if (newInvoice.previousDueAdded && newInvoice.previousDueAdded > 0) {
          // Bill paid in Cash/UPI/Card/Transfer, so previous due has been settled!
          newOutstanding = Math.max(0, prevDue - newInvoice.previousDueAdded);
        }

        let newAdvanceBalance = prevAdvance;
        if (newInvoice.advanceAdjusted && newInvoice.advanceAdjusted > 0) {
          // Advance deposit was deducted to pay part of this bill
          newAdvanceBalance = Math.max(0, prevAdvance - newInvoice.advanceAdjusted);
        }

        const historyEntry: LoyaltyHistoryEntry = {
          id: `lh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: newInvoice.date,
          type: pointsRedeemed > 0 ? 'REDEEMED' : 'EARNED',
          points: pointsRedeemed > 0 ? -pointsRedeemed : pointsEarned,
          balanceAfter: netPoints,
          description: pointsRedeemed > 0 
            ? `Redeemed on Bill #${newInvoice.invoiceNo} (Earned +${pointsEarned})` 
            : `Earned on Bill #${newInvoice.invoiceNo} (₹${newInvoice.grandTotal})`,
          invoiceId: newInvoice.id
        };

        const updatedCustomer: Customer = {
          ...c,
          totalPurchases: newTotalSpend,
          orderCount: (c.orderCount || 0) + 1,
          outstandingCredit: newOutstanding,
          advanceBalance: newAdvanceBalance,
          loyaltyPoints: netPoints,
          loyaltyTier: newTier,
          loyaltyHistory: [historyEntry, ...(c.loyaltyHistory || [])]
        };

        if (currentCustomer && (currentCustomer.id === c.id || currentCustomer.mobileNumber === c.mobileNumber)) {
          setCurrentCustomer(updatedCustomer);
        }

        return updatedCustomer;
      }
      return c;
    });
    setCustomers(updatedCustomers);

    // Reset initial due/advance states
    setActiveCustomerInitialDue(0);
    setActiveCustomerInitialAdvance(0);

    // 4. If paid in Cash, record in Day Book
    let updatedCash = [...cashTransactions];
    if (newInvoice.paymentMethod === 'Cash') {
      const cashEntry: CashTransaction = {
        id: `ctx-${Date.now()}`,
        date: newInvoice.date,
        type: 'CASH_IN',
        category: 'BILLING_CASH',
        amount: newInvoice.grandTotal,
        description: `Cash sale bill #${newInvoice.invoiceNo} (${newInvoice.customerName})`,
        refId: newInvoice.id
      };
      updatedCash = [cashEntry, ...updatedCash];
      setCashTransactions(updatedCash);
    }

    // 5. Save everything to local storage (Offline First)
    saveAllData({
      products: updatedProducts,
      invoices: updatedInvoices,
      customers: updatedCustomers,
      cashTransactions: updatedCash,
      wholesaleOrders,
      fieldPayments
    });

    // 6. Update pending sync count
    setPendingSyncCount(prev => prev + 1);

    // 7. Auto-sync if online
    if (isOnline && !isSimulatedOffline) {
      syncWithBackend({
        sales: updatedInvoices,
        inventory: updatedProducts,
        suppliers,
        customers: updatedCustomers,
        cashBook: updatedCash,
        wholesaleOrders,
        fieldPayments
      }).then(res => {
        if (res.success) {
          setLastSyncedAt(new Date().toISOString());
          setPendingSyncCount(0);
        }
      });
    }

    // 8. Auto-append to Google Sheets if token & config active
    const gToken = getStoredGoogleToken();
    const gConfig = getGoogleSheetConfig();
    if (gToken && gConfig.autoSync && gConfig.spreadsheetId) {
      appendInvoiceToGoogleSheet(gToken, gConfig.spreadsheetId, newInvoice).catch(err => {
        console.warn('Real-time Google Sheet append error:', err);
      });
    }

    // 9. Open receipt modal
    setActiveReceipt(newInvoice);
  };

  // Wholesale App: Create Order from Sales Rep
  const handleCreateWholesaleOrder = (order: WholesaleOrder, updatedProductsList: Product[]) => {
    const updatedOrders = [order, ...wholesaleOrders];
    setWholesaleOrders(updatedOrders);
    setProducts(updatedProductsList);

    // If 7-day credit, increase outstanding credit on customer
    let updatedCustomers = [...customers];
    if (order.paymentTerms === 'Credit-7-Days') {
      updatedCustomers = customers.map(c => {
        if (c.id === order.customerId) {
          return {
            ...c,
            outstandingCredit: (c.outstandingCredit || 0) + order.grandTotal,
            totalPurchases: (c.totalPurchases || 0) + order.grandTotal,
            orderCount: (c.orderCount || 0) + 1
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
    }

    saveAllData({
      wholesaleOrders: updatedOrders,
      products: updatedProductsList,
      customers: updatedCustomers
    });
    setPendingSyncCount(prev => prev + 1);

    if (isOnline && !isSimulatedOffline) {
      syncWithBackend({
        wholesaleOrders: updatedOrders,
        inventory: updatedProductsList,
        customers: updatedCustomers
      });
    }
  };

  // Wholesale App: Record Field Payment Collected by Rep
  const handleRecordFieldPayment = (payment: FieldPayment) => {
    const updatedPayments = [payment, ...fieldPayments];
    setFieldPayments(updatedPayments);

    // Deduct outstanding credit on customer
    const updatedCustomers = customers.map(c => {
      if (c.id === payment.customerId) {
        return {
          ...c,
          outstandingCredit: Math.max(0, (c.outstandingCredit || 0) - payment.amount)
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);

    // If Cash collected in field, record in day book
    let updatedCash = [...cashTransactions];
    if (payment.paymentMode === 'Cash') {
      const cashEntry: CashTransaction = {
        id: `ctx-${Date.now()}`,
        date: payment.collectedAt,
        type: 'CASH_IN',
        category: 'CREDIT_REPAYMENT',
        amount: payment.amount,
        description: `Field collection by ${payment.salesRepName} from ${payment.customerName}`,
        refId: payment.id
      };
      updatedCash = [cashEntry, ...updatedCash];
      setCashTransactions(updatedCash);
    }

    saveAllData({
      fieldPayments: updatedPayments,
      customers: updatedCustomers,
      cashTransactions: updatedCash
    });
    setPendingSyncCount(prev => prev + 1);

    if (isOnline && !isSimulatedOffline) {
      syncWithBackend({
        fieldPayments: updatedPayments,
        customers: updatedCustomers,
        cashBook: updatedCash
      });
    }
  };

  // Loyalty Program: Grant Bonus Points to Customer
  const handleGrantBonusPoints = (customerId: string, bonusPoints: number, reason: string) => {
    const updatedCustomers = customers.map(c => {
      if (c.id === customerId) {
        const newBalance = (c.loyaltyPoints || 0) + bonusPoints;
        const historyEntry: LoyaltyHistoryEntry = {
          id: `lh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString(),
          type: 'BONUS',
          points: bonusPoints,
          balanceAfter: newBalance,
          description: reason
        };
        return {
          ...c,
          loyaltyPoints: newBalance,
          loyaltyHistory: [historyEntry, ...(c.loyaltyHistory || [])]
        };
      }
      return c;
    });

    setCustomers(updatedCustomers);
    saveAllData({ customers: updatedCustomers });
    setPendingSyncCount(prev => prev + 1);
  };

  // Add Manufactured or Procured FIFO Batch
  const handleAddBatch = (productId: string, batch: FifoBatch) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        return addBatchToProduct(p, batch);
      }
      return p;
    });

    setProducts(updated);
    saveAllData({ products: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  // Add Cash In / Out Transaction
  const handleAddCashTransaction = (tx: CashTransaction) => {
    const updated = [tx, ...cashTransactions];
    setCashTransactions(updated);
    saveAllData({ cashTransactions: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  // Customer Credit Repayment
  const handleCustomerRepayment = (customerId: string, amount: number) => {
    const updated = customers.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          outstandingCredit: Math.max(0, c.outstandingCredit - amount)
        };
      }
      return c;
    });
    setCustomers(updated);
    saveAllData({ customers: updated });
  };

  // Purchase Order creation
  const handleCreatePO = (po: PurchaseOrder) => {
    const updatedPOs = [po, ...purchaseOrders];
    setPurchaseOrders(updatedPOs);
    saveAllData({ purchaseOrders: updatedPOs });
  };

  // Receive PO goods (Inward FIFO)
  const handleReceivePO = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    // Mark PO received
    const updatedPOs = purchaseOrders.map(p => {
      if (p.id === poId) {
        return { ...p, status: 'Received' as const, receivedAt: new Date().toISOString() };
      }
      return p;
    });
    setPurchaseOrders(updatedPOs);

    // Update supplier pending balance
    const updatedSuppliers = suppliers.map(s => {
      if (s.id === po.supplierId) {
        return {
          ...s,
          pendingBalance: s.pendingBalance + (po.totalAmount - po.paidAmount)
        };
      }
      return s;
    });
    setSuppliers(updatedSuppliers);

    // Automatically create new FIFO batch for matched product if finished good
    let updatedProducts = [...products];
    po.items.forEach(it => {
      const matchedProdIndex = updatedProducts.findIndex(
        p => p.name.toLowerCase().includes(it.itemName.toLowerCase()) || it.itemName.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matchedProdIndex > -1) {
        const prod = updatedProducts[matchedProdIndex];
        const newBatch: FifoBatch = {
          batchId: `GRN-${po.poNumber}-${Date.now().toString().slice(-4)}`,
          mfgDate: new Date().toISOString().split('T')[0],
          expiryDate: (() => {
            const d = new Date();
            d.setMonth(d.getMonth() + 4);
            return d.toISOString().split('T')[0];
          })(),
          inwardQty: it.qty,
          availableQty: it.qty,
          unitCost: it.unitCost,
          supplierName: po.supplierName,
          poId: po.id
        };
        updatedProducts[matchedProdIndex] = addBatchToProduct(prod, newBatch);
      }
    });
    setProducts(updatedProducts);

    saveAllData({
      purchaseOrders: updatedPOs,
      suppliers: updatedSuppliers,
      products: updatedProducts
    });

    alert(`Goods Receipt (GRN) confirmed for ${po.poNumber}. FIFO inventory and supplier dues updated!`);
  };

  // Pay Supplier Pending Invoice
  const handleRecordSupplierPayment = (supplierId: string, amount: number, mode: string) => {
    const sup = suppliers.find(s => s.id === supplierId);
    if (!sup) return;

    // Deduct supplier dues
    const updatedSuppliers = suppliers.map(s => {
      if (s.id === supplierId) {
        return {
          ...s,
          pendingBalance: Math.max(0, s.pendingBalance - amount)
        };
      }
      return s;
    });
    setSuppliers(updatedSuppliers);

    // If paid via cash, deduct from Day Book
    let updatedCash = [...cashTransactions];
    if (mode === 'Cash') {
      const cashEntry: CashTransaction = {
        id: `ctx-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'CASH_OUT',
        category: 'SUPPLIER_PAYMENT',
        amount,
        description: `Cash payment to ${sup.name} for grain/raw material supply`,
        refId: sup.id
      };
      updatedCash = [cashEntry, ...updatedCash];
      setCashTransactions(updatedCash);
    }

    saveAllData({
      suppliers: updatedSuppliers,
      cashTransactions: updatedCash
    });
  };

  // --- PRODUCT & BATCH CRUD HANDLERS ---
  const handleUpdateProduct = (updatedProd: Product) => {
    const updated = products.map(p => p.id === updatedProd.id ? updatedProd : p);
    setProducts(updated);
    saveAllData({ products: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleAddProduct = (newProd: Product) => {
    const updated = [newProd, ...products];
    setProducts(updated);
    saveAllData({ products: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    saveAllData({ products: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleUpdateBatch = (productId: string, batchId: string, updatedBatch: FifoBatch) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        return updateBatchInProduct(p, batchId, updatedBatch);
      }
      return p;
    });
    setProducts(updated);
    saveAllData({ products: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleDeleteBatch = (productId: string, batchId: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        return deleteBatchFromProduct(p, batchId);
      }
      return p;
    });
    setProducts(updated);
    saveAllData({ products: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  // --- CUSTOMER CRUD HANDLERS ---
  const handleUpdateCustomer = (updatedCust: Customer) => {
    const updated = customers.map(c => c.id === updatedCust.id ? updatedCust : c);
    setCustomers(updated);
    if (currentCustomer?.id === updatedCust.id) {
      setCurrentCustomer(updatedCust);
    }
    saveAllData({ customers: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const updated = customers.filter(c => c.id !== customerId);
    setCustomers(updated);
    if (currentCustomer?.id === customerId) {
      setCurrentCustomer(null);
    }
    saveAllData({ customers: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  // --- SUPPLIER & PO CRUD HANDLERS ---
  const handleAddSupplier = (newSup: Supplier) => {
    const updated = [newSup, ...suppliers];
    setSuppliers(updated);
    saveAllData({ suppliers: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleUpdateSupplier = (updatedSup: Supplier) => {
    const updated = suppliers.map(s => s.id === updatedSup.id ? updatedSup : s);
    setSuppliers(updated);
    saveAllData({ suppliers: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const updated = suppliers.filter(s => s.id !== supplierId);
    setSuppliers(updated);
    saveAllData({ suppliers: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleUpdatePO = (updatedPO: PurchaseOrder) => {
    const updated = purchaseOrders.map(p => p.id === updatedPO.id ? updatedPO : p);
    setPurchaseOrders(updated);
    saveAllData({ purchaseOrders: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleDeletePO = (poId: string) => {
    const updated = purchaseOrders.filter(p => p.id !== poId);
    setPurchaseOrders(updated);
    saveAllData({ purchaseOrders: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  // --- CASH TRANSACTION CRUD HANDLERS ---
  const handleUpdateCashTransaction = (updatedTx: CashTransaction) => {
    const updated = cashTransactions.map(t => t.id === updatedTx.id ? updatedTx : t);
    setCashTransactions(updated);
    saveAllData({ cashTransactions: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleDeleteCashTransaction = (txId: string) => {
    const updated = cashTransactions.filter(t => t.id !== txId);
    setCashTransactions(updated);
    saveAllData({ cashTransactions: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  // --- WHOLESALE ORDERS & FIELD PAYMENTS HANDLERS ---
  const handleSaveWholesaleOrder = (order: WholesaleOrder) => {
    let updatedProductsList = [...products];
    order.items.forEach(it => {
      const prod = updatedProductsList.find(p => p.id === it.productId);
      if (prod) {
        updatedProductsList = updatedProductsList.map(p => {
          if (p.id === it.productId) {
            return {
              ...p,
              totalStock: Math.max(0, p.totalStock - it.quantity)
            };
          }
          return p;
        });
      }
    });

    const updatedOrders = [order, ...wholesaleOrders];
    setWholesaleOrders(updatedOrders);
    setProducts(updatedProductsList);

    let updatedCustomers = [...customers];
    if (order.paymentTerms === 'Credit-7-Days') {
      updatedCustomers = customers.map(c => {
        if (c.id === order.customerId) {
          return {
            ...c,
            outstandingCredit: (c.outstandingCredit || 0) + order.grandTotal,
            totalPurchases: (c.totalPurchases || 0) + order.grandTotal,
            orderCount: (c.orderCount || 0) + 1
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
    }

    saveAllData({
      wholesaleOrders: updatedOrders,
      products: updatedProductsList,
      customers: updatedCustomers
    });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleUpdateWholesaleOrder = (updatedOrder: WholesaleOrder) => {
    const updated = wholesaleOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setWholesaleOrders(updated);
    saveAllData({ wholesaleOrders: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleDeleteWholesaleOrder = (orderId: string) => {
    const updated = wholesaleOrders.filter(o => o.id !== orderId);
    setWholesaleOrders(updated);
    saveAllData({ wholesaleOrders: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleRecordFieldPaymentReceipt = (receipt: FieldPayment, updatedCust: Customer) => {
    const updatedPayments = [receipt, ...fieldPayments];
    setFieldPayments(updatedPayments);

    const updatedCusts = customers.map(c => c.id === updatedCust.id ? updatedCust : c);
    setCustomers(updatedCusts);

    let updatedCash = [...cashTransactions];
    if (receipt.paymentMode === 'Cash') {
      const cashEntry: CashTransaction = {
        id: `ctx-${Date.now()}`,
        date: receipt.collectedAt,
        type: 'CASH_IN',
        category: 'CREDIT_REPAYMENT',
        amount: receipt.amount,
        description: `Field collection by ${receipt.salesRepName} from ${receipt.customerName}`,
        refId: receipt.id
      };
      updatedCash = [cashEntry, ...updatedCash];
      setCashTransactions(updatedCash);
    }

    saveAllData({
      fieldPayments: updatedPayments,
      customers: updatedCusts,
      cashTransactions: updatedCash
    });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleDeleteFieldPayment = (receiptId: string) => {
    const updated = fieldPayments.filter(p => p.id !== receiptId);
    setFieldPayments(updated);
    saveAllData({ fieldPayments: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  // --- INVOICE CRUD HANDLERS ---
  const handleUpdateInvoice = (updatedInv: Invoice) => {
    const updated = invoices.map(i => i.id === updatedInv.id ? updatedInv : i);
    setInvoices(updated);
    saveAllData({ invoices: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  const handleCancelInvoice = (invoiceId: string) => {
    const updated = invoices.map(i => {
      if (i.id === invoiceId) {
        return {
          ...i,
          status: 'Cancelled' as const,
          notes: `${i.notes ? i.notes + ' ' : ''}[CANCELLED on ${new Date().toLocaleDateString()}]`
        };
      }
      return i;
    });
    setInvoices(updated);
    saveAllData({ invoices: updated });
    setPendingSyncCount(prev => prev + 1);
  };

  // Inventory alerts count for badge
  const inventoryAlertsCount = calculateInventoryAlerts(products).length;
  const restockAlertsCount = products.filter(p => p.totalStock <= p.minStockThreshold).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* 1. Passcode Screen on Open */}
      <PasscodeModal
        isOpen={!isUnlocked}
        onSuccess={handlePasscodeSuccess}
      />

      {/* 2. Customer Mobile Number Pop-up */}
      <CustomerCaptureModal
        isOpen={isUnlocked && showCustomerCapture}
        onClose={() => setShowCustomerCapture(false)}
        onSelectCustomer={handleCustomerSelected}
        customers={customers}
        onAddNewCustomer={handleAddNewCustomer}
      />

      {/* 3. Invoice Receipt Modal */}
      <InvoiceReceiptModal
        invoice={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        onNewBill={() => {
          setActiveReceipt(null);
          setShowCustomerCapture(true);
        }}
        posSettings={posSettings}
      />

      {/* 4. Keyboard Shortcuts Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        shortcuts={posSettings.shortcuts}
        onOpenSettings={() => {
          setShowShortcutsModal(false);
          setShowSettingsModal(true);
        }}
      />

      {/* 5. POS Settings & Customization Modal */}
      <PosSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={posSettings}
        onSaveSettings={handleUpdatePosSettings}
      />

      {/* 6. Owner & Cashier Passcode Settings Modal */}
      <PasscodeSettingsModal
        isOpen={showPasscodeSettingsModal}
        onClose={() => setShowPasscodeSettingsModal(false)}
        userRole={userRole}
      />

      {/* 7. Owner Passcode Elevation Modal for Gated Actions */}
      {pendingElevatedAction && (
        <PasscodeModal
          isOpen={true}
          onClose={() => setPendingElevatedAction(null)}
          requiredRole="OWNER"
          title={pendingElevatedAction.title}
          subtitle={pendingElevatedAction.description}
          onSuccess={(elevatedRole) => {
            setUserRole(elevatedRole);
            const callback = pendingElevatedAction.onSuccess;
            setPendingElevatedAction(null);
            callback();
          }}
        />
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-amber-900 text-white shadow-md">
        {/* Brand & Main Control Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Shop Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 font-black shadow-inner">
              <Wheat className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 id="header-brand-title" className="text-lg sm:text-xl font-black tracking-tight leading-tight text-white drop-shadow-xs flex flex-wrap items-baseline gap-2">
                  <span>Mamjista Food Products</span>
                  <span className="text-xs font-semibold text-amber-200/90 tracking-normal">
                    (ममजिस्टा फूड प्रोडक्ट्स)
                  </span>
                </h1>
                <span className="hidden sm:inline-block rounded-md bg-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200 border border-amber-700">
                  POS v2.6
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-tight font-medium">
                Atta • Besan • Sattu • Masale • Spices | B2B Wholesale &amp; Retail POS
              </p>
            </div>
          </div>

          {/* Customer & Lock Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Role Badge */}
            {userRole === 'OWNER' ? (
              <div 
                id="user-role-badge-owner"
                className="flex items-center gap-1.5 rounded-xl bg-amber-950/70 px-3 py-1.5 text-xs font-bold text-amber-200 border border-amber-700/80 shadow-xs"
                title="Logged in with Owner Passcode (Full Editing, Pricing & Customization Unlocked)"
              >
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span>Owner Mode</span>
              </div>
            ) : (
              <div 
                id="user-role-badge-cashier"
                className="flex items-center gap-1.5 rounded-xl bg-blue-950/80 px-3 py-1 text-xs font-bold text-blue-200 border border-blue-600/80 shadow-xs"
                title="Logged in with Cashier Passcode (Billing Only - Editing Locked)"
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Cashier (Billing Only)</span>
                <button
                  type="button"
                  id="unlock-owner-header-btn"
                  onClick={() => {
                    setPendingElevatedAction({
                      title: 'Switch to Owner Mode',
                      description: 'Enter Owner Passcode to unlock full system customization, editing, and management:',
                      onSuccess: () => {}
                    });
                  }}
                  className="ml-1 rounded bg-blue-700 hover:bg-blue-600 px-2 py-0.5 text-[10px] text-white font-bold transition-all shadow-xs"
                >
                  Unlock Owner
                </button>
              </div>
            )}

            {currentCustomer && (
              <button
                type="button"
                id="current-customer-btn"
                onClick={() => setShowCustomerCapture(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-800/80 hover:bg-amber-800 px-3 py-1.5 text-xs font-semibold text-amber-100 border border-amber-700/60 transition-colors"
                title="Click to change customer or enter new mobile number"
              >
                <Phone className="h-3.5 w-3.5 text-amber-300" />
                <span className="max-w-[120px] truncate">{currentCustomer.name}</span>
                <span className="text-[10px] font-mono text-amber-300">
                  ({currentCustomer.mobileNumber.slice(-4)})
                </span>
              </button>
            )}

            <button
              type="button"
              id="new-customer-nav-btn"
              onClick={() => setShowCustomerCapture(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-amber-950 shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Bill (नया बिल)</span>
            </button>

            {/* Keyboard Shortcuts Button */}
            <button
              type="button"
              id="keyboard-shortcuts-header-btn"
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-800/80 hover:bg-amber-800 px-3 py-1.5 text-xs font-bold text-amber-200 border border-amber-700/70 shadow-xs transition-colors"
              title="Keyboard Shortcuts Cheat Sheet [F1 or ?]"
            >
              <Keyboard className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden lg:inline">Shortcuts</span>
              <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-mono text-amber-300">[F1]</span>
            </button>

            {/* POS Settings & Customization Button */}
            <button
              type="button"
              id="pos-settings-header-btn"
              onClick={handleOpenPosSettings}
              className="flex items-center gap-1.5 rounded-xl bg-amber-800/80 hover:bg-amber-800 px-2.5 py-1.5 text-xs font-bold text-amber-200 border border-amber-700/70 shadow-xs transition-colors"
              title={userRole === 'CASHIER' ? "POS Settings (Owner Passcode Required)" : "POS Settings & Key Customization [F11]"}
            >
              <Settings className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden xl:inline">Settings</span>
              {userRole === 'CASHIER' ? (
                <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-mono text-amber-300">🔒</span>
              ) : (
                <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-mono text-amber-300">[F11]</span>
              )}
            </button>

            {/* Passcode Management Button (Owner & Cashier passcodes) */}
            <button
              type="button"
              id="passcode-settings-header-btn"
              onClick={handleOpenPasscodeSettings}
              className="flex items-center gap-1.5 rounded-xl bg-amber-800/80 hover:bg-amber-800 px-2.5 py-1.5 text-xs font-bold text-amber-200 border border-amber-700/70 shadow-xs transition-colors"
              title={userRole === 'CASHIER' ? "Change Owner & Cashier Passcodes (Owner Passcode Required)" : "Change Owner & Cashier Passcodes"}
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden xl:inline">Passcodes</span>
              {userRole === 'CASHIER' && (
                <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-mono text-amber-300">🔒</span>
              )}
            </button>

            {/* Google Sheets Live Sync Button */}
            <button
              type="button"
              id="google-sheets-header-btn"
              onClick={() => {
                if (userRole === 'CASHIER') {
                  setPendingElevatedAction({
                    title: 'Unlock Google Sheets Sync & Configuration',
                    description: 'Owner passcode is required to access cloud database sync and configuration.',
                    onSuccess: () => setShowGoogleSheetsModal(true)
                  });
                } else {
                  setShowGoogleSheetsModal(true);
                }
              }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white border border-emerald-600/70 shadow-xs transition-colors"
              title="Google Sheets Cloud Sync & Database Settings"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-300" />
              <span className="hidden md:inline">Google Sheets</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-xs" />
            </button>

            <button
              type="button"
              id="lock-screen-btn"
              onClick={handleLockScreen}
              className="flex items-center gap-1 rounded-xl bg-amber-950/60 hover:bg-amber-950 px-2.5 py-1.5 text-xs font-medium text-amber-200 border border-amber-800/80 transition-colors"
              title="Lock POS register [F12]"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lock</span>
              <span className="rounded bg-amber-900/60 px-1 py-0.2 text-[9px] font-mono text-amber-300 hidden md:inline">[F12]</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-amber-950/50 border-t border-amber-800/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
            <button
              type="button"
              id="nav-tab-pos"
              onClick={() => handleTabClick('POS', 'Daily Billing')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'POS'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Daily Billing (दैनिक बिलिंग)</span>
            </button>

            <button
              type="button"
              id="nav-tab-inventory"
              onClick={() => handleTabClick('INVENTORY', 'FIFO Stock & Batches')}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'INVENTORY'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>FIFO Stock &amp; Batches</span>
              {userRole === 'CASHIER' && (
                <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                  🔒 Owner
                </span>
              )}
              {inventoryAlertsCount > 0 && (
                <span className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex items-center gap-0.5 rounded-full bg-rose-600 text-white px-1.5 py-0.2 text-[10px] font-black animate-pulse">
                    {inventoryAlertsCount}
                  </span>
                </span>
              )}
            </button>

            <button
              type="button"
              id="nav-tab-cashbook"
              onClick={() => handleTabClick('CASHBOOK', 'Cash In & Out')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'CASHBOOK'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <Banknote className="h-4 w-4" />
              <span>Cash In &amp; Out (रोकड़ बही)</span>
              {userRole === 'CASHIER' && (
                <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                  🔒 Owner
                </span>
              )}
            </button>

            <button
              type="button"
              id="nav-tab-loyalty"
              onClick={() => handleTabClick('LOYALTY', 'Loyalty & Rewards')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'LOYALTY'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <Crown className="h-4 w-4 text-amber-300" />
              <span>Loyalty &amp; Rewards (लॉयल्टी)</span>
              {userRole === 'CASHIER' && (
                <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                  🔒 Owner
                </span>
              )}
            </button>

            <button
              type="button"
              id="nav-tab-wholesale-app"
              onClick={() => handleTabClick('WHOLESALE_APP', 'Wholesale Rep App')}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'WHOLESALE_APP'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <Smartphone className="h-4 w-4 text-blue-300" />
              <span>Wholesale Rep Mobile App</span>
              {userRole === 'CASHIER' && (
                <span className="rounded bg-blue-950 px-1 py-0.2 text-[9px] font-bold text-blue-300">
                  🔒 Owner
                </span>
              )}
              {restockAlertsCount > 0 ? (
                <span className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex items-center gap-1 rounded-full bg-rose-600 text-white px-2 py-0.5 text-[9px] font-black uppercase animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                    {restockAlertsCount} Low Stock
                  </span>
                </span>
              ) : (
                <span className="rounded-full bg-blue-500 text-white px-1.5 py-0.2 text-[9px] font-black uppercase">
                  B2B Rep
                </span>
              )}
            </button>

            <button
              type="button"
              id="nav-tab-analytics"
              onClick={() => handleTabClick('ANALYTICS', 'Analytics & Reports')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'ANALYTICS'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Top Buyers &amp; Products</span>
              {userRole === 'CASHIER' && (
                <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                  🔒 Owner
                </span>
              )}
            </button>

            <button
              type="button"
              id="nav-tab-suppliers"
              onClick={() => handleTabClick('SUPPLIERS', 'Suppliers & POs')}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'SUPPLIERS'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Suppliers &amp; POs</span>
              {userRole === 'CASHIER' && (
                <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                  🔒 Owner
                </span>
              )}
              {restockAlertsCount > 0 && (
                <span className="rounded-full bg-amber-400 text-amber-950 px-1.5 py-0.2 text-[10px] font-black">
                  {restockAlertsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              id="nav-tab-export"
              onClick={() => handleTabClick('EXPORT', 'API & Exports')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'EXPORT'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <Download className="h-4 w-4" />
              <span>API &amp; Exports</span>
              {userRole === 'CASHIER' && (
                <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                  🔒 Owner
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* OFFLINE-FIRST SYNCHRONIZATION STATUS BAR */}
      <OfflineSyncBar
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulateOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
        pendingSyncCount={pendingSyncCount}
        onManualSync={handleBackgroundSync}
        lastSyncedAt={lastSyncedAt}
      />

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'POS' && (
          currentCustomer ? (
            <PosRegister
              products={products}
              currentCustomer={currentCustomer}
              onChangeCustomer={() => setShowCustomerCapture(true)}
              onCompleteSale={handleCompleteSale}
              posSettings={posSettings}
              onUpdatePosSettings={handleUpdatePosSettings}
              customers={customers}
              invoices={invoices}
              onUpdateCustomer={handleUpdateCustomer}
              onSelectCustomer={(cust, initialDue, initialAdv) => {
                setCurrentCustomer(cust);
                setActiveCustomerInitialDue(initialDue || 0);
                setActiveCustomerInitialAdvance(initialAdv || 0);
              }}
              initialDueToAdd={activeCustomerInitialDue}
              initialAdvanceToAdjust={activeCustomerInitialAdvance}
              userRole={userRole}
              onOpenPasscodeSettings={handleOpenPasscodeSettings}
              onRequestElevateRole={() => {
                setPendingElevatedAction({
                  title: 'Switch to Owner Mode',
                  description: 'Enter Owner Passcode to unlock full system customization, editing, and management:',
                  onSuccess: () => {}
                });
              }}
            />
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center shadow-xs border border-slate-200">
              <Phone className="h-12 w-12 text-amber-700 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">
                Customer Mobile Required To Start Billing
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Please enter the customer mobile number to check 7-day credit status, apply wholesale/retail pricing, and record loyalty.
              </p>
              <button
                onClick={() => setShowCustomerCapture(true)}
                className="mt-4 rounded-xl bg-amber-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-800 shadow-xs"
              >
                Enter Customer Mobile
              </button>
            </div>
          )
        )}

        {activeTab === 'INVENTORY' && (
          <InventoryManager
            products={products}
            onAddBatch={handleAddBatch}
            onUpdateBatch={handleUpdateBatch}
            onDeleteBatch={handleDeleteBatch}
            onUpdateProduct={handleUpdateProduct}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'CASHBOOK' && (
          <CashBookManager
            transactions={cashTransactions}
            customers={customers}
            onAddTransaction={handleAddCashTransaction}
            onUpdateTransaction={handleUpdateCashTransaction}
            onDeleteTransaction={handleDeleteCashTransaction}
            onCustomerRepayment={handleCustomerRepayment}
          />
        )}

        {activeTab === 'LOYALTY' && (
          <LoyaltyRewardsView
            customers={customers}
            onUpdateCustomer={handleUpdateCustomer}
            onAddNewCustomer={handleAddNewCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectCustomerForBill={c => {
              setCurrentCustomer(c);
              setActiveTab('POS');
            }}
            onGrantBonusPoints={handleGrantBonusPoints}
          />
        )}

        {activeTab === 'WHOLESALE_APP' && (
          <WholesaleCompanionApp
            customers={customers}
            products={products}
            wholesaleOrders={wholesaleOrders}
            fieldPayments={fieldPayments}
            onSaveOrder={handleSaveWholesaleOrder}
            onUpdateWholesaleOrder={handleUpdateWholesaleOrder}
            onDeleteWholesaleOrder={handleDeleteWholesaleOrder}
            onDeleteFieldPayment={handleDeleteFieldPayment}
            onRecordPayment={handleRecordFieldPaymentReceipt}
            onSyncAll={handleBackgroundSync}
            isOnline={isOnline && !isSimulatedOffline}
            lastSyncedAt={lastSyncedAt}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <AnalyticsReports
            invoices={invoices}
            products={products}
            customers={customers}
            onUpdateInvoice={handleUpdateInvoice}
            onCancelInvoice={handleCancelInvoice}
            onViewReceipt={inv => setActiveReceipt(inv)}
          />
        )}

        {activeTab === 'SUPPLIERS' && (
          <SupplierManager
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            products={products}
            onCreatePO={handleCreatePO}
            onReceivePO={handleReceivePO}
            onRecordSupplierPayment={handleRecordSupplierPayment}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onUpdatePO={handleUpdatePO}
            onDeletePO={handleDeletePO}
          />
        )}

        {activeTab === 'EXPORT' && (
          <DataExportHub
            products={products}
            customers={customers}
            invoices={invoices}
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            cashTransactions={cashTransactions}
            wholesaleOrders={wholesaleOrders}
            onOpenGoogleSheetsModal={() => setShowGoogleSheetsModal(true)}
          />
        )}
      </main>

      {/* Google Sheets Sync & Management Modal */}
      <GoogleSheetsModal
        isOpen={showGoogleSheetsModal}
        onClose={() => setShowGoogleSheetsModal(false)}
        products={products}
        customers={customers}
        invoices={invoices}
        suppliers={suppliers}
        purchaseOrders={purchaseOrders}
        cashTransactions={cashTransactions}
        wholesaleOrders={wholesaleOrders}
      />
    </div>
  );
}
