import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Sparkles, 
  Coins, 
  IndianRupee, 
  RotateCcw, 
  Check, 
  X, 
  ShieldCheck, 
  Percent, 
  HelpCircle,
  Award,
  Crown
} from 'lucide-react';
import { 
  LoyaltyProgramConfig, 
  getLoyaltyConfig, 
  saveLoyaltyConfig, 
  resetLoyaltyConfig,
  DEFAULT_LOYALTY_CONFIG
} from '../utils/loyaltyEngine';

interface LoyaltyRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: LoyaltyProgramConfig) => void;
}

export const LoyaltyRulesModal: React.FC<LoyaltyRulesModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<LoyaltyProgramConfig>(getLoyaltyConfig());
  const [testSpend, setTestSpend] = useState<number>(1000);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getLoyaltyConfig());
      setShowSavedToast(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Live Calculations for Simulator
  const baseUnits = Math.floor(testSpend / (config.spendAmountForPoints || 1));
  const testBasePoints = baseUnits * (config.pointsAwarded || 1);
  const silverPts = Math.floor(testBasePoints * (config.silverMultiplier || 1));
  const goldPts = Math.floor(testBasePoints * (config.goldMultiplier || 1.25));
  const platinumPts = Math.floor(testBasePoints * (config.platinumMultiplier || 1.5));

  const silverRupees = silverPts * (config.pointValueInRupees || 1);
  const goldRupees = goldPts * (config.pointValueInRupees || 1);
  const platinumRupees = platinumPts * (config.pointValueInRupees || 1);

  const effectiveCashbackPct = config.spendAmountForPoints > 0 
    ? (((config.pointsAwarded * config.pointValueInRupees) / config.spendAmountForPoints) * 100).toFixed(2)
    : '0.00';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveLoyaltyConfig(config);
    setShowSavedToast(true);
    if (onConfigSaved) onConfigSaved(config);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    if (confirm('Reset loyalty points earning and rupee conversion rules back to default (₹100 = 1 pt worth ₹1)?')) {
      const def = resetLoyaltyConfig();
      setConfig(def);
      if (onConfigSaved) onConfigSaved(def);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 p-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xs text-amber-200">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Loyalty Points &amp; Rupee Worth Policy (वफादारी नियम)
              </h3>
              <p className="text-xs text-amber-200 font-medium">
                Decide points awarded per Rs. purchase and redemption value in ₹
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Formula Card */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-700" />
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                Primary Points Earning &amp; Rupee Worth Ratio
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Spend Amount */}
              <div className="rounded-xl bg-white p-3 border border-amber-200 shadow-2xs space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  1. For Every Purchase Of
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    step={1}
                    value={config.spendAmountForPoints}
                    onChange={e => setConfig({ ...config, spendAmountForPoints: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 pl-6 pr-2 font-mono font-bold text-slate-900 focus:border-amber-600 focus:outline-hidden text-sm"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500">e.g. ₹100 or ₹50</p>
              </div>

              {/* Points Awarded */}
              <div className="rounded-xl bg-white p-3 border border-amber-200 shadow-2xs space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  2. Award Customer
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    step={1}
                    value={config.pointsAwarded}
                    onChange={e => setConfig({ ...config, pointsAwarded: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 font-mono font-bold text-amber-900 focus:border-amber-600 focus:outline-hidden text-sm"
                    required
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 font-bold text-xs">
                    Pts
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">e.g. 1 point or 2 points</p>
              </div>

              {/* Point Rupee Worth */}
              <div className="rounded-xl bg-white p-3 border border-amber-200 shadow-2xs space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  3. Each 1 Point Is Worth
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-emerald-700 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0.05}
                    max={100}
                    step={0.05}
                    value={config.pointValueInRupees}
                    onChange={e => setConfig({ ...config, pointValueInRupees: Math.max(0.01, parseFloat(e.target.value) || 1.0) })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 pl-6 pr-2 font-mono font-bold text-emerald-800 focus:border-emerald-600 focus:outline-hidden text-sm"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500">e.g. ₹1.00 or ₹0.50 discount</p>
              </div>
            </div>

            {/* Visual Formula & Cashback percentage highlight */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-100/90 p-2.5 text-xs text-amber-950 font-medium">
              <div>
                <span className="font-bold">Active Conversion: </span>
                <span>₹{config.spendAmountForPoints} Purchase → {config.pointsAwarded} Point(s) → Worth </span>
                <strong className="text-emerald-800 font-bold font-mono">
                  ₹{(config.pointsAwarded * config.pointValueInRupees).toFixed(2)} Off
                </strong>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-700 px-2.5 py-0.5 text-white font-bold text-[11px] shadow-2xs">
                <Percent className="h-3 w-3" />
                <span>{effectiveCashbackPct}% Effective Reward</span>
              </div>
            </div>
          </div>

          {/* Real-Time Earning Simulator */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Live Rule Simulator (देखें ग्राहक को कितना लाभ मिलेगा)
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Test Bill Spend:</span>
                <div className="relative w-28">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min={10}
                    step={50}
                    value={testSpend}
                    onChange={e => setTestSpend(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-300 bg-white py-1 pl-5 pr-1 font-mono text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Silver */}
              <div className="rounded-xl border border-slate-200 bg-white p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">🥈 Silver ({config.silverMultiplier}x)</span>
                  <span className="text-slate-500 font-normal">Entry</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-black font-mono text-slate-800">{silverPts} Pts</span>
                  <span className="text-xs font-bold font-mono text-emerald-700">₹{silverRupees.toFixed(2)} Off</span>
                </div>
              </div>

              {/* Gold */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                  <span className="flex items-center gap-1">🥇 Gold VIP ({config.goldMultiplier}x)</span>
                  <span className="text-amber-700 font-normal">{config.goldThresholdPoints}+ Pts</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-black font-mono text-amber-950">{goldPts} Pts</span>
                  <span className="text-xs font-bold font-mono text-emerald-800">₹{goldRupees.toFixed(2)} Off</span>
                </div>
              </div>

              {/* Platinum */}
              <div className="rounded-xl border border-purple-300 bg-purple-50/50 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                  <span className="flex items-center gap-1">💎 Platinum ({config.platinumMultiplier}x)</span>
                  <span className="text-purple-700 font-normal">{config.platinumThresholdPoints}+ Pts</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-black font-mono text-purple-950">{platinumPts} Pts</span>
                  <span className="text-xs font-bold font-mono text-emerald-800">₹{platinumRupees.toFixed(2)} Off</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tier Multipliers & Thresholds Settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                VIP Tier Multipliers &amp; Qualification Thresholds
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gold Multiplier</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1.0}
                    max={5.0}
                    step={0.05}
                    value={config.goldMultiplier}
                    onChange={e => setConfig({ ...config, goldMultiplier: parseFloat(e.target.value) || 1.25 })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 font-mono text-xs font-bold"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 font-bold text-xs">x</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gold Min Points</label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={config.goldThresholdPoints}
                  onChange={e => setConfig({ ...config, goldThresholdPoints: parseInt(e.target.value) || 500 })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Platinum Multiplier</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1.0}
                    max={10.0}
                    step={0.05}
                    value={config.platinumMultiplier}
                    onChange={e => setConfig({ ...config, platinumMultiplier: parseFloat(e.target.value) || 1.5 })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 font-mono text-xs font-bold"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 font-bold text-xs">x</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Platinum Min Points</label>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={config.platinumThresholdPoints}
                  onChange={e => setConfig({ ...config, platinumThresholdPoints: parseInt(e.target.value) || 1500 })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 font-mono text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Guardrails & Limits */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Redemption &amp; Eligibility Guardrails (सुरक्षा सीमाएँ)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Bill Spend To Earn (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={config.minSpendToEarn}
                  onChange={e => setConfig({ ...config, minSpendToEarn: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 font-mono text-xs font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Bills below this earn 0 pts</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Points To Redeem</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={config.minPointsToRedeem}
                  onChange={e => setConfig({ ...config, minPointsToRedeem: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 font-mono text-xs font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Threshold to unlock discount</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Bill % Deductible</label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={100}
                    step={5}
                    value={config.maxRedemptionPercent}
                    onChange={e => setConfig({ ...config, maxRedemptionPercent: Math.min(100, Math.max(10, parseInt(e.target.value) || 100)) })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 font-mono text-xs font-bold"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 font-bold text-xs">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Cap on bill discount (100% = full)</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Factory Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-amber-700 px-5 py-2 text-xs font-bold text-white hover:bg-amber-800 shadow-xs transition-colors"
              >
                {showSavedToast ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Rules Saved!</span>
                  </>
                ) : (
                  <span>Save Loyalty Rules</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
