import React, { useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Gift, 
  X, 
  Check, 
  ArrowRight, 
  History, 
  Award, 
  ShieldCheck, 
  Percent, 
  Coins 
} from 'lucide-react';
import { Customer } from '../types';
import { 
  LOYALTY_OFFERS, 
  LoyaltyRewardOffer, 
  getTierMultiplier, 
  getLoyaltyConfig, 
  calculatePointsDiscount 
} from '../utils/loyaltyEngine';

interface LoyaltyRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  billSubtotal?: number;
  currentBillSubtotal?: number;
  currentRedeemedPoints?: number;
  onApplyPoints?: (points: number, offerSelected?: LoyaltyRewardOffer) => void;
  onApplyPointsDiscount?: (points: number) => void;
  onApplyOffer?: (offer: any) => void;
}

export const LoyaltyRedemptionModal: React.FC<LoyaltyRedemptionModalProps> = ({
  isOpen,
  onClose,
  customer,
  billSubtotal,
  currentBillSubtotal,
  currentRedeemedPoints,
  onApplyPoints,
  onApplyPointsDiscount,
  onApplyOffer
}) => {
  const config = getLoyaltyConfig();
  const effectiveSubtotal = billSubtotal ?? currentBillSubtotal ?? 0;
  const [pointsInput, setPointsInput] = useState<number>(currentRedeemedPoints || 0);
  const [selectedOffer, setSelectedOffer] = useState<LoyaltyRewardOffer | null>(null);
  const [activeTab, setActiveTab] = useState<'REDEEM' | 'OFFERS' | 'HISTORY'>('REDEEM');

  if (!isOpen) return null;

  const maxDiscountAllowed = (effectiveSubtotal * (config.maxRedemptionPercent || 100)) / 100;
  const maxPointsForBill = Math.floor(maxDiscountAllowed / (config.pointValueInRupees || 1));
  const maxRedeemable = Math.min(customer.loyaltyPoints, maxPointsForBill);
  const tierMultiplier = getTierMultiplier(customer.loyaltyTier || 'Silver', config);
  const discountAmount = calculatePointsDiscount(pointsInput, config);

  const handleApplyCustomPoints = () => {
    const validPts = Math.min(maxRedeemable, Math.max(0, pointsInput));
    if (onApplyPoints) onApplyPoints(validPts);
    if (onApplyPointsDiscount) onApplyPointsDiscount(validPts);
    onClose();
  };

  const handleSelectOffer = (offer: LoyaltyRewardOffer) => {
    if (customer.loyaltyPoints < offer.pointsRequired) {
      alert(`Customer needs ${offer.pointsRequired} points to claim this offer. Current balance is ${customer.loyaltyPoints}.`);
      return;
    }
    setSelectedOffer(offer);
    if (onApplyPoints) onApplyPoints(offer.pointsRequired, offer);
    if (onApplyOffer) onApplyOffer(offer);
    onClose();
  };

  const handleRemoveLoyaltyDiscount = () => {
    setPointsInput(0);
    setSelectedOffer(null);
    if (onApplyPoints) onApplyPoints(0);
    if (onApplyPointsDiscount) onApplyPointsDiscount(0);
    onClose();
  };

  return (
    <div 
      id="loyalty-redemption-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 px-6 py-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-300/30 shadow-inner">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black">अन्नपूर्णा लॉयल्टी रिवॉर्ड्स (Loyalty Club)</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  customer.loyaltyTier === 'Platinum' 
                    ? 'bg-slate-200 text-slate-900 border border-white' 
                    : customer.loyaltyTier === 'Gold'
                    ? 'bg-amber-400 text-amber-950 border border-amber-300'
                    : 'bg-amber-800/80 text-amber-200 border border-amber-700'
                }`}>
                  {customer.loyaltyTier || 'Silver'} Tier
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                {customer.name} ({customer.mobileNumber}) • Earning {tierMultiplier}x points per ₹100
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-amber-300 hover:bg-amber-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loyalty Balance Ribbon */}
        <div className="bg-amber-50 px-6 py-3 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Available Points / उपलब्ध अंक
              </span>
              <span className="text-xl font-black text-amber-950 font-mono flex items-center gap-1">
                <Coins className="h-5 w-5 text-amber-600" />
                {customer.loyaltyPoints} Pts
              </span>
            </div>
            <div className="h-8 w-px bg-amber-200"></div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Lifetime Earned
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {customer.lifetimePoints || customer.loyaltyPoints} Pts
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Max Bill Discount (1 Pt = ₹1)
            </span>
            <span className="text-base font-black text-emerald-700 font-mono">
              Up to ₹{maxRedeemable} Off
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('REDEEM')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'REDEEM'
                ? 'border-amber-700 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Redeem Points (अंक भुनाएं)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('OFFERS')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'OFFERS'
                ? 'border-amber-700 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gift className="h-3.5 w-3.5 text-amber-600" />
            Special Mill Offers ({LOYALTY_OFFERS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'border-amber-700 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="h-3.5 w-3.5 text-slate-400" />
            Points History
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[55vh] space-y-4">
          {/* TAB 1: REDEEM POINTS */}
          {activeTab === 'REDEEM' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Redeem Points for Instant Bill Discount
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    1 Point = ₹{config.pointValueInRupees.toFixed(2)} Cash Off
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={maxRedeemable}
                    step="5"
                    value={pointsInput}
                    onChange={e => setPointsInput(parseInt(e.target.value) || 0)}
                    className="flex-1 accent-amber-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center gap-1 border border-slate-300 rounded-xl bg-white px-3 py-1.5">
                    <input
                      type="number"
                      min="0"
                      max={maxRedeemable}
                      value={pointsInput}
                      onChange={e => setPointsInput(Math.min(maxRedeemable, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-16 font-mono font-black text-base text-slate-900 focus:outline-hidden text-right"
                    />
                    <span className="text-xs font-semibold text-slate-400">Pts</span>
                  </div>
                </div>

                {/* Quick select buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 mr-1">Quick Select:</span>
                  {[0, 50, 100, 200, maxRedeemable].filter(n => n <= maxRedeemable).map(n => {
                    const worth = (n * config.pointValueInRupees).toFixed(0);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPointsInput(n)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          pointsInput === n
                            ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {n === 0 ? 'Clear' : n === maxRedeemable ? `Max (${n})` : `${n} Pts (₹${worth})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discount Impact Preview */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Discount To Apply on Current Bill
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Subtotal ₹{billSubtotal.toFixed(2)} - ₹{discountAmount.toFixed(2)} ={' '}
                    <strong>₹{Math.max(0, billSubtotal - discountAmount).toFixed(2)}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-700 font-mono">
                    - ₹{discountAmount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">
                    Points Remaining: {customer.loyaltyPoints - pointsInput}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  id="apply-loyalty-discount-btn"
                  onClick={handleApplyCustomPoints}
                  className="flex-1 rounded-xl bg-amber-700 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Apply ₹{discountAmount.toFixed(2)} Discount To Bill</span>
                </button>

                {currentRedeemedPoints > 0 && (
                  <button
                    type="button"
                    onClick={handleRemoveLoyaltyDiscount}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    Remove Discount
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SPECIAL MILL OFFERS */}
          {activeTab === 'OFFERS' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Redeem accumulated loyalty points for exclusive flour mill vouchers or complimentary gifts:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LOYALTY_OFFERS.map(offer => {
                  const canAfford = customer.loyaltyPoints >= offer.pointsRequired;
                  return (
                    <div
                      key={offer.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        canAfford
                          ? 'border-amber-300 bg-amber-50/50 hover:border-amber-500 hover:shadow-sm'
                          : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-xs font-black text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                            {offer.pointsRequired} Pts
                          </span>
                          {offer.badge && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.2 rounded-full">
                              {offer.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-2">
                          {offer.name}
                        </h4>
                        <p className="text-xs text-amber-800 font-semibold">
                          {offer.hindiName}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-snug">
                          {offer.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700">
                          Value: ₹{offer.discountValue}
                        </span>
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => handleSelectOffer(offer)}
                          className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
                        >
                          {canAfford ? 'Redeem Offer' : `Need ${offer.pointsRequired - customer.loyaltyPoints} more`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY LOGS */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Customer Points Transaction Log
              </h4>
              {customer.loyaltyHistory && customer.loyaltyHistory.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                  {customer.loyaltyHistory.map(log => (
                    <div key={log.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                            log.type === 'EARNED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {log.type}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {log.description}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-black text-sm ${
                          log.type === 'EARNED' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {log.type === 'EARNED' ? `+${log.points}` : `-${log.points}`} Pts
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Balance: {log.balanceAfter}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl bg-slate-50">
                  <History className="h-8 w-8 mx-auto stroke-1 text-slate-300 mb-1" />
                  <p className="text-xs font-medium">No previous points transactions found</p>
                  <p className="text-[10px] text-slate-400">Points earned on future sales will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Annapurna Mill Loyalty Engine v2.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
