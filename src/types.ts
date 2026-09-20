export type ProductCategory = 'Atta' | 'Besan' | 'Sattu' | 'Masale';

export interface FifoBatch {
  batchId: string;
  mfgDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  inwardQty: number;
  availableQty: number;
  unitCost: number; // Cost price of production/procurement
  supplierName?: string;
  poId?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string; // Barcode (e.g. EAN-13, Code 128) for scanner lookup
  name: string;
  hindiName: string;
  category: ProductCategory;
  subcategory?: string;
  packSize: string; // e.g. "500g", "1kg", "5kg", "10kg", "25kg", "50kg", "Loose/kg"
  unit: 'kg' | 'packet' | 'bag';
  retailPrice: number; // B2C price
  wholesalePrice: number; // B2B price
  minStockThreshold: number;
  gstRate: number; // 0 for unbranded/loose or 5 for packaged
  hsnCode: string;
  batches: FifoBatch[];
  totalStock: number;
}

export type LoyaltyTier = 'Silver' | 'Gold' | 'Platinum';

export interface LoyaltyLog {
  id: string;
  date: string;
  type: 'EARNED' | 'REDEEMED' | 'TIER_UPGRADE' | 'BONUS' | 'ADJUSTED';
  points: number;
  description: string;
  invoiceId?: string;
  balanceAfter: number;
}

export interface Customer {
  id: string;
  mobileNumber: string;
  name: string;
  type: 'B2C' | 'B2B';
  businessName?: string;
  gstNumber?: string;
  address?: string;
  creditLimit: number; // e.g. 50000 for B2B
  outstandingCredit: number; // Previous bill due / credit amount
  advanceBalance?: number; // Advance payments / credit deposit
  creditDaysAllowed?: number; // e.g. 7, 15, 30 days
  creditStatus?: 'ACTIVE' | 'BLOCKED' | 'ON_HOLD';
  creditNotes?: string;
  totalPurchases: number;
  orderCount: number;
  createdAt: string;
  notes?: string;
  // Loyalty Program fields
  loyaltyPoints: number; // Current redeemable points
  lifetimePoints: number; // Cumulative earned points
  loyaltyTier: LoyaltyTier; // Silver (<500), Gold (500-1500), Platinum (>1500)
  loyaltyHistory?: LoyaltyLog[];
}

export interface FifoAllocation {
  batchId: string;
  qty: number;
  unitCost: number;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  hindiName: string;
  packSize: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  priceType: 'retail' | 'wholesale';
  gstRate: number;
  gstAmount: number;
  total: number;
  fifoAllocations: FifoAllocation[];
  discount: number;
}

export type UserRole = 'OWNER' | 'CASHIER';

export type PaymentMethod = 'Cash' | 'Online' | 'Credit-7-Days';
export type PaymentStatus = 'Paid' | 'Pending_Credit' | 'Partially_Paid';

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string; // ISO date string
  customerId: string;
  customerMobile: string;
  customerName: string;
  customerType: 'B2C' | 'B2B';
  customerBusinessName?: string;
  customerGst?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  creditDueDate?: string; // Strictly 7 days from sale date for B2B
  creditPaidAmount?: number;
  notes?: string;
  synced: boolean;
  // Loyalty Program on Invoice
  pointsEarned?: number;
  pointsRedeemed?: number;
  loyaltyDiscountAmount?: number;
  // Due & Advance Adjustments
  previousDueAdded?: number; // Previous bill due added to this current bill
  advanceAdjusted?: number; // Advance payment deducted from this current bill
  previousOutstandingBefore?: number;
  advanceBalanceBefore?: number;
}

export type CashTransactionType = 'CASH_IN' | 'CASH_OUT';
export type CashCategory = 
  | 'BILLING_CASH'
  | 'CREDIT_REPAYMENT'
  | 'OWNER_CAPITAL'
  | 'SUPPLIER_PAYMENT'
  | 'GRAIN_PURCHASE'
  | 'LABOR_WAGES'
  | 'ELECTRICITY_MILLING'
  | 'PACKAGING_MATERIAL'
  | 'TEA_EXPENSE'
  | 'MISC';

export interface CashTransaction {
  id: string;
  date: string; // ISO timestamp
  type: CashTransactionType;
  category: CashCategory;
  amount: number;
  description: string;
  refId?: string; // invoice or PO ID
  paymentMode?: string;
}

export interface CostHistoryPoint {
  item: string;
  date: string;
  pricePerUnit: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  mobile: string;
  category: 'Grain Farmer' | 'Chana Mandi Trader' | 'Spice Mandi Broker' | 'Packaging Pouch Mfr';
  address: string;
  pendingBalance: number;
  performanceRating: number; // 1 to 5
  costTrends: CostHistoryPoint[];
}

export interface PurchaseOrderItem {
  itemName: string;
  category: ProductCategory | 'Packaging' | 'Raw Grain';
  qty: number;
  unit: string;
  unitCost: number;
  total: number;
  batchNumberToAssign?: string;
  mfgDate?: string;
  expiryDate?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDelivery: string;
  status: 'Ordered' | 'Received' | 'Cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  paymentMethod: 'Cash' | 'Bank_Transfer' | 'Cheque';
  invoicesRef?: string;
  receivedAt?: string;
}

export interface InventoryAlert {
  id: string;
  type: 'LOW_STOCK' | 'EXPIRED' | 'NEAR_EXPIRY';
  productId: string;
  productName: string;
  hindiName: string;
  packSize: string;
  currentStock: number;
  threshold: number;
  batchId?: string;
  expiryDate?: string;
  daysLeft?: number;
}

export interface WholesaleOrderItem {
  productId: string;
  sku: string;
  barcode: string;
  name: string;
  hindiName: string;
  packSize: string;
  unit: string;
  quantity: number;
  wholesaleRate: number;
  total: number;
}

export interface WholesaleOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerBusinessName?: string;
  customerMobile: string;
  salesRepName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: WholesaleOrderItem[];
  subtotal: number;
  volumeDiscount: number;
  grandTotal: number;
  status: 'Pending_Approval' | 'Confirmed' | 'Dispatched' | 'Completed' | 'Cancelled';
  paymentTerms: 'Credit-7-Days' | 'Advance-UPI' | 'Cash-on-Delivery';
  notes?: string;
  synced: boolean;
}

export interface FieldPaymentReceipt {
  id: string;
  receiptNo: string;
  customerId: string;
  customerName: string;
  customerBusinessName?: string;
  customerMobile: string;
  amount: number;
  paymentMode: 'Cash' | 'Cheque' | 'UPI_QR';
  referenceNo?: string; // Cheque number or UPI Transaction ID
  collectedAt: string;
  salesRepName: string;
  notes?: string;
  synced: boolean;
}

export type FieldPayment = FieldPaymentReceipt;
export type LoyaltyHistoryEntry = LoyaltyLog;

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  userEmail?: string;
}

export interface GoogleSyncResult {
  success: boolean;
  message: string;
  spreadsheetUrl?: string;
  syncedSheets?: string[];
  recordsCount?: {
    invoices: number;
    products: number;
    customers: number;
    suppliers: number;
    cashTransactions: number;
    wholesaleOrders: number;
  };
}

export interface KeyboardShortcutsConfig {
  focusSearch: string;
  changeCustomer: string;
  manualDiscount: string;
  cycleCategories: string;
  holdCart: string;
  recallCart: string;
  clearCart: string;
  completeBill: string;
  printReceipt: string;
  openSettings: string;
  toggleHelp: string;
  lockScreen: string;
  payCash: string;
  payOnline: string;
  payCredit: string;
}

export interface StoreProfile {
  storeName: string;
  storeNameHindi: string;
  tagline: string;
  gstin: string;
  fssaiNumber: string;
  phone: string;
  address: string;
  receiptHeaderNote: string;
  receiptFooterNote: string;
  terms: string;
}

export interface PosSettings {
  storeProfile: StoreProfile;
  shortcuts: KeyboardShortcutsConfig;
  defaultPaymentMethod: PaymentMethod;
  enableSoundEffects: boolean;
  soundVolume: number;
  uiDensity: 'compact' | 'comfortable' | 'spacious';
  autoPrintReceipt: boolean;
  showHindiNames: boolean;
  autoFocusSearchAfterAdd: boolean;
  quickTenderPresets: number[];
  receiptPaperSize: '80mm' | '58mm' | 'A4';
  enableFastQuantityMultiplier: boolean;
}

export interface HeldCartItem {
  product: Product;
  quantity: number;
  priceType: 'retail' | 'wholesale';
  discount: number;
}

export interface HeldCart {
  id: string;
  heldAt: string;
  customer: Customer;
  items: HeldCartItem[];
  discountTotal: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  estimatedTotal: number;
  previousDueAdded?: number;
  advanceAdjusted?: number;
}


