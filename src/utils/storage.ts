import { 
  Product, 
  Customer, 
  Invoice, 
  Supplier, 
  PurchaseOrder, 
  CashTransaction, 
  InventoryAlert,
  WholesaleOrder,
  FieldPaymentReceipt
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_INVOICES, 
  INITIAL_SUPPLIERS, 
  INITIAL_PURCHASE_ORDERS, 
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_WHOLESALE_ORDERS,
  INITIAL_FIELD_PAYMENTS
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'annapurna_pos_products',
  CUSTOMERS: 'annapurna_pos_customers',
  INVOICES: 'annapurna_pos_invoices',
  SUPPLIERS: 'annapurna_pos_suppliers',
  POS: 'annapurna_pos_purchase_orders',
  CASH: 'annapurna_pos_cash_transactions',
  WHOLESALE_ORDERS: 'annapurna_pos_wholesale_orders',
  FIELD_PAYMENTS: 'annapurna_pos_field_payments',
  PASSCODE: 'annapurna_pos_passcode',
  OWNER_PASSCODE: 'annapurna_pos_owner_passcode',
  CASHIER_PASSCODE: 'annapurna_pos_cashier_passcode',
  OFFLINE_QUEUE: 'annapurna_pos_offline_queue'
};

export const DEFAULT_PASSCODE = '1234';
export const DEFAULT_OWNER_PASSCODE = '9999';
export const DEFAULT_CASHIER_PASSCODE = '1234';

export function getOwnerPasscode(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.OWNER_PASSCODE) || DEFAULT_OWNER_PASSCODE;
  } catch {
    return DEFAULT_OWNER_PASSCODE;
  }
}

export function setOwnerPasscode(pin: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OWNER_PASSCODE, pin);
  } catch (e) {
    console.error('Failed to store owner passcode', e);
  }
}

export function getCashierPasscode(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.CASHIER_PASSCODE) || 
           localStorage.getItem(STORAGE_KEYS.PASSCODE) || 
           DEFAULT_CASHIER_PASSCODE;
  } catch {
    return DEFAULT_CASHIER_PASSCODE;
  }
}

export function setCashierPasscode(pin: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CASHIER_PASSCODE, pin);
    localStorage.setItem(STORAGE_KEYS.PASSCODE, pin);
  } catch (e) {
    console.error('Failed to store cashier passcode', e);
  }
}

export function getStoredPasscode(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.PASSCODE) || DEFAULT_PASSCODE;
  } catch {
    return DEFAULT_PASSCODE;
  }
}

export function setStoredPasscode(pin: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PASSCODE, pin);
    localStorage.setItem(STORAGE_KEYS.CASHIER_PASSCODE, pin);
  } catch (e) {
    console.error('Failed to store passcode', e);
  }
}

export function loadStoredData() {
  try {
    const productsStr = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const customersStr = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const invoicesStr = localStorage.getItem(STORAGE_KEYS.INVOICES);
    const suppliersStr = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    const posStr = localStorage.getItem(STORAGE_KEYS.POS);
    const cashStr = localStorage.getItem(STORAGE_KEYS.CASH);
    const wholesaleOrdersStr = localStorage.getItem(STORAGE_KEYS.WHOLESALE_ORDERS);
    const fieldPaymentsStr = localStorage.getItem(STORAGE_KEYS.FIELD_PAYMENTS);

    // Parse products and ensure barcode exists
    let products: Product[] = productsStr ? JSON.parse(productsStr) : INITIAL_PRODUCTS;
    products = products.map(p => {
      if (!p.barcode) {
        const seedMatch = INITIAL_PRODUCTS.find(s => s.id === p.id || s.sku === p.sku);
        return { ...p, barcode: seedMatch?.barcode || `890600${p.sku.replace(/\D/g, '').padStart(6, '0')}` };
      }
      return p;
    });

    // Parse customers and ensure loyalty fields exist
    let customers: Customer[] = customersStr ? JSON.parse(customersStr) : INITIAL_CUSTOMERS;
    customers = customers.map(c => {
      const seedMatch = INITIAL_CUSTOMERS.find(s => s.id === c.id || s.mobileNumber === c.mobileNumber);
      return {
        ...c,
        loyaltyPoints: c.loyaltyPoints ?? seedMatch?.loyaltyPoints ?? 50,
        lifetimePoints: c.lifetimePoints ?? seedMatch?.lifetimePoints ?? 50,
        loyaltyTier: c.loyaltyTier ?? seedMatch?.loyaltyTier ?? 'Silver',
        loyaltyHistory: c.loyaltyHistory ?? seedMatch?.loyaltyHistory ?? []
      };
    });

    const invoices: Invoice[] = invoicesStr ? JSON.parse(invoicesStr) : INITIAL_INVOICES;
    const suppliers: Supplier[] = suppliersStr ? JSON.parse(suppliersStr) : INITIAL_SUPPLIERS;
    const purchaseOrders: PurchaseOrder[] = posStr ? JSON.parse(posStr) : INITIAL_PURCHASE_ORDERS;
    const cashTransactions: CashTransaction[] = cashStr ? JSON.parse(cashStr) : INITIAL_CASH_TRANSACTIONS;
    const wholesaleOrders: WholesaleOrder[] = wholesaleOrdersStr ? JSON.parse(wholesaleOrdersStr) : INITIAL_WHOLESALE_ORDERS;
    const fieldPayments: FieldPaymentReceipt[] = fieldPaymentsStr ? JSON.parse(fieldPaymentsStr) : INITIAL_FIELD_PAYMENTS;

    return {
      products,
      customers,
      invoices,
      suppliers,
      purchaseOrders,
      cashTransactions,
      wholesaleOrders,
      fieldPayments
    };
  } catch (err) {
    console.warn('Using initial seed data due to storage read error', err);
    return {
      products: INITIAL_PRODUCTS,
      customers: INITIAL_CUSTOMERS,
      invoices: INITIAL_INVOICES,
      suppliers: INITIAL_SUPPLIERS,
      purchaseOrders: INITIAL_PURCHASE_ORDERS,
      cashTransactions: INITIAL_CASH_TRANSACTIONS,
      wholesaleOrders: INITIAL_WHOLESALE_ORDERS,
      fieldPayments: INITIAL_FIELD_PAYMENTS
    };
  }
}

export function saveAllData(data: {
  products?: Product[];
  customers?: Customer[];
  invoices?: Invoice[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  cashTransactions?: CashTransaction[];
  wholesaleOrders?: WholesaleOrder[];
  fieldPayments?: FieldPaymentReceipt[];
}) {
  try {
    if (data.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
    if (data.customers) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
    if (data.invoices) localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(data.invoices));
    if (data.suppliers) localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(data.suppliers));
    if (data.purchaseOrders) localStorage.setItem(STORAGE_KEYS.POS, JSON.stringify(data.purchaseOrders));
    if (data.cashTransactions) localStorage.setItem(STORAGE_KEYS.CASH, JSON.stringify(data.cashTransactions));
    if (data.wholesaleOrders) localStorage.setItem(STORAGE_KEYS.WHOLESALE_ORDERS, JSON.stringify(data.wholesaleOrders));
    if (data.fieldPayments) localStorage.setItem(STORAGE_KEYS.FIELD_PAYMENTS, JSON.stringify(data.fieldPayments));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export async function syncWithBackend(data: {
  sales?: Invoice[];
  inventory?: Product[];
  suppliers?: Supplier[];
  customers?: Customer[];
  cashBook?: CashTransaction[];
  wholesaleOrders?: WholesaleOrder[];
  fieldPayments?: FieldPaymentReceipt[];
}): Promise<{ success: boolean; message: string; timestamp?: string }> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const result = await res.json();
    return {
      success: true,
      message: result.message || 'Synced successfully',
      timestamp: result.syncedAt || new Date().toISOString()
    };
  } catch (error: any) {
    console.warn('Backend sync failed, maintaining offline data:', error.message);
    return {
      success: false,
      message: `Offline mode: Saved locally (${error.message || 'Network unreachable'})`
    };
  }
}

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadJSON(filename: string, obj: any) {
  const jsonStr = JSON.stringify(obj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Calculates Inventory Alerts: Low Stock & Expiring Batches
 */
export function calculateInventoryAlerts(products: Product[]): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];
  const now = new Date();

  products.forEach(p => {
    // Check total stock vs min threshold
    if (p.totalStock <= p.minStockThreshold) {
      alerts.push({
        id: `alert-low-${p.id}`,
        type: 'LOW_STOCK',
        productId: p.id,
        productName: p.name,
        hindiName: p.hindiName,
        packSize: p.packSize,
        currentStock: p.totalStock,
        threshold: p.minStockThreshold
      });
    }

    // Check individual batch expiries (within 45 days)
    p.batches.forEach(b => {
      if (b.availableQty > 0) {
        const expDate = new Date(b.expiryDate);
        const diffMs = expDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
          alerts.push({
            id: `alert-exp-${b.batchId}`,
            type: 'EXPIRED',
            productId: p.id,
            productName: p.name,
            hindiName: p.hindiName,
            packSize: p.packSize,
            currentStock: b.availableQty,
            threshold: 0,
            batchId: b.batchId,
            expiryDate: b.expiryDate,
            daysLeft: 0
          });
        } else if (daysLeft <= 45) {
          alerts.push({
            id: `alert-nearexp-${b.batchId}`,
            type: 'NEAR_EXPIRY',
            productId: p.id,
            productName: p.name,
            hindiName: p.hindiName,
            packSize: p.packSize,
            currentStock: b.availableQty,
            threshold: 0,
            batchId: b.batchId,
            expiryDate: b.expiryDate,
            daysLeft
          });
        }
      }
    });
  });

  return alerts;
}
