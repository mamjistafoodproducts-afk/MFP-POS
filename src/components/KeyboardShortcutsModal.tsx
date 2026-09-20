import React from 'react';
import { 
  Keyboard, 
  X, 
  Settings, 
  Zap, 
  ShoppingBag, 
  CreditCard, 
  ArrowDownUp, 
  PauseCircle, 
  Printer, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { KeyboardShortcutsConfig } from '../types';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcutsConfig;
  onOpenSettings: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
  onOpenSettings
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="keyboard-shortcuts-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="keyboard-shortcuts-card"
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-amber-800 to-amber-950 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-300/30 text-amber-200">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Computer Keyboard POS Shortcuts (कीबोर्ड शॉर्टकट्स)
                </h3>
                <span className="rounded-md bg-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                  Fast Billing
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Speed up counter sales without touching the mouse • Fully customizable
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-shortcuts-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-amber-200/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-slate-800">
          {/* Quick Notice */}
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-950 border border-amber-200">
            <Sparkles className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>Pro Cashier Tip:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-white font-mono font-bold border border-amber-300 shadow-xs">{shortcuts.focusSearch}</kbd> anytime to jump to product search, type product name or scan barcode, and press <kbd className="px-1.5 py-0.5 rounded bg-white font-mono font-bold border border-amber-300 shadow-xs">Enter</kbd> to add directly!
            </span>
          </div>

          {/* Section 1: Billing & Cart Flow */}
          <div>
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              <span>Core Billing &amp; Counter Flow</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Focus Item Search / Barcode</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-amber-900 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.focusSearch} / <span className="text-slate-500 font-normal">/</span>
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Change Customer / Lookup</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-amber-900 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.changeCustomer} / <span className="text-slate-500 font-normal">Alt+C</span>
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 border border-amber-300">
                <span className="font-bold text-amber-950">Customer Due &amp; Advance Popup (पिछला बकाया / अग्रिम)</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-amber-800 font-mono font-black text-white border border-amber-900 shadow-xs text-xs">
                  Alt+B
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Manual Bill Discount (₹)</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-amber-900 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.manualDiscount} / <span className="text-slate-500 font-normal">Alt+D</span>
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Cycle Category Tabs</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-amber-900 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.cycleCategories}
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="font-semibold text-amber-950">Park / Hold Current Bill (बिल होल्ड)</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-amber-900 border border-amber-300 shadow-xs text-xs">
                  {shortcuts.holdCart} / <span className="text-slate-500 font-normal">Alt+H</span>
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="font-semibold text-amber-950">Recall Parked Bill (होल्ड बिल निकालें)</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-amber-900 border border-amber-300 shadow-xs text-xs">
                  {shortcuts.recallCart} / <span className="text-slate-500 font-normal">Alt+R</span>
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Clear Current Cart</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-rose-700 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.clearCart} / <span className="text-slate-500 font-normal">Alt+X</span>
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-300">
                <span className="font-bold text-emerald-950">Complete Bill / Checkout (बिल पूरा करें)</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-emerald-700 font-mono font-black text-white border border-emerald-800 shadow-xs text-xs">
                  {shortcuts.completeBill} / Ctrl+Enter
                </kbd>
              </div>
            </div>
          </div>

          {/* Section 2: Rapid Product Selection & Cart Control */}
          <div>
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
              <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
              <span>Rapid Product Search &amp; Cart Navigation</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Select Product in Search</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-slate-800 border border-slate-300 shadow-xs text-xs">
                  ↑ / ↓ (Arrow Up / Down)
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Add Selected Item to Cart</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-slate-800 border border-slate-300 shadow-xs text-xs">
                  Enter
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="font-semibold text-slate-700 block">Quantity Multiplier Prefix</span>
                  <span className="text-[10px] text-slate-400">e.g. Type "5*atta" or "10*besan"</span>
                </div>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-amber-800 border border-slate-300 shadow-xs text-xs">
                  Qty * Item
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Select Cart Item</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-slate-800 border border-slate-300 shadow-xs text-xs">
                  [ and ] / Alt+↑/↓
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Increase / Decrease Cart Qty</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-slate-800 border border-slate-300 shadow-xs text-xs">
                  + and - (or Numpad)
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Delete Item from Cart</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-rose-700 border border-slate-300 shadow-xs text-xs">
                  Delete / Backspace
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Toggle Retail / Wholesale Price</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-blue-700 border border-slate-300 shadow-xs text-xs">
                  W
                </kbd>
              </div>
            </div>
          </div>

          {/* Section 3: Payment & System Controls */}
          <div>
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
              <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
              <span>Payment Modes &amp; System Controls</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Select Cash Mode</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-emerald-800 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.payCash}
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Select Online UPI Mode</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-indigo-800 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.payOnline}
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Select 7-Day Credit Mode (B2B)</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-blue-800 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.payCredit}
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Print Receipt (Inside Receipt Modal)</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-slate-800 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.printReceipt} / Enter / P
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Open POS Settings &amp; Customization</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-amber-900 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.openSettings} / Ctrl+,
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Lock Register Screen</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-slate-700 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.lockScreen}
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Close Dialog / Clear Search</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-slate-700 border border-slate-300 shadow-xs text-xs">
                  Esc
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700">Help Sheet (This Popup)</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white font-mono font-black text-amber-900 border border-slate-300 shadow-xs text-xs">
                  {shortcuts.toggleHelp} / ?
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
          >
            <Settings className="h-4 w-4 text-amber-700" />
            <span>Customize Keys &amp; POS Settings</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-black transition-colors shadow-xs"
          >
            <span>Got It (बंद करें)</span>
            <span className="text-[10px] text-slate-400 font-mono">[Esc]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
