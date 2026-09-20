import React, { useEffect } from 'react';
import { 
  PauseCircle, 
  Play, 
  Trash2, 
  Clock, 
  User, 
  ShoppingBag, 
  X, 
  Building2, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { HeldCart } from '../types';

interface HeldCartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldCarts: HeldCart[];
  onResumeCart: (cart: HeldCart) => void;
  onDeleteCart: (id: string) => void;
  onClearAll: () => void;
}

export const HeldCartsModal: React.FC<HeldCartsModalProps> = ({
  isOpen,
  onClose,
  heldCarts,
  onResumeCart,
  onDeleteCart,
  onClearAll
}) => {
  // Keyboard listener to resume cart by number (1 to 9) or Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= heldCarts.length) {
        e.preventDefault();
        onResumeCart(heldCarts[num - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, heldCarts, onResumeCart, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      id="held-carts-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="held-carts-card"
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-amber-800 to-amber-950 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-300/30 text-amber-200">
              <PauseCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Parked / Held Bills (होल्ड किए गए बिल)
                </h3>
                <span className="rounded-full bg-amber-400 text-amber-950 px-2 py-0.5 text-xs font-black">
                  {heldCarts.length}
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Press number key [1, 2, 3...] on keyboard to immediately resume bill
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-amber-200/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-3">
          {heldCarts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <PauseCircle className="h-12 w-12 text-slate-300 stroke-1 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No Parked Bills</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                When a customer needs time to find cash or UPI, press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-700 font-mono font-bold">F6</kbd> to park their bill and serve the next buyer immediately!
              </p>
            </div>
          ) : (
            heldCarts.map((cart, index) => {
              const totalItems = cart.items.reduce((s, i) => s + i.quantity, 0);
              const isB2B = cart.customer.type === 'B2B';
              const shortcutNumber = index + 1;

              return (
                <div
                  key={cart.id}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-300 font-mono font-black text-amber-900 shadow-xs text-sm group-hover:bg-amber-700 group-hover:text-white group-hover:border-amber-700 transition-colors">
                      {shortcutNumber <= 9 ? `[${shortcutNumber}]` : `#${shortcutNumber}`}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {cart.customer.name}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          isB2B ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isB2B ? 'B2B' : 'B2C'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {cart.customer.mobileNumber}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(cart.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>

                        <span>•</span>

                        <span className="font-semibold text-slate-700">
                          {totalItems} items ({cart.items.length} products)
                        </span>

                        <span>•</span>

                        <span className="font-bold text-amber-900 font-mono text-xs">
                          Est: ₹{cart.estimatedTotal}
                        </span>
                      </div>

                      {/* Items Preview */}
                      <p className="text-[11px] text-slate-500 mt-1 max-w-md truncate">
                        {cart.items.map(i => `${i.product.name} (${i.product.packSize}) x${i.quantity}`).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onDeleteCart(cart.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Discard Parked Bill"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onResumeCart(cart)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Resume Bill</span>
                      <kbd className="hidden sm:inline-block rounded bg-amber-900 px-1 py-0.2 text-[10px] font-mono">
                        [{shortcutNumber}]
                      </kbd>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          {heldCarts.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors"
            >
              Clear All Parked Bills
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-xl bg-slate-200 hover:bg-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
          >
            Close [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};
