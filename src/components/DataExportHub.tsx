import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Database, 
  Code, 
  Share2, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Table,
  RefreshCw,
  Zap,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { Product, Customer, Invoice, Supplier, PurchaseOrder, CashTransaction, WholesaleOrder, GoogleSyncResult } from '../types';
import { downloadCSV, downloadJSON } from '../utils/storage';
import { 
  getStoredGoogleToken, 
  getGoogleSheetConfig, 
  requestGoogleAccessToken, 
  syncAllDataToGoogleSheet, 
  createMasterSpreadsheet, 
  saveGoogleSheetConfig 
} from '../utils/googleSheetsService';

interface DataExportHubProps {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  suppliers: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  cashTransactions: CashTransaction[];
  wholesaleOrders?: WholesaleOrder[];
  onOpenGoogleSheetsModal?: () => void;
}

export const DataExportHub: React.FC<DataExportHubProps> = ({
  products,
  customers,
  invoices,
  suppliers,
  purchaseOrders = [],
  cashTransactions,
  wholesaleOrders = [],
  onOpenGoogleSheetsModal
}) => {
  const [googleToken, setGoogleToken] = useState<string | null>(getStoredGoogleToken());
  const [googleConfig, setGoogleConfig] = useState(getGoogleSheetConfig());
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    setGoogleToken(getStoredGoogleToken());
    setGoogleConfig(getGoogleSheetConfig());
  }, []);

  const handleQuickSyncToSheets = async () => {
    setIsQuickSyncing(true);
    setSyncFeedback(null);

    let token = googleToken || getStoredGoogleToken();
    if (!token) {
      try {
        token = await requestGoogleAccessToken();
        setGoogleToken(token);
      } catch (err: any) {
        setSyncFeedback(`Google Auth Required: ${err.message}`);
        setIsQuickSyncing(false);
        if (onOpenGoogleSheetsModal) onOpenGoogleSheetsModal();
        return;
      }
    }

    let sheetId = googleConfig.spreadsheetId;
    if (!sheetId) {
      try {
        const created = await createMasterSpreadsheet(
          token,
          'Mamjista Food Products POS - Master Database'
        );
        sheetId = created.id;
        const updatedConfig = {
          ...googleConfig,
          spreadsheetId: created.id,
          spreadsheetUrl: created.url
        };
        setGoogleConfig(updatedConfig);
        saveGoogleSheetConfig(updatedConfig);
      } catch (e: any) {
        setSyncFeedback(`Could not create sheet: ${e.message}`);
        setIsQuickSyncing(false);
        return;
      }
    }

    try {
      const res = await syncAllDataToGoogleSheet({
        token,
        spreadsheetId: sheetId,
        invoices,
        products,
        customers,
        suppliers,
        purchaseOrders,
        cashTransactions,
        wholesaleOrders
      });

      const updated = {
        ...googleConfig,
        spreadsheetId: sheetId,
        lastSyncedAt: new Date().toISOString()
      };
      setGoogleConfig(updated);
      saveGoogleSheetConfig(updated);
      setSyncFeedback(`Successfully synced all 6 sheets to Google Drive! (${invoices.length} bills, ${products.length} products)`);
    } catch (e: any) {
      setSyncFeedback(`Sync failed: ${e.message}`);
    } finally {
      setIsQuickSyncing(false);
    }
  };
  // Direct client CSV exports
  const exportSalesCSV = () => {
    const rows = [
      ['InvoiceNo', 'Date', 'CustomerName', 'Mobile', 'CustomerType', 'Subtotal', 'Tax', 'GrandTotal', 'PaymentMode', 'PaymentStatus', 'CreditDueDate', 'ItemCount'],
      ...invoices.map(inv => [
        inv.invoiceNo,
        inv.date,
        `"${inv.customerName}"`,
        inv.customerMobile,
        inv.customerType,
        inv.subtotal,
        inv.taxAmount,
        inv.grandTotal,
        inv.paymentMethod,
        inv.paymentStatus,
        inv.creditDueDate || 'N/A',
        inv.items.length
      ])
    ];
    downloadCSV(`annapurna_sales_export_${new Date().toISOString().split('T')[0]}.csv`, rows.map(r => r.join(',')).join('\n'));
  };

  const exportInventoryFIFO_CSV = () => {
    const rows: string[][] = [
      ['SKU', 'ProductName', 'Category', 'PackSize', 'BatchID', 'MfgDate', 'ExpiryDate', 'UnitCostPrice', 'RetailPrice', 'WholesalePrice', 'AvailableQty', 'InwardQty']
    ];

    products.forEach(p => {
      if (p.batches.length > 0) {
        p.batches.forEach(b => {
          rows.push([
            p.sku,
            `"${p.name}"`,
            p.category,
            p.packSize,
            b.batchId,
            b.mfgDate,
            b.expiryDate,
            b.unitCost.toString(),
            p.retailPrice.toString(),
            p.wholesalePrice.toString(),
            b.availableQty.toString(),
            b.inwardQty.toString()
          ]);
        });
      } else {
        rows.push([
          p.sku,
          `"${p.name}"`,
          p.category,
          p.packSize,
          'NO_BATCH',
          'N/A',
          'N/A',
          '0',
          p.retailPrice.toString(),
          p.wholesalePrice.toString(),
          p.totalStock.toString(),
          p.totalStock.toString()
        ]);
      }
    });

    downloadCSV(`annapurna_fifo_batches_${new Date().toISOString().split('T')[0]}.csv`, rows.map(r => r.join(',')).join('\n'));
  };

  const exportCustomersMarketingCSV = () => {
    const rows = [
      ['CustomerID', 'MobileNumber', 'CustomerName', 'Type', 'FirmName', 'GSTIN', 'TotalSpend', 'OrderCount', 'OutstandingCredit', 'RegisteredDate'],
      ...customers.map(c => [
        c.id,
        c.mobileNumber,
        `"${c.name}"`,
        c.type,
        `"${c.businessName || 'N/A'}"`,
        c.gstNumber || 'N/A',
        c.totalPurchases.toString(),
        c.orderCount.toString(),
        c.outstandingCredit.toString(),
        c.createdAt
      ])
    ];
    downloadCSV(`annapurna_customer_marketing_db_${new Date().toISOString().split('T')[0]}.csv`, rows.map(r => r.join(',')).join('\n'));
  };

  const exportDayBookCSV = () => {
    const rows = [
      ['TransactionID', 'DateTime', 'Type', 'Category', 'Amount', 'Description'],
      ...cashTransactions.map(tx => [
        tx.id,
        tx.date,
        tx.type,
        tx.category,
        tx.amount.toString(),
        `"${tx.description}"`
      ])
    ];
    downloadCSV(`annapurna_cash_daybook_${new Date().toISOString().split('T')[0]}.csv`, rows.map(r => r.join(',')).join('\n'));
  };

  const exportFullBackupJSON = () => {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shop: 'Annapurna Flour Mills & Spices',
      products,
      customers,
      invoices,
      suppliers,
      cashTransactions
    };
    downloadJSON(`annapurna_full_backup_${new Date().toISOString().split('T')[0]}.json`, fullBackup);
  };

  return (
    <div id="data-export-hub" className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Data Export Hub &amp; Google Sheets Cloud Sync (डेटा निर्यात एवं गूगल शीट सिंक)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Sync live POS data to Google Sheets, download CSV reports, or integrate via REST endpoints for Tally and ERP.
        </p>
      </div>

      {/* Primary: Google Sheets Live Cloud Integration Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 text-white p-6 shadow-xl border border-emerald-800/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 pointer-events-none">
          <FileSpreadsheet className="w-80 h-80 text-emerald-300" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-inner">
                <FileSpreadsheet className="h-6 w-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Google Sheets Master Database (गूगल शीट लाइव डेटाबेस)
                  </h3>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                    {googleToken ? 'Connected' : 'OAuth Ready'}
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80">
                  Direct Google Drive &amp; Sheets synchronization for Invoices, Stock, Customer Khata, Suppliers, and Cash Day Book.
                </p>
              </div>
            </div>

            {syncFeedback && (
              <div className="rounded-xl bg-emerald-800/60 border border-emerald-600/60 p-3 text-xs text-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {googleConfig.spreadsheetId ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-emerald-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">Sheet:</span>
                  <span className="font-mono text-emerald-300 truncate max-w-[240px]">
                    {googleConfig.spreadsheetTitle || 'Mamjista Food Products POS'}
                  </span>
                </div>
                {googleConfig.lastSyncedAt && (
                  <div className="text-[11px] text-emerald-300/80">
                    Last Saved: {new Date(googleConfig.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(googleConfig.lastSyncedAt).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span>Real-time Auto-save: {googleConfig.autoSync ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-300/90 font-medium">
                No spreadsheet connected yet. Click below to create your master Google Spreadsheet with 6 pre-formatted worksheets.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {googleConfig.spreadsheetUrl && (
              <a
                href={googleConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-800/60 px-4 py-2.5 text-xs font-bold text-emerald-100 hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <ExternalLink className="h-4 w-4 text-emerald-300" />
                <span>Open in Google Sheets</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleQuickSyncToSheets}
              disabled={isQuickSyncing}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
            >
              <RefreshCw className={`h-4 w-4 ${isQuickSyncing ? 'animate-spin' : ''}`} />
              <span>{isQuickSyncing ? 'Syncing to Google Sheets...' : 'Sync All Data to Google Sheet'}</span>
            </button>

            {onOpenGoogleSheetsModal && (
              <button
                type="button"
                onClick={onOpenGoogleSheetsModal}
                className="rounded-xl border border-emerald-700 bg-emerald-900/60 hover:bg-emerald-800 px-3.5 py-2.5 text-xs font-semibold text-emerald-200 transition-colors"
                title="Configure Google Sheets tabs, auto-sync and spreadsheet ID"
              >
                Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* One-Click CSV Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Invoices */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {invoices.length} Bills
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-3">Sales Invoices &amp; Taxes</h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete invoice log with customer details, GST, and 7-day credit due dates.
            </p>
          </div>

          <button
            type="button"
            onClick={exportSalesCSV}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-700 py-2.5 px-3 text-xs font-bold text-white hover:bg-amber-800 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Sales CSV</span>
          </button>
        </div>

        {/* FIFO Inventory */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Table className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {products.length} SKUs
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-3">FIFO Batch Stock Ledger</h3>
            <p className="text-xs text-slate-500 mt-1">
              Detailed inventory batch list with manufacturing dates, expiry dates, and unit cost.
            </p>
          </div>

          <button
            type="button"
            onClick={exportInventoryFIFO_CSV}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-700 py-2.5 px-3 text-xs font-bold text-white hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download FIFO CSV</span>
          </button>
        </div>

        {/* Customer Directory */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {customers.length} Contacts
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-3">Customer Marketing Database</h3>
            <p className="text-xs text-slate-500 mt-1">
              Collected customer mobile numbers, B2B wholesale firms, and purchase history.
            </p>
          </div>

          <button
            type="button"
            onClick={exportCustomersMarketingCSV}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 px-3 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Contacts CSV</span>
          </button>
        </div>

        {/* Day Book Cash */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                <Database className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {cashTransactions.length} Entries
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-3">Day Book &amp; Cash In/Out</h3>
            <p className="text-xs text-slate-500 mt-1">
              Cash billing, credit repayments, labor wages, electricity, and mill expenses.
            </p>
          </div>

          <button
            type="button"
            onClick={exportDayBookCSV}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-purple-700 py-2.5 px-3 text-xs font-bold text-white hover:bg-purple-800 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Cash Book CSV</span>
          </button>
        </div>
      </div>

      {/* Backup & REST API Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full Backup */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-800" />
              <h3 className="font-bold text-slate-900 text-sm">
                Full Database Snapshot / Backup (संपूर्ण बैकअप)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">JSON Archive</span>
          </div>

          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            Exports the complete relational database state: all product stock, FIFO batches, customer profiles, credit ledgers, supplier purchase orders, and daily cash transactions.
          </p>

          <button
            type="button"
            onClick={exportFullBackupJSON}
            className="mt-4 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Full JSON Backup</span>
          </button>
        </div>

        {/* REST API Endpoints */}
        <div className="rounded-2xl bg-slate-900 text-slate-200 p-5 shadow-xs font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-white">Live Backend REST API Endpoints</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              ACTIVE ON PORT 3000
            </span>
          </div>

          <div className="mt-3 space-y-2 text-[11px]">
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
              <span className="text-emerald-400 font-bold">GET</span> /api/export/sales?format=csv
              <p className="text-[10px] text-slate-400 mt-0.5">Stream direct CSV of sales invoices</p>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
              <span className="text-emerald-400 font-bold">GET</span> /api/export/inventory?format=csv
              <p className="text-[10px] text-slate-400 mt-0.5">FIFO batch allocations and stock report</p>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
              <span className="text-emerald-400 font-bold">GET</span> /api/reports/summary
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time revenue, credit dues, and count summaries</p>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
              <span className="text-blue-400 font-bold">POST</span> /api/sync
              <p className="text-[10px] text-slate-400 mt-0.5">Offline-first batch synchronizer payload</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
