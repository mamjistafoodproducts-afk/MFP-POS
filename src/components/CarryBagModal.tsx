import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, X, Check, IndianRupee, Sparkles } from 'lucide-react';

interface CarryBagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCarryBags: (quantity: number, pricePerBag: number, bagTitle: string) => void;
  existingBagInCart?: { quantity: number; unitPrice: number; name: string } | null;
}

export const CarryBagModal: React.FC<CarryBagModalProps> = ({
  isOpen,
  onClose,
  onAddCarryBags,
  existingBagInCart
}) => {
  const [quantity, setQuantity] = useState<number>(existingBagInCart ? existingBagInCart.quantity : 2);
  const [pricePerBag, setPricePerBag] = useState<number>(existingBagInCart ? existingBagInCart.unitPrice : 5);
  const [customPriceInput, setCustomPriceInput] = useState<string>(existingBagInCart ? existingBagInCart.unitPrice.toString() : '5');
  const [bagType, setBagType] = useState<string>('Standard Carry Bag (कैरी बैग)');

  useEffect(() => {
    if (isOpen) {
      if (existingBagInCart) {
        setQuantity(existingBagInCart.quantity);
        setPricePerBag(existingBagInCart.unitPrice);
        setCustomPriceInput(existingBagInCart.unitPrice.toString());
      } else {
        setQuantity(2);
        setPricePerBag(5);
        setCustomPriceInput('5');
      }
    }
  }, [isOpen, existingBagInCart]);

  if (!isOpen) return null;

  const handlePriceChange = (val: number) => {
    setPricePerBag(val);
    setCustomPriceInput(val.toString());
  };

  const handleCustomPriceInputChange = (text: string) => {
    setCustomPriceInput(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed >= 0) {
      setPricePerBag(parsed);
    }
  };

  const totalAmount = quantity * pricePerBag;

  const handleConfirm = () => {
    if (quantity <= 0) return;
    onAddCarryBags(quantity, pricePerBag, bagType);
    onClose();
  };

  const BAG_PRESETS = [
    { name: 'Standard Carry Bag (कैरी बैग)', defaultPrice: 5, desc: 'Medium Biodegradable / Plastic' },
    { name: 'Large Heavy Duty Bag (बड़ा कैरी बैग)', defaultPrice: 10, desc: 'Heavy 10kg-15kg Capacity' },
    { name: 'Eco Non-Woven Bag (कपड़ा / थैला)', defaultPrice: 15, desc: 'Durable Non-Woven Fabric' },
    { name: 'Grain Sack Carry Bag (अनाज बोरी बैग)', defaultPrice: 20, desc: 'Heavy Jute / Woven Sack' }
  ];

  return (
    <div id="carry-bag-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div 
        id="carry-bag-card"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 px-5 py-3.5 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/80 text-amber-950 font-black shadow-inner">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-1.5">
                <span>Add Carry Bags</span>
                <span className="text-xs font-normal text-amber-200">(कैरी बैग जोड़ें)</span>
              </h3>
              <p className="text-[11px] text-amber-100">
                Select 1, 2, 3, 4 bags &amp; customize price in RS (₹)
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-carry-bag-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-amber-200 hover:text-white hover:bg-amber-800/80 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Bag Variety Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Bag Variety (बैग का प्रकार)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BAG_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setBagType(preset.name);
                    handlePriceChange(preset.defaultPrice);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    bagType === preset.name
                      ? 'border-amber-600 bg-amber-50/90 ring-1 ring-amber-600 text-amber-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 text-xs'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{preset.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{preset.desc}</p>
                  <span className="inline-block mt-1 font-mono font-black text-amber-800 text-xs">
                    ₹{preset.defaultPrice}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector: 1, 2, 3, 4 bags */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Bag Quantity (बैग की संख्या)</span>
              <span className="text-amber-800 font-mono text-xs font-bold">{quantity} Bags</span>
            </label>

            {/* Quick buttons: 1, 2, 3, 4, 5 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[1, 2, 3, 4, 5, 10].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantity(n)}
                  className={`flex-1 min-w-[45px] py-1.5 rounded-lg text-xs font-bold transition-all ${
                    quantity === n
                      ? 'bg-amber-700 text-white shadow-xs scale-105'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-100 hover:text-amber-900'
                  }`}
                >
                  {n} {n === 1 ? 'Bag' : 'Bags'}
                </button>
              ))}
            </div>

            {/* Stepper with custom input */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="h-9 w-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-800 font-bold active:scale-95 shadow-xs"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-18 text-center text-lg font-black font-mono py-1 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-amber-600 focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500">Pcs</span>
              </div>

              <button
                type="button"
                onClick={() => setQuantity(prev => prev + 1)}
                className="h-9 w-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-800 font-bold active:scale-95 shadow-xs"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Rate per Bag (RS ₹ as per wish) */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Price per Bag / दर (₹ RS)</span>
              <span className="text-[11px] text-slate-500 font-normal">Add custom RS as per wish</span>
            </label>

            {/* Quick Price Buttons */}
            <div className="flex items-center gap-2">
              {[2, 5, 10, 15, 20].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePriceChange(amt)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    pricePerBag === amt
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Custom Price Input */}
            <div className="relative pt-1">
              <span className="absolute left-3 top-3 font-bold text-slate-500 text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={customPriceInput}
                onChange={e => handleCustomPriceInputChange(e.target.value)}
                placeholder="Enter custom RS (e.g. 8)"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm font-mono font-bold text-slate-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Total Calculation Banner */}
          <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300 flex items-center justify-between text-amber-950">
            <div>
              <p className="text-xs font-bold">{bagType}</p>
              <p className="text-[11px] text-amber-800">
                {quantity} {quantity === 1 ? 'Bag' : 'Bags'} × ₹{pricePerBag} each
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-amber-800 block">Total Carry Bag RS:</span>
              <span className="text-lg font-black font-mono text-amber-950">
                ₹{totalAmount}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-add-carry-bag-btn"
              onClick={handleConfirm}
              className="flex-2 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Add {quantity} Bags (₹{totalAmount}) to Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
