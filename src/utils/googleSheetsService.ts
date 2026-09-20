import { Product, Customer, Invoice, Supplier, PurchaseOrder, CashTransaction, WholesaleOrder, GoogleSheetConfig, GoogleSyncResult } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
            error_callback?: (err: any) => void;
          }): {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
    gapi_client_id?: string;
  }
}

const STORAGE_KEYS = {
  TOKEN: 'mamjista_gdrive_token',
  TOKEN_EXPIRY: 'mamjista_gdrive_token_expiry',
  CONFIG: 'mamjista_google_sheet_config',
  USER_EMAIL: 'mamjista_google_user_email'
};

const REQUIRED_SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

/**
 * Retrieve active token if not expired
 */
export function getStoredGoogleToken(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!token || !expiry) return null;
    if (Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function saveGoogleToken(token: string, expiresInSeconds: number = 3600) {
  try {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    const expiryTime = Date.now() + (expiresInSeconds - 60) * 1000;
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
  } catch (e) {
    console.error('Error saving Google token:', e);
  }
}

export function clearGoogleToken() {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  } catch (e) {
    console.error('Error clearing Google token:', e);
  }
}

export function getGoogleSheetConfig(): GoogleSheetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading Google Sheet config:', e);
  }
  return {
    spreadsheetId: '',
    spreadsheetUrl: '',
    spreadsheetTitle: 'Mamjista Food Products POS - Master Database',
    autoSync: true,
    lastSyncedAt: undefined,
    userEmail: 'mamjistafoodproducts@gmail.com'
  };
}

export function saveGoogleSheetConfig(config: GoogleSheetConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving Google Sheet config:', e);
  }
}

/**
 * Get Client ID injected by environment or localStorage fallback
 */
export function getGoogleClientId(): string {
  if (typeof window !== 'undefined' && window.gapi_client_id) {
    return window.gapi_client_id;
  }
  return localStorage.getItem('mamjista_custom_google_client_id') || '';
}

/**
 * Request OAuth Access Token using Google Identity Services (GIS)
 */
export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window object is not available'));
    }

    if (!window.google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services script is still loading or blocked. Please refresh the page and try again.'));
    }

    const clientId = getGoogleClientId();
    if (!clientId) {
      return reject(
        new Error(
          'Google OAuth Client ID is not initialized. Please ensure OAuth is configured or wait a moment for the environment to inject credentials.'
        )
      );
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: REQUIRED_SCOPES,
        callback: (resp) => {
          if (resp.error) {
            reject(new Error(`Google Authorization Failed: ${resp.error}`));
            return;
          }
          if (resp.access_token) {
            const expiresIn = resp.expires_in || 3600;
            saveGoogleToken(resp.access_token, expiresIn);
            resolve(resp.access_token);
          } else {
            reject(new Error('No access token returned from Google'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'Google OAuth prompt was cancelled or closed'));
        }
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      reject(new Error(`Failed to open Google Authorization: ${err.message}`));
    }
  });
}

/**
 * Create a new Master Google Spreadsheet formatted for Mamjista Food Products
 */
export async function createMasterSpreadsheet(token: string, title?: string): Promise<{ id: string; url: string }> {
  const sheetTitle = title || `Mamjista Food Products POS - Master Data (${new Date().toISOString().split('T')[0]})`;

  const sheetNames = [
    'Sales_Invoices',
    'Inventory_Stock',
    'Customers_Ledger',
    'Suppliers_PO',
    'Cash_DayBook',
    'Wholesale_Orders'
  ];

  const payload = {
    properties: {
      title: sheetTitle
    },
    sheets: sheetNames.map((name, index) => ({
      properties: {
        sheetId: index + 1,
        title: name,
        gridProperties: {
          frozenRowCount: 1
        }
      }
    }))
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Spreadsheet (HTTP ${res.status})`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { id: spreadsheetId, url: spreadsheetUrl };
}

/**
 * Ensures required sheets exist in an existing spreadsheet
 */
async function ensureSheetsExist(token: string, spreadsheetId: string, requiredSheets: string[]) {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!metaRes.ok) return;

  const meta = await metaRes.json();
  const existingTitles = new Set(meta.sheets?.map((s: any) => s.properties?.title) || []);

  const missingSheets = requiredSheets.filter(title => !existingTitles.has(title));
  if (missingSheets.length > 0) {
    const requests = missingSheets.map(title => ({
      addSheet: {
        properties: {
          title,
          gridProperties: { frozenRowCount: 1 }
        }
      }
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
  }
}

/**
 * Format and synchronize all POS data into Google Sheets in a single batch
 */
export async function syncAllDataToGoogleSheet(params: {
  token: string;
  spreadsheetId: string;
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  cashTransactions: CashTransaction[];
  wholesaleOrders: WholesaleOrder[];
}): Promise<GoogleSyncResult> {
  const {
    token,
    spreadsheetId,
    invoices,
    products,
    customers,
    suppliers,
    purchaseOrders,
    cashTransactions,
    wholesaleOrders
  } = params;

  if (!token) {
    throw new Error('Google authentication token missing. Please re-connect your Google Account.');
  }

  if (!spreadsheetId) {
    throw new Error('Google Spreadsheet ID is missing. Please create or select a spreadsheet first.');
  }

  // Ensure sheet tabs exist
  const sheetNames = [
    'Sales_Invoices',
    'Inventory_Stock',
    'Customers_Ledger',
    'Suppliers_PO',
    'Cash_DayBook',
    'Wholesale_Orders'
  ];
  await ensureSheetsExist(token, spreadsheetId, sheetNames);

  // 1. Sales Invoices Data
  const invoiceHeaders = [
    'Invoice No',
    'Date',
    'Time',
    'Customer Name',
    'Customer Mobile',
    'Customer Type',
    'Items Summary',
    'Total Items Qty',
    'Subtotal (₹)',
    'Discount (₹)',
    'Tax / GST (₹)',
    'Grand Total (₹)',
    'Payment Mode',
    'Status',
    'Credit Due Date',
    'Notes'
  ];
  const invoiceRows = invoices.map(inv => [
    inv.invoiceNo,
    inv.date.split('T')[0] || inv.date,
    inv.date.includes('T') ? new Date(inv.date).toLocaleTimeString() : '',
    inv.customerName,
    inv.customerMobile,
    inv.customerType,
    inv.items.map(i => `${i.name} (${i.packSize}) x${i.quantity}`).join('; '),
    inv.items.reduce((sum, it) => sum + it.quantity, 0),
    inv.subtotal,
    inv.discountAmount || 0,
    inv.taxAmount,
    inv.grandTotal,
    inv.paymentMethod,
    inv.paymentStatus,
    inv.creditDueDate || '',
    inv.notes || ''
  ]);

  // 2. Inventory & Stock Data
  const productHeaders = [
    'SKU',
    'Barcode',
    'Product Name (English)',
    'Product Name (Hindi)',
    'Category',
    'Subcategory',
    'Pack Size',
    'Unit',
    'Total Stock Units',
    'Min Stock Alert Level',
    'Stock Health Status',
    'Retail Price (₹)',
    'Wholesale Price (₹)',
    'GST Rate (%)',
    'HSN Code',
    'Active FIFO Batches Count',
    'Batches Breakdown (Batch No | Qty | Expiry | Cost)'
  ];
  const productRows = products.map(p => {
    const status = p.totalStock <= 0 ? 'OUT OF STOCK' : p.totalStock <= p.minStockThreshold ? 'LOW STOCK' : 'IN STOCK';
    const batchesSummary = (p.batches || [])
      .map(b => `${b.batchId} (Qty: ${b.availableQty}, Exp: ${b.expiryDate}, Cost: ₹${b.unitCost})`)
      .join(' | ');

    return [
      p.sku,
      p.barcode || '',
      p.name,
      p.hindiName,
      p.category,
      p.subcategory || '',
      p.packSize,
      p.unit,
      p.totalStock,
      p.minStockThreshold,
      status,
      p.retailPrice,
      p.wholesalePrice,
      p.gstRate,
      p.hsnCode,
      p.batches?.length || 0,
      batchesSummary
    ];
  });

  // 3. Customers Ledger Data
  const customerHeaders = [
    'Customer ID',
    'Customer Name',
    'Business / Shop Name',
    'Mobile Number',
    'Customer Type',
    'Loyalty Tier',
    'Loyalty Points Balance',
    '7-Day Credit Limit (₹)',
    'Outstanding Credit Balance (₹)',
    'Lifetime Purchases Total (₹)',
    'Total Orders Count',
    'GSTIN',
    'Address',
    'Created Date'
  ];
  const customerRows = customers.map(c => [
    c.id,
    c.name,
    c.businessName || '',
    c.mobileNumber,
    c.type,
    c.loyaltyTier,
    c.loyaltyPoints,
    c.creditLimit || 0,
    c.outstandingCredit || 0,
    c.totalPurchases || 0,
    c.orderCount || 0,
    c.gstNumber || '',
    c.address || '',
    c.createdAt || ''
  ]);

  // 4. Suppliers & Purchase Orders Data
  const supplierHeaders = [
    'Supplier ID',
    'Supplier / Farmer Name',
    'Contact Person',
    'Mobile / Phone',
    'Raw Material Category',
    'Pending Balance Due (₹)',
    'Quality / Performance Rating',
    'Address'
  ];
  const supplierRows = suppliers.map(s => [
    s.id,
    s.name,
    s.contactPerson || '',
    s.mobile || '',
    s.category,
    s.pendingBalance || 0,
    s.performanceRating ? `${s.performanceRating} / 5` : 'N/A',
    s.address || ''
  ]);

  // Append POs below suppliers with a sub-header
  const poHeaders = [
    'PO Number',
    'Supplier Name',
    'Order Date',
    'Expected Delivery',
    'PO Status',
    'Items Summary',
    'Total Amount (₹)',
    'Paid Amount (₹)',
    'Balance Due (₹)',
    'Payment Status'
  ];
  const poRows = purchaseOrders.map(po => [
    po.poNumber,
    po.supplierName,
    po.date,
    po.expectedDelivery || '',
    po.status,
    po.items?.map(it => `${it.itemName} (${it.qty} ${it.unit})`).join('; ') || '',
    po.totalAmount,
    po.paidAmount,
    po.totalAmount - po.paidAmount,
    po.paymentStatus
  ]);

  const supplierSheetData = [
    supplierHeaders,
    ...supplierRows,
    [],
    ['--- PURCHASE ORDERS (RAW MATERIALS PROCURED) ---'],
    poHeaders,
    ...poRows
  ];

  // 5. Cash Book / Day Book Data (गल्ला मिलान)
  const cashHeaders = [
    'Date & Time',
    'Transaction ID',
    'Cash Flow Type',
    'Category',
    'Amount (₹)',
    'Description',
    'Reference ID'
  ];
  const cashRows = cashTransactions.map(tx => [
    tx.date.replace('T', ' ').slice(0, 19),
    tx.id,
    tx.type,
    tx.category,
    tx.amount,
    tx.description,
    tx.refId || ''
  ]);

  // 6. Wholesale Orders Data
  const wholesaleHeaders = [
    'Order Number',
    'Order Date',
    'Customer Name',
    'Business Name',
    'Mobile',
    'Sales Rep Name',
    'Items Summary',
    'Subtotal (₹)',
    'Discount (₹)',
    'Grand Total (₹)',
    'Order Status',
    'Payment Terms',
    'Expected Delivery',
    'Notes'
  ];
  const wholesaleRows = wholesaleOrders.map(wo => [
    wo.orderNumber,
    wo.orderDate,
    wo.customerName,
    wo.customerBusinessName || '',
    wo.customerMobile,
    wo.salesRepName,
    wo.items.map(it => `${it.name} (${it.packSize}) x${it.quantity} @₹${it.wholesaleRate}`).join('; '),
    wo.subtotal,
    wo.volumeDiscount,
    wo.grandTotal,
    wo.status,
    wo.paymentTerms,
    wo.expectedDeliveryDate,
    wo.notes || ''
  ]);

  // Prepare batchUpdate request
  const batchData = [
    {
      range: "'Sales_Invoices'!A1",
      values: [invoiceHeaders, ...invoiceRows]
    },
    {
      range: "'Inventory_Stock'!A1",
      values: [productHeaders, ...productRows]
    },
    {
      range: "'Customers_Ledger'!A1",
      values: [customerHeaders, ...customerRows]
    },
    {
      range: "'Suppliers_PO'!A1",
      values: supplierSheetData
    },
    {
      range: "'Cash_DayBook'!A1",
      values: [cashHeaders, ...cashRows]
    },
    {
      range: "'Wholesale_Orders'!A1",
      values: [wholesaleHeaders, ...wholesaleRows]
    }
  ];

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearGoogleToken();
      throw new Error('Google authorization has expired. Please click "Connect Google Sheets" to sign in again.');
    }
    throw new Error(err.error?.message || `Failed to update Google Spreadsheet (HTTP ${res.status})`);
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    success: true,
    message: 'All POS data synchronized successfully to Google Sheets!',
    spreadsheetUrl,
    syncedSheets: sheetNames,
    recordsCount: {
      invoices: invoices.length,
      products: products.length,
      customers: customers.length,
      suppliers: suppliers.length,
      cashTransactions: cashTransactions.length,
      wholesaleOrders: wholesaleOrders.length
    }
  };
}

/**
 * Append single invoice to Google Sheets in real-time when a sale is completed
 */
export async function appendInvoiceToGoogleSheet(token: string, spreadsheetId: string, invoice: Invoice): Promise<boolean> {
  if (!token || !spreadsheetId) return false;

  const invoiceRow = [
    invoice.invoiceNo,
    invoice.date.split('T')[0] || invoice.date,
    invoice.date.includes('T') ? new Date(invoice.date).toLocaleTimeString() : '',
    invoice.customerName,
    invoice.customerMobile,
    invoice.customerType,
    invoice.items.map(i => `${i.name} (${i.packSize}) x${i.quantity}`).join('; '),
    invoice.items.reduce((sum, it) => sum + it.quantity, 0),
    invoice.subtotal,
    invoice.discountAmount || 0,
    invoice.taxAmount,
    invoice.grandTotal,
    invoice.paymentMethod,
    invoice.paymentStatus,
    invoice.creditDueDate || '',
    invoice.notes || ''
  ];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Sales_Invoices'!A:P:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [invoiceRow]
        })
      }
    );

    return res.ok;
  } catch (e) {
    console.warn('Real-time Google Sheet append failed:', e);
    return false;
  }
}
