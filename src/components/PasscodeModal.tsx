import React, { useState } from 'react';
import { Lock, Delete, ShieldCheck, KeyRound, Crown, UserCheck, X } from 'lucide-react';
import { getOwnerPasscode, getCashierPasscode } from '../utils/storage';
import { UserRole } from '../types';

interface PasscodeModalProps {
  isOpen: boolean;
  onSuccess: (role: UserRole) => void;
  onCancel?: () => void;
  requiredRole?: UserRole;
  title?: string;
  subtitle?: string;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({ 
  isOpen, 
  onSuccess,
  onCancel,
  requiredRole,
  title = 'Mamjista Food Products',
  subtitle = 'ममजिस्टा फूड प्रोडक्ट्स (POS Register)'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | false>(false);
  const [showHint, setShowHint] = useState(false);

  if (!isOpen) return null;

  const ownerPasscode = getOwnerPasscode();
  const cashierPasscode = getCashierPasscode();

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (requiredRole === 'OWNER') {
          if (nextPin === ownerPasscode) {
            setTimeout(() => {
              setPin('');
              onSuccess('OWNER');
            }, 150);
          } else {
            setError('Owner Passcode Incorrect. Owner access required.');
            setTimeout(() => {
              setPin('');
            }, 700);
          }
        } else {
          // Check Owner vs Cashier
          if (nextPin === ownerPasscode) {
            setTimeout(() => {
              setPin('');
              onSuccess('OWNER');
            }, 150);
          } else if (nextPin === cashierPasscode) {
            setTimeout(() => {
              setPin('');
              onSuccess('CASHIER');
            }, 150);
          } else {
            setError('Incorrect Passcode. Please try again.');
            setTimeout(() => {
              setPin('');
            }, 700);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div id="passcode-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div 
        id="passcode-card"
        className={`w-full max-w-sm rounded-2xl bg-white p-6 sm:p-7 shadow-2xl transition-all duration-200 relative ${
          error ? 'ring-4 ring-rose-500 animate-shake' : 'ring-1 ring-slate-200'
        }`}
      >
        {onCancel && (
          <button
            type="button"
            id="close-passcode-btn"
            onClick={onCancel}
            className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            title="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md">
            {requiredRole === 'OWNER' ? <Crown className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="text-xs font-semibold text-amber-800">
            {subtitle}
          </p>

          <div className="mt-2.5 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300/60">
              <Crown className="h-3 w-3 text-amber-700" /> Owner: Full Customization
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-900 border border-blue-300/60">
              <UserCheck className="h-3 w-3 text-blue-700" /> Cashier: Billing Only
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {requiredRole === 'OWNER' 
              ? 'Enter 4-Digit Owner Passcode to unlock customization' 
              : 'Enter Owner or Cashier 4-digit Passcode to proceed'}
          </p>
        </div>

        {/* Pin Dots */}
        <div className="mb-5 flex justify-center items-center gap-4">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full transition-all duration-150 ${
                pin.length > idx
                  ? error
                    ? 'bg-rose-600 scale-110'
                    : 'bg-amber-600 scale-110 shadow-xs'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-xs font-semibold text-rose-600 mb-3 animate-bounce">
            {error}
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              id={`pin-btn-${num}`}
              onClick={() => handleDigit(num)}
              className="flex h-13 items-center justify-center rounded-xl bg-slate-50 text-xl font-bold text-slate-800 hover:bg-amber-100 hover:text-amber-900 active:scale-95 transition-all shadow-xs border border-slate-200"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            id="pin-clear-btn"
            onClick={handleClear}
            className="flex h-13 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200"
          >
            CLEAR
          </button>
          <button
            type="button"
            id="pin-btn-0"
            onClick={() => handleDigit('0')}
            className="flex h-13 items-center justify-center rounded-xl bg-slate-50 text-xl font-bold text-slate-800 hover:bg-amber-100 hover:text-amber-900 active:scale-95 transition-all shadow-xs border border-slate-200"
          >
            0
          </button>
          <button
            type="button"
            id="pin-backspace-btn"
            onClick={handleBackspace}
            className="flex h-13 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Helper / Demo Hint */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1 text-amber-700 hover:underline font-semibold"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {showHint ? 'Hide Default PINs' : 'Show Default PINs'}
          </button>
          <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5" /> Role Protected
          </span>
        </div>

        {showHint && (
          <div className="mt-2.5 p-3 rounded-xl bg-amber-50 text-amber-950 text-xs border border-amber-200 space-y-2">
            <div className="flex items-center justify-between border-b border-amber-200/70 pb-1.5">
              <div>
                <span className="font-bold text-amber-900 block flex items-center gap-1">
                  <Crown className="h-3 w-3 text-amber-600" /> Owner Passcode:
                </span>
                <span className="text-[11px] text-amber-800">Full customization &amp; settings</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPin(ownerPasscode);
                  setTimeout(() => onSuccess('OWNER'), 150);
                }}
                className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 text-[11px] font-mono font-bold shadow-xs transition-all"
              >
                Autofill {ownerPasscode} (Owner)
              </button>
            </div>

            {requiredRole !== 'OWNER' && (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="font-bold text-blue-900 block flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-blue-600" /> Cashier Passcode:
                  </span>
                  <span className="text-[11px] text-blue-800">Fast billing only mode</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPin(cashierPasscode);
                    setTimeout(() => onSuccess('CASHIER'), 150);
                  }}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-[11px] font-mono font-bold shadow-xs transition-all"
                >
                  Autofill {cashierPasscode} (Cashier)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
