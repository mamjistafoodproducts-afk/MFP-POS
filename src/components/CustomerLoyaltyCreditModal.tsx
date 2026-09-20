import React, { useState, useEffect } from 'react';
import { 
  UserCog, 
  Coins, 
  CreditCard, 
  ShieldCheck, 
  Award, 
  Crown, 
  Sparkles, 
  Plus, 
  Minus, 
  Check, 
  X, 
  Building2, 
  ShoppingBag, 
  Phone, 
  Calendar, 
  History, 
  AlertTriangle,
  Wallet,
  IndianRupee,
  FileText
} from 'lucide-react';
import { Customer, LoyaltyTier, LoyaltyLog } from '../types';
import { 
  getLoyaltyConfig, 
  calculatePointsDiscount, 
  calculateTier,
  getTierMultiplier 
} from '../utils/loyaltyEngine';

interface CustomerLoyaltyCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSaveCustomer: (updatedCustomer: Customer) => void;
}

export const CustomerLoyaltyCreditModal: React.FC<CustomerLoyaltyCreditModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSaveCustomer
}) => {
  const [activeTab, setActiveTab] = useState<'LOYALTY' | 'CREDIT' | 'INFO' | 'HISTORY'>('LOYALTY');
  
  // Local state for editing
  const [formData, setFormData] = useState<Customer | null>(null);
  const [pointsDelta, setPointsDelta] = useState<string>('');
  const [loyaltyReason, setLoyaltyReason] = useState<string>('');
  const [creditReason, setCreditReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const config = getLoyaltyConfig();

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        ...customer,
        loyaltyPoints: customer.loyaltyPoints ?? 0,
        lifetimePoints: customer.lifetimePoints ?? 0,
        outstandingCredit: customer.outstandingCredit ?? 0,
        advanceBalance: customer.advanceBalance ?? 0,
        creditLimit: customer.creditLimit ?? (customer.type === 'B2B' ? 50000 : 10000),
        creditDaysAllowed: customer.creditDaysAllowed ?? 7,
        creditStatus: customer.creditStatus ?? 'ACTIVE',
        loyaltyTier: customer.loyaltyTier || 'Silver'
      });
      setPointsDelta('');
      setLoyaltyReason('');
      setCreditReason('');
      setValidationError('');
      setSaveSuccess(false);
      setActiveTab('LOYALTY');
    }
  }, [customer, isOpen]);

  if (!isOpen || !formData) return null;

  const currentPoints = formData.loyaltyPoints;
  const pointWorthRupees = calculatePointsDiscount(currentPoints, config);
  const availableCredit = Math.max(0, formData.creditLimit - formData.outstandingCredit);

  const handleApplyQuickPoints = (delta: number) => {
    const updated = Math.max(0, formData.loyaltyPoints + delta);
    setFormData({
      ...formData,
      loyaltyPoints: updated,
      // If adding points, also increment lifetime points unless reset
      lifetimePoints: delta > 0 ? formData.lifetimePoints + delta : formData.lifetimePoints
    });
    if (!loyaltyReason) {
      setLoyaltyReason(delta > 0 ? `Manual bonus of ${delta} points` : `Manual correction of ${Math.abs(delta)} points`);
    }
  };

  const handleRecalculateTier = () => {
    const autoTier = calculateTier(formData.lifetimePoints, config);
    setFormData({ ...formData, loyaltyTier: autoTier });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setValidationError('Customer Name is required');
      return;
    }
    if (!formData.mobileNumber.trim() || formData.mobileNumber.replace(/\D/g, '').length < 10) {
      setValidationError('Valid 10-digit Mobile Number is required');
      return;
    }

    let updatedHistory = [...(formData.loyaltyHistory || [])];
    const originalPoints = customer?.loyaltyPoints ?? 0;
    const diff = formData.loyaltyPoints - originalPoints;

    // Log loyalty points change if modified
    if (diff !== 0) {
      const newLog: LoyaltyLog = {
        id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toISOString(),
        type: 'ADJUSTED',
        points: diff,
        description: loyaltyReason.trim() 
          ? `Profile Edit: ${loyaltyReason.trim()}` 
          : `Manager profile adjustment (${diff > 0 ? `+${diff}` : diff} points)`,
        balanceAfter: formData.loyaltyPoints
      };
      updatedHistory = [newLog, ...updatedHistory];
    }

    const finalCustomer: Customer = {
      ...formData,
      loyaltyHistory: updatedHistory,
      notes: creditReason.trim() 
        ? `${formData.notes ? `${formData.notes} | ` : ''}Credit Updated: ${creditReason.trim()}`
        : formData.notes
    };

    onSaveCustomer(finalCustomer);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold text-lg ${
              formData.type === 'B2B' ? 'bg-blue-600/30 text-blue-300 border border-blue-400/30' : 'bg-amber-600/30 text-amber-300 border border-amber-400/30'
            }`}>
              {formData.type === 'B2B' ? <Building2 className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {formData.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  formData.type === 'B2B' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {formData.type === 'B2B' ? 'B2B Wholesale' : 'B2C Retail'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  formData.loyaltyTier === 'Platinum' 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                    : formData.loyaltyTier === 'Gold' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}>
                  <Crown className="h-3 w-3" />
                  <span>{formData.loyaltyTier} Member</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {formData.mobileNumber} {formData.businessName ? `• ${formData.businessName}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100/90 px-5 py-2.5 border-b border-slate-200 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-500">Loyalty Points</span>
            <span className="font-mono font-black text-amber-900 text-sm">
              {formData.loyaltyPoints.toLocaleString()} Pts
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">
              Worth ₹{pointWorthRupees.toFixed(2)} Off
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-500">Credit Due (बकाया)</span>
            <span className={`font-mono font-black text-sm ${formData.outstandingCredit > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              ₹{formData.outstandingCredit.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">
              Limit: ₹{formData.creditLimit.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-500">Available Credit</span>
            <span className="font-mono font-black text-blue-700 text-sm">
              ₹{availableCredit.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">
              Period: {formData.creditDaysAllowed || 7} Days
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-500">Advance Deposit</span>
            <span className="font-mono font-black text-emerald-700 text-sm">
              ₹{(formData.advanceBalance || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">
              Status: <strong className={formData.creditStatus === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-600'}>{formData.creditStatus || 'ACTIVE'}</strong>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('LOYALTY')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'LOYALTY' 
                ? 'border-amber-600 text-amber-900 bg-amber-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className="h-4 w-4 text-amber-600" />
            <span>Loyalty Profile &amp; Points</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CREDIT')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'CREDIT' 
                ? 'border-blue-600 text-blue-900 bg-blue-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span>Credit &amp; Ledger Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INFO')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'INFO' 
                ? 'border-slate-800 text-slate-900 bg-slate-50' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCog className="h-4 w-4 text-slate-600" />
            <span>Identity &amp; Business</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'HISTORY' 
                ? 'border-slate-800 text-slate-900 bg-slate-50' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="h-4 w-4 text-slate-600" />
            <span>Points Audit Log ({formData.loyaltyHistory?.length || 0})</span>
          </button>
        </div>

        {/* Validation Error banner */}
        {validationError && (
          <div className="bg-rose-50 border-l-4 border-rose-600 p-3 mx-5 mt-3 flex items-center gap-2 text-xs font-bold text-rose-800">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: LOYALTY PROFILE */}
          {activeTab === 'LOYALTY' && (
            <div className="space-y-4">
              {/* Point Balance & Rupee Worth Card */}
              <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-700" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                      Current Loyalty Points Balance &amp; Value
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500">Configured Value: </span>
                    <strong className="text-xs text-emerald-800 font-bold">
                      1 Point = ₹{config.pointValueInRupees.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current Points input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Available Points (रिडीम करने योग्य अंक)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={formData.loyaltyPoints}
                        onChange={e => setFormData({ ...formData, loyaltyPoints: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full rounded-xl border border-slate-300 py-2 pl-3 pr-14 font-mono text-lg font-black text-amber-900 focus:border-amber-600 focus:outline-hidden"
                        required
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-bold text-xs text-slate-400">
                        PTS
                      </span>
                    </div>
                  </div>

                  {/* Rupee Discount Worth Box */}
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-emerald-950">
                      Total Bill Discount Worth (रुपये में मूल्य)
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-800 mt-0.5">
                      ₹{pointWorthRupees.toFixed(2)} Off
                    </span>
                    <span className="text-[10px] text-emerald-700 mt-0.5">
                      Can be applied directly at POS checkout
                    </span>
                  </div>
                </div>

                {/* Quick Add / Deduct Chips */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Quick Adjustment Shortcuts (अंक जोड़ें या घटाएं):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPoints(50)}
                      className="rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 text-xs font-bold border border-amber-300 transition-colors"
                    >
                      +50 Pts
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPoints(100)}
                      className="rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 text-xs font-bold border border-amber-300 transition-colors"
                    >
                      +100 Pts
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPoints(500)}
                      className="rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 text-xs font-bold border border-amber-300 transition-colors"
                    >
                      +500 Pts
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPoints(1000)}
                      className="rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 text-xs font-bold border border-amber-300 transition-colors"
                    >
                      +1,000 Pts
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPoints(-50)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-bold border border-slate-300 transition-colors"
                    >
                      -50 Pts
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPoints(-100)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-bold border border-slate-300 transition-colors"
                    >
                      -100 Pts
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, loyaltyPoints: 0 })}
                      className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-bold border border-rose-200 transition-colors ml-auto"
                    >
                      Reset to 0
                    </button>
                  </div>
                </div>

                {/* Reason for adjustment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Points Modification (कारण / विवरण)
                  </label>
                  <input
                    type="text"
                    value={loyaltyReason}
                    onChange={e => setLoyaltyReason(e.target.value)}
                    placeholder="e.g. Festival Gift Bonus, Opening Migration Balance, Manager Approved Correction"
                    className="w-full rounded-xl border border-slate-300 py-1.5 px-3 text-xs focus:border-amber-600 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Will be permanently logged in customer's audit trail
                  </p>
                </div>
              </div>

              {/* Tier & Lifetime Points Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-purple-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Tier Level &amp; Lifetime Cumulative Stats
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleRecalculateTier}
                    className="text-[11px] text-amber-800 font-bold hover:underline"
                  >
                    Auto-Calculate Tier
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned Loyalty Tier
                    </label>
                    <select
                      value={formData.loyaltyTier}
                      onChange={e => setFormData({ ...formData, loyaltyTier: e.target.value as LoyaltyTier })}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value="Silver">🥈 Silver Member (Standard {config.silverMultiplier}x)</option>
                      <option value="Gold">🥇 Gold VIP Member ({config.goldMultiplier}x multiplier)</option>
                      <option value="Platinum">💎 Platinum Elite ({config.platinumMultiplier}x multiplier)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lifetime Cumulative Points (कुल अर्जित अंक)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.lifetimePoints}
                      onChange={e => setFormData({ ...formData, lifetimePoints: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>
                    Current Earning Rate: For every ₹{config.spendAmountForPoints} purchase, this customer earns{' '}
                    <strong className="text-amber-900 font-bold">
                      {Math.floor(config.pointsAwarded * getTierMultiplier(formData.loyaltyTier, config))} Points
                    </strong>
                  </span>
                  <span className="font-bold text-purple-800">
                    {getTierMultiplier(formData.loyaltyTier, config)}x Multiplier
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREDIT & LEDGER PROFILE */}
          {activeTab === 'CREDIT' && (
            <div className="space-y-4">
              {/* Credit Status & Limit */}
              <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-700" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-950">
                      7-Day / B2B Credit Facility Settings (उधार खाता प्रोफाइल)
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    formData.creditStatus === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : formData.creditStatus === 'ON_HOLD'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    Credit {formData.creditStatus || 'ACTIVE'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Credit Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Credit Facility Status
                    </label>
                    <select
                      value={formData.creditStatus || 'ACTIVE'}
                      onChange={e => setFormData({ ...formData, creditStatus: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value="ACTIVE">✅ Active (Credit Allowed)</option>
                      <option value="ON_HOLD">⚠️ On Hold (Review Required)</option>
                      <option value="BLOCKED">🛑 Blocked (No Credit Sales)</option>
                    </select>
                  </div>

                  {/* Credit Limit */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Credit Limit (अधिकतम उधार सीमा)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={formData.creditLimit}
                        onChange={e => setFormData({ ...formData, creditLimit: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full rounded-xl border border-slate-300 py-2 pl-6 pr-2 text-xs font-mono font-bold text-blue-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Credit Period Days */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Credit Payment Days
                    </label>
                    <select
                      value={formData.creditDaysAllowed || 7}
                      onChange={e => setFormData({ ...formData, creditDaysAllowed: parseInt(e.target.value) || 7 })}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value={7}>7 Days (Standard Wholesale)</option>
                      <option value={15}>15 Days (Fortnightly)</option>
                      <option value={30}>30 Days (Monthly Cycle)</option>
                      <option value={45}>45 Days (Extended)</option>
                      <option value={60}>60 Days (VIP Distributor)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Outstanding Due & Advance Balance */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-slate-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Balances &amp; Current Ledger State
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Outstanding Due */}
                  <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-rose-950">
                        Current Outstanding Due (पिछला बकाया)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, outstandingCredit: 0 })}
                        className="text-[10px] text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                      >
                        Clear to ₹0 (Fully Paid)
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-rose-700 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={formData.outstandingCredit}
                        onChange={e => setFormData({ ...formData, outstandingCredit: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className="w-full rounded-xl border border-rose-300 py-2 pl-7 pr-3 text-base font-mono font-black text-rose-800 bg-white focus:border-rose-600 focus:outline-hidden"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Unpaid bills will prompt sales cashier to collect or adjust.
                    </p>
                  </div>

                  {/* Advance Deposit */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-emerald-950">
                        Advance Balance Deposit (जमा अग्रिम राशि)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, advanceBalance: 0 })}
                        className="text-[10px] text-slate-600 font-bold bg-white hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                      >
                        Clear to ₹0
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-700 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={formData.advanceBalance || 0}
                        onChange={e => setFormData({ ...formData, advanceBalance: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className="w-full rounded-xl border border-emerald-300 py-2 pl-7 pr-3 text-base font-mono font-black text-emerald-800 bg-white focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, advanceBalance: (formData.advanceBalance || 0) + 1000 })}
                        className="text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300"
                      >
                        +₹1,000
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, advanceBalance: (formData.advanceBalance || 0) + 5000 })}
                        className="text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300"
                      >
                        +₹5,000
                      </button>
                    </div>
                  </div>
                </div>

                {/* Credit Reason / Terms */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Credit Terms &amp; Settlement Remarks (उधार शर्तें व टिप्पणी)
                  </label>
                  <input
                    type="text"
                    value={formData.creditNotes || ''}
                    onChange={e => setFormData({ ...formData, creditNotes: e.target.value })}
                    placeholder="e.g. Weekly Monday clearance by NEFT / Cheque; Security deposit received"
                    className="w-full rounded-xl border border-slate-300 py-1.5 px-3 text-xs focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER IDENTITY & BUSINESS INFO */}
          {activeTab === 'INFO' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Customer Master Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mobile Number (10 Digits) *
                    </label>
                    <input
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Customer Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as 'B2C' | 'B2B' })}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-bold bg-white"
                    >
                      <option value="B2C">B2C Retail Buyer (खुद्रा ग्राहक)</option>
                      <option value="B2B">B2B Wholesale / Merchant (थोक व्यापारी)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Business / Shop Name (दुकान / फर्म)
                    </label>
                    <input
                      type="text"
                      value={formData.businessName || ''}
                      onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="e.g. Aggarwal Kirana Store"
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.gstNumber || ''}
                      onChange={e => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                      placeholder="e.g. 08AAAAA0000A1Z5"
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Billing &amp; Delivery Address
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Shop location or colony"
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">
                    General Notes / Preferences
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Prefers freshly ground Atta on Saturdays; Morning delivery"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT HISTORY */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Loyalty Points &amp; Modification Audit Trail
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  {formData.loyaltyHistory?.length || 0} Transactions
                </span>
              </div>

              {(!formData.loyaltyHistory || formData.loyaltyHistory.length === 0) ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                  No points activity logged yet for this customer profile.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden max-h-72 overflow-y-auto">
                  {formData.loyaltyHistory.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'EARNED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.type === 'REDEEMED'
                              ? 'bg-amber-100 text-amber-800'
                              : item.type === 'ADJUSTED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.description}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {new Date(item.date).toLocaleString()} • Balance after: {item.balanceAfter} Pts
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-black text-sm ${
                          item.points > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {item.points > 0 ? `+${item.points}` : item.points} Pts
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          (₹{(Math.abs(item.points) * config.pointValueInRupees).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-md transition-colors"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Profile Saved Successfully!</span>
                </>
              ) : (
                <>
                  <UserCog className="h-4 w-4 text-amber-400" />
                  <span>Save Loyalty &amp; Credit Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
