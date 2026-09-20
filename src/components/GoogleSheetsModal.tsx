import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  X, 
  Database, 
  ShieldCheck, 
  Plus, 
  Zap, 
  Settings2,
  TableProperties
} from 'lucide-react';
import { 
  Product, 
  Customer, 
  Invoice, 
  Supplier, 
  PurchaseOrder, 
  CashTransaction, 
  WholesaleOrder, 
  GoogleSheetConfig, 
  GoogleSyncResult 
} from '../types';
import { 
  getStoredGoogleToken, 
  requestGoogleAccessToken, 
  clearGoogleToken,
  getGoogleSheetConfig, 
  saveGoogleSheetConfig, 
  createMasterSpreadsheet, 
  syncAllDataToGoogleSheet 
} from '../utils/googleSheetsService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  cashTransactions: CashTransaction[];
  wholesaleOrders: WholesaleOrder[];
  onSyncComplete?: (result: GoogleSyncResult) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  invoices,
  suppliers,
  purchaseOrders,
  cashTransactions,
  wholesaleOrders,
  onSyncComplete
}) => {
  const [config, setConfig] = useState<GoogleSheetConfig>(getGoogleSheetConfig());
  const [token, setToken] = useState<string | null>(getStoredGoogleToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<GoogleSyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const activeToken = getStoredGoogleToken();
      setToken(activeToken);
      const activeConfig = getGoogleSheetConfig();
      setConfig(activeConfig);
      setCustomSpreadsheetId(activeConfig.spreadsheetId || '');
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Authorize with Google
  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const accessToken = await requestGoogleAccessToken();
      setToken(accessToken);

      // If no spreadsheet exists yet, automatically create one
      if (!config.spreadsheetId) {
        const newSheet = await createMasterSpreadsheet(
          accessToken,
          `Mamjista Food Products POS - Live Master Database`
        );
        const updatedConfig: GoogleSheetConfig = {
          ...config,
          spreadsheetId: newSheet.id,
          spreadsheetUrl: newSheet.url,
          spreadsheetTitle: 'Mamjista Food Products POS - Master Database'
        };
        setConfig(updatedConfig);
        saveGoogleSheetConfig(updatedConfig);
        setCustomSpreadsheetId(newSheet.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authorize with Google Account');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 2. Disconnect Google Account
  const handleDisconnect = () => {
    clearGoogleToken();
    setToken(null);
    setSyncStatus(null);
  };

  // 3. Create Brand New Spreadsheet
  const handleCreateNewSheet = async () => {
    if (!token) {
      await handleConnectGoogle();
      return;
    }
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const newSheet = await createMasterSpreadsheet(
        token,
        `Mamjista Food Products POS - Database (${dateStr})`
      );
      const updatedConfig: GoogleSheetConfig = {
        ...config,
        spreadsheetId: newSheet.id,
        spreadsheetUrl: newSheet.url,
        spreadsheetTitle: `Mamjista Food Products POS - Database (${dateStr})`
      };
      setConfig(updatedConfig);
      saveGoogleSheetConfig(updatedConfig);
      setCustomSpreadsheetId(newSheet.id);

      // Now sync initial data
      const result = await syncAllDataToGoogleSheet({
        token,
        spreadsheetId: newSheet.id,
        invoices,
        products,
        customers,
        suppliers,
        purchaseOrders,
        cashTransactions,
        wholesaleOrders
      });

      const finalConfig = {
        ...updatedConfig,
        lastSyncedAt: new Date().toISOString()
      };
      setConfig(finalConfig);
      saveGoogleSheetConfig(finalConfig);
      setSyncStatus(result);
      if (onSyncComplete) onSyncComplete(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create new spreadsheet');
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Save Custom Spreadsheet ID
  const handleSaveCustomId = () => {
    const trimmed = customSpreadsheetId.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a valid Google Spreadsheet ID or URL');
      return;
    }

    let extractedId = trimmed;
    // Extract ID if full Google Sheets URL pasted
    if (trimmed.includes('/spreadsheets/d/')) {
      const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        extractedId = match[1];
      }
    }

    const updatedConfig: GoogleSheetConfig = {
      ...config,
      spreadsheetId: extractedId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${extractedId}/edit`
    };
    setConfig(updatedConfig);
    saveGoogleSheetConfig(updatedConfig);
    setCustomSpreadsheetId(extractedId);
    setErrorMessage(null);
  };

  // 5. Toggle Auto-Sync
  const handleToggleAutoSync = () => {
    const updated = {
      ...config,
      autoSync: !config.autoSync
    };
    setConfig(updated);
    saveGoogleSheetConfig(updated);
  };

  // 6. Perform Full Sync Now
  const handleSyncNow = async () => {
    setErrorMessage(null);
    setSyncStatus(null);

    let activeToken = token;
    if (!activeToken) {
      try {
        activeToken = await requestGoogleAccessToken();
        setToken(activeToken);
      } catch (err: any) {
        setErrorMessage(err.message || 'Please connect your Google Account first');
        return;
      }
    }

    let targetSpreadsheetId = config.spreadsheetId;
    if (!targetSpreadsheetId) {
      try {
        const newSheet = await createMasterSpreadsheet(
          activeToken,
          'Mamjista Food Products POS - Live Master Database'
        );
        targetSpreadsheetId = newSheet.id;
        const updatedConfig: GoogleSheetConfig = {
          ...config,
          spreadsheetId: newSheet.id,
          spreadsheetUrl: newSheet.url
        };
        setConfig(updatedConfig);
        saveGoogleSheetConfig(updatedConfig);
      } catch (err: any) {
        setErrorMessage(`Failed to create spreadsheet: ${err.message}`);
        return;
      }
    }

    setIsSyncing(true);
    try {
      const result = await syncAllDataToGoogleSheet({
        token: activeToken,
        spreadsheetId: targetSpreadsheetId,
        invoices,
        products,
        customers,
        suppliers,
        purchaseOrders,
        cashTransactions,
        wholesaleOrders
      });

      const updatedConfig = {
        ...config,
        spreadsheetId: targetSpreadsheetId,
        lastSyncedAt: new Date().toISOString()
      };
      setConfig(updatedConfig);
      saveGoogleSheetConfig(updatedConfig);
      setSyncStatus(result);
      if (onSyncComplete) onSyncComplete(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error syncing data to Google Sheet');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="google-sheets-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        id="google-sheets-modal-card"
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700/80 text-emerald-100 border border-emerald-600 shadow-inner">
              <FileSpreadsheet className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Google Sheets Live Cloud Backup
                </h2>
                <span className="rounded-md bg-emerald-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-700">
                  Cloud Sync
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Save sales bills, FIFO batches, customer credit, and cashbook into Google Sheets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-emerald-200 hover:bg-emerald-800/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Status Alert Banner */}
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {syncStatus && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
              <div className="flex-1 space-y-1">
                <p className="font-bold text-emerald-900">{syncStatus.message}</p>
                {syncStatus.recordsCount && (
                  <p className="text-[11px] text-emerald-700">
                    Updated: {syncStatus.recordsCount.invoices} Invoices, {syncStatus.recordsCount.products} Products, {syncStatus.recordsCount.customers} Customers, {syncStatus.recordsCount.suppliers} Suppliers, {syncStatus.recordsCount.cashTransactions} Cash Entries.
                  </p>
                )}
                {syncStatus.spreadsheetUrl && (
                  <a
                    href={syncStatus.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 underline mt-1"
                  >
                    <span>Open in Google Sheets (गूगल शीट में खोलें)</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Google Account Connection */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${token ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {token ? 'Google Account Connected' : 'Connect Google Drive & Sheets'}
                </h4>
                <p className="text-xs text-slate-500">
                  {token ? 'Ready to sync with Google Drive and Sheets API' : 'Sign in with your Google account to grant permission'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {token ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={isAuthenticating}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isAuthenticating ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  <span>Connect Google Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Target Spreadsheet Information */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableProperties className="h-4 w-4 text-emerald-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  Active Spreadsheet (सक्रिय गूगल स्प्रेडशीट)
                </h4>
              </div>
              {config.spreadsheetUrl && (
                <a
                  href={config.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {config.spreadsheetId ? (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {config.spreadsheetTitle || 'Mamjista Food Products POS - Master Data'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    ID: {config.spreadsheetId}
                  </p>
                  {config.lastSyncedAt && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Last Synced: {new Date(config.lastSyncedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={config.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View in Google</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
                <p className="text-xs text-slate-500">
                  No spreadsheet linked yet. Click below to generate your pre-formatted master database in Google Drive.
                </p>
                <button
                  type="button"
                  onClick={handleCreateNewSheet}
                  disabled={isSyncing}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Master Google Sheet</span>
                </button>
              </div>
            )}

            {/* Sheets Tabs Preview */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Included Worksheets (शीट के अलग-अलग टैब)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-700 font-medium flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span>Sales_Invoices ({invoices.length})</span>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-700 font-medium flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                  <span>Inventory_Stock ({products.length})</span>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-700 font-medium flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-purple-600" />
                  <span>Customers_Ledger ({customers.length})</span>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-700 font-medium flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-amber-600" />
                  <span>Suppliers_PO ({suppliers.length})</span>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-700 font-medium flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-teal-600" />
                  <span>Cash_DayBook ({cashTransactions.length})</span>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-700 font-medium flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-indigo-600" />
                  <span>Wholesale_Orders ({wholesaleOrders.length})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Auto Sync Setting */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Real-Time Sales Auto-Sync</span>
                <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5">
                  Recommended
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically append new bill rows to Google Sheet as soon as a cashier completes an invoice
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleAutoSync}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                config.autoSync ? 'bg-emerald-700' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  config.autoSync ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Advanced: Connect Existing Sheet */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>{showAdvancedSettings ? 'Hide Advanced Options' : 'Link Existing Google Spreadsheet by ID'}</span>
            </button>

            {showAdvancedSettings && (
              <div className="mt-3 rounded-xl border border-slate-200 p-3.5 bg-slate-50 space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Google Spreadsheet ID or URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSpreadsheetId}
                    onChange={(e) => setCustomSpreadsheetId(e.target.value)}
                    placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono focus:border-emerald-600 focus:outline-hidden bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomId}
                    className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900"
                  >
                    Save ID
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Tip: Make sure the Google Account currently connected has edit rights to this spreadsheet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNewSheet}
              disabled={isSyncing}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Saving to Google Sheet...' : 'Sync All Data Now (गूगल शीट में सेव करें)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
