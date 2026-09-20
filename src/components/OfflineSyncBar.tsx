import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  CloudOff, 
  CloudCheck, 
  ToggleLeft, 
  ToggleRight,
  Database
} from 'lucide-react';

interface OfflineSyncBarProps {
  isOnline: boolean;
  onToggleSimulateOffline: () => void;
  isSimulatedOffline: boolean;
  pendingSyncCount: number;
  onManualSync: () => Promise<void>;
  lastSyncedAt: string | null;
}

export const OfflineSyncBar: React.FC<OfflineSyncBarProps> = ({
  isOnline,
  onToggleSimulateOffline,
  isSimulatedOffline,
  pendingSyncCount,
  onManualSync,
  lastSyncedAt
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const effectiveOnline = isOnline && !isSimulatedOffline;

  const triggerSync = async () => {
    if (!effectiveOnline) {
      setSyncStatusMsg('Cannot sync while offline. Transactions queued locally.');
      setTimeout(() => setSyncStatusMsg(null), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Syncing data with server...');
    try {
      await onManualSync();
      setSyncStatusMsg('All data synced successfully!');
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } catch (e: any) {
      setSyncStatusMsg(`Sync error: ${e.message}`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div 
      id="offline-sync-bar"
      className={`px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 transition-colors ${
        effectiveOnline
          ? 'bg-slate-900 text-slate-200'
          : 'bg-rose-950 text-rose-100 ring-1 ring-rose-500'
      }`}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <span className="flex h-2.5 w-2.5 relative">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              effectiveOnline ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              effectiveOnline ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </span>

        <span className="font-bold flex items-center gap-1.5">
          {effectiveOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              <span>Online Mode (Server Connected)</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-rose-400" />
              <span>Offline-First Mode Active (Internet Outage Protected)</span>
            </>
          )}
        </span>

        {pendingSyncCount > 0 && (
          <span className="rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-bold ring-1 ring-amber-400/40">
            {pendingSyncCount} queued locally
          </span>
        )}
      </div>

      {/* Sync actions & simulation toggle */}
      <div className="flex items-center gap-4">
        {syncStatusMsg && (
          <span className="text-[11px] font-medium text-amber-300 animate-fade-in hidden sm:inline">
            {syncStatusMsg}
          </span>
        )}

        {lastSyncedAt && effectiveOnline && (
          <span className="text-[10px] text-slate-400 hidden md:inline">
            Last sync: {new Date(lastSyncedAt).toLocaleTimeString()}
          </span>
        )}

        <button
          type="button"
          onClick={triggerSync}
          disabled={isSyncing || !effectiveOnline}
          className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-200 text-xs font-semibold border border-slate-700 disabled:opacity-40 transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>

        {/* Offline Simulation Toggle for Testing */}
        <button
          type="button"
          onClick={onToggleSimulateOffline}
          className="flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white transition-colors"
          title="Simulate internet outage to test offline-first billing & auto-sync"
        >
          <span>Simulate Outage:</span>
          <span className={`font-bold ${isSimulatedOffline ? 'text-rose-400' : 'text-slate-400'}`}>
            {isSimulatedOffline ? 'ON (Offline)' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  );
};
