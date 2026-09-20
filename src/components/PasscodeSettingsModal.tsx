import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Crown, UserCheck, X, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { getOwnerPasscode, getCashierPasscode, setOwnerPasscode, setCashierPasscode, DEFAULT_OWNER_PASSCODE, DEFAULT_CASHIER_PASSCODE } from '../utils/storage';

interface PasscodeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasscodesUpdated?: () => void;
}

export const PasscodeSettingsModal: React.FC<PasscodeSettingsModalProps> = ({
  isOpen,
  onClose,
  onPasscodesUpdated
}) => {
  const currentOwnerPin = getOwnerPasscode();
  const currentCashierPin = getCashierPasscode();

  const [enteredCurrentOwnerPin, setEnteredCurrentOwnerPin] = useState('');
  const [newOwnerPin, setNewOwnerPin] = useState('');
  const [confirmOwnerPin, setConfirmOwnerPin] = useState('');

  const [newCashierPin, setNewCashierPin] = useState('');
  const [confirmCashierPin, setConfirmCashierPin] = useState('');

  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Verify current owner passcode
    if (enteredCurrentOwnerPin !== currentOwnerPin) {
      setError('Current Owner Passcode is incorrect. Please verify and try again.');
      return;
    }

    let updatedSomething = false;

    // Process Owner Passcode Change
    if (newOwnerPin.trim()) {
      if (!/^\d{4}$/.test(newOwnerPin.trim())) {
        setError('New Owner Passcode must be exactly 4 numeric digits (0-9).');
        return;
      }
      if (newOwnerPin !== confirmOwnerPin) {
        setError('New Owner Passcode and Confirmation do not match.');
        return;
      }
      setOwnerPasscode(newOwnerPin.trim());
      updatedSomething = true;
    }

    // Process Cashier Passcode Change
    if (newCashierPin.trim()) {
      if (!/^\d{4}$/.test(newCashierPin.trim())) {
        setError('New Cashier Passcode must be exactly 4 numeric digits (0-9).');
        return;
      }
      if (newCashierPin !== confirmCashierPin) {
        setError('New Cashier Passcode and Confirmation do not match.');
        return;
      }
      setCashierPasscode(newCashierPin.trim());
      updatedSomething = true;
    }

    if (!updatedSomething) {
      setError('Please enter a new Owner or Cashier Passcode to update.');
      return;
    }

    setSuccessMsg('Passcodes updated successfully! (पासकोड सफलतापूर्वक अपडेट हो गया)');
    setEnteredCurrentOwnerPin('');
    setNewOwnerPin('');
    setConfirmOwnerPin('');
    setNewCashierPin('');
    setConfirmCashierPin('');

    if (onPasscodesUpdated) {
      onPasscodesUpdated();
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (enteredCurrentOwnerPin !== currentOwnerPin) {
      setError('Please enter the Current Owner Passcode before resetting to default.');
      return;
    }
    const proceed = confirm('Reset both Owner and Cashier passcodes to factory defaults (Owner: 9999, Cashier: 1234)?');
    if (proceed) {
      setOwnerPasscode(DEFAULT_OWNER_PASSCODE);
      setCashierPasscode(DEFAULT_CASHIER_PASSCODE);
      setSuccessMsg('Reset to Default Passcodes (Owner: 9999, Cashier: 1234) successfully!');
      if (onPasscodesUpdated) onPasscodesUpdated();
      setTimeout(() => onClose(), 1200);
    }
  };

  return (
    <div id="passcode-settings-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div 
        id="passcode-settings-modal"
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700/80 text-amber-200 ring-1 ring-amber-500/50">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                POS Passcode Security Settings
              </h3>
              <p className="text-xs text-amber-200">
                पासकोड बदलें (Owner &amp; Cashier Passcode Configuration)
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-passcode-settings-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-amber-300 hover:text-white hover:bg-amber-800/80 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          {/* Information Card */}
          <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200 text-xs space-y-1 text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="h-4 w-4 text-amber-700" />
              <span>Role-Based Passcode Protection:</span>
            </div>
            <p className="text-[11px] text-amber-800">
              • <strong>Owner Passcode:</strong> Grants full unrestricted access to POS settings, inventory edits, customer credit &amp; loyalty terms, and changing passcodes.<br />
              • <strong>Cashier Passcode:</strong> Enables rapid customer billing only. All customization and pricing overrides are restricted.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Owner Passcode Verification */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Current Owner Passcode (वर्तमान ओनर पासकोड) <span className="text-rose-500">*</span></span>
              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className="text-[11px] font-normal text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                {showPins ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPins ? 'Hide PINs' : 'Show PINs'}
              </button>
            </label>
            <div className="relative">
              <input
                type={showPins ? 'text' : 'password'}
                maxLength={4}
                value={enteredCurrentOwnerPin}
                onChange={e => setEnteredCurrentOwnerPin(e.target.value)}
                placeholder="Enter 4-digit current owner PIN (e.g. 9999)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono font-bold tracking-widest text-slate-900 focus:border-amber-600 focus:outline-none"
                required
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Required to authorize changes to either passcode. (Default: 9999)
            </p>
          </div>

          {/* SECTION 1: CHANGE OWNER PASSCODE */}
          <div className="rounded-xl bg-amber-50/40 p-4 border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-amber-200/60">
              <Crown className="h-4 w-4 text-amber-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Change Owner Passcode (मालिक का पासकोड)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  New Owner PIN (4 Digits)
                </label>
                <input
                  type={showPins ? 'text' : 'password'}
                  maxLength={4}
                  value={newOwnerPin}
                  onChange={e => setNewOwnerPin(e.target.value)}
                  placeholder="e.g. 8888"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono font-bold tracking-widest text-slate-900 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Confirm Owner PIN
                </label>
                <input
                  type={showPins ? 'text' : 'password'}
                  maxLength={4}
                  value={confirmOwnerPin}
                  onChange={e => setConfirmOwnerPin(e.target.value)}
                  placeholder="Re-enter 4-digit PIN"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono font-bold tracking-widest text-slate-900 focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Leave blank if you only want to change the Cashier passcode.
            </p>
          </div>

          {/* SECTION 2: CHANGE CASHIER PASSCODE */}
          <div className="rounded-xl bg-blue-50/40 p-4 border border-blue-200/80 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-blue-200/60">
              <UserCheck className="h-4 w-4 text-blue-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                Change Cashier Passcode (कैशियर का पासकोड)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  New Cashier PIN (4 Digits)
                </label>
                <input
                  type={showPins ? 'text' : 'password'}
                  maxLength={4}
                  value={newCashierPin}
                  onChange={e => setNewCashierPin(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono font-bold tracking-widest text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Confirm Cashier PIN
                </label>
                <input
                  type={showPins ? 'text' : 'password'}
                  maxLength={4}
                  value={confirmCashierPin}
                  onChange={e => setConfirmCashierPin(e.target.value)}
                  placeholder="Re-enter 4-digit PIN"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono font-bold tracking-widest text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Leave blank if you only want to change the Owner passcode.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs font-semibold text-slate-500 hover:text-rose-700 underline"
            >
              Reset to Defaults (9999 / 1234)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-5 py-2.5 text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save New Passcodes (पासकोड सुरक्षित करें)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
