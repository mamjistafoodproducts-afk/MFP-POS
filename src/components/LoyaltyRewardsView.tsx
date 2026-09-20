import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Coins, 
  Gift, 
  Crown, 
  Search, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  User,
  Building2,
  Phone,
  Sliders,
  Settings2,
  CreditCard
} from 'lucide-react';
import { Customer, LoyaltyTier } from '../types';
import { 
  LOYALTY_OFFERS, 
  getTierMultiplier, 
  getLoyaltyConfig, 
  saveLoyaltyConfig, 
  LoyaltyProgramConfig,
  calculatePointsDiscount
} from '../utils/loyaltyEngine';
import { LoyaltyRulesModal } from './LoyaltyRulesModal';
import { CustomerLoyaltyCreditModal } from './CustomerLoyaltyCreditModal';

interface LoyaltyRewardsViewProps {
  customers: Customer[];
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onAddNewCustomer?: (newCustomer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onSelectCustomerForBill?: (customer: Customer) => void;
  onGrantBonusPoints?: (customerId: string, points: number, reason: string) => void;
}

export const LoyaltyRewardsView: React.FC<LoyaltyRewardsViewProps> = ({
  customers,
  onUpdateCustomer,
  onAddNewCustomer,
  onDeleteCustomer,
  onSelectCustomerForBill,
  onGrantBonusPoints
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);

  // Bonus points modal state
  const [bonusCustomer, setBonusCustomer] = useState<Customer | null>(null);
  const [bonusPoints, setBonusPoints] = useState<string>('100');
  const [bonusReason, setBonusReason] = useState('Festival / Diwali Bonus Points');

  // Add Customer State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustType, setNewCustType] = useState<'B2C' | 'B2B'>('B2C');
  const [newCustBusiness, setNewCustBusiness] = useState('');
  const [newCustGst, setNewCustGst] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState<number>(0);
  const [newCustOpeningCredit, setNewCustOpeningCredit] = useState<number>(0);
  const [newCustInitialPoints, setNewCustInitialPoints] = useState<number>(50);

  // Edit Customer State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Delete Customer State
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Loyalty Program Config state & Rules modal
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyProgramConfig>(() => getLoyaltyConfig());
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [loyaltyCreditCustomer, setLoyaltyCreditCustomer] = useState<Customer | null>(null);

  const handleSaveRules = (newConfig: LoyaltyProgramConfig) => {
    saveLoyaltyConfig(newConfig);
    setLoyaltyConfig(newConfig);
  };

  const handleSaveCustomerLoyaltyCredit = (updatedCust: Customer) => {
    onUpdateCustomer(updatedCust);
    if (selectedCustomer?.id === updatedCust.id) {
      setSelectedCustomer(updatedCust);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchTier = selectedTier === 'ALL' || c.loyaltyTier === selectedTier;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.mobileNumber.includes(q) ||
        (c.businessName && c.businessName.toLowerCase().includes(q));
      return matchTier && matchQuery;
    });
  }, [customers, selectedTier, searchQuery]);

  // Tier counts
  const silverCount = customers.filter(c => (c.loyaltyTier || 'Silver') === 'Silver').length;
  const goldCount = customers.filter(c => c.loyaltyTier === 'Gold').length;
  const platinumCount = customers.filter(c => c.loyaltyTier === 'Platinum').length;
  const totalPointsInCirculation = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);

  const handleGrantBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusCustomer) return;
    const pts = parseInt(bonusPoints) || 0;
    if (pts <= 0) return;

    if (onGrantBonusPoints) {
      onGrantBonusPoints(bonusCustomer.id, pts, bonusReason);
    } else {
      const updatedCust: Customer = {
        ...bonusCustomer,
        loyaltyPoints: (bonusCustomer.loyaltyPoints || 0) + pts,
        lifetimePoints: (bonusCustomer.lifetimePoints || 0) + pts,
        loyaltyHistory: [
          {
            id: `loyalty-${Date.now()}`,
            date: new Date().toISOString(),
            type: 'BONUS',
            points: pts,
            description: bonusReason
          },
          ...(bonusCustomer.loyaltyHistory || [])
        ]
      };
      onUpdateCustomer(updatedCust);
    }

    setBonusCustomer(null);
  };

  // Add Customer Submit
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustMobile.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      mobileNumber: newCustMobile.trim(),
      type: newCustType,
      businessName: newCustBusiness.trim() || undefined,
      gstNumber: newCustGst.trim() || undefined,
      address: newCustAddress.trim(),
      creditLimit: Number(newCustCreditLimit) || (newCustType === 'B2B' ? 50000 : 0),
      outstandingCredit: Number(newCustOpeningCredit) || 0,
      loyaltyPoints: Number(newCustInitialPoints) || 0,
      lifetimePoints: Number(newCustInitialPoints) || 0,
      loyaltyTier: 'Silver',
      totalPurchases: 0,
      orderCount: 0,
      createdAt: new Date().toISOString(),
      loyaltyHistory: newCustInitialPoints > 0 ? [
        {
          id: `loyalty-welcome-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'BONUS',
          points: Number(newCustInitialPoints),
          balanceAfter: Number(newCustInitialPoints),
          description: 'Welcome Sign-up Reward'
        }
      ] : []
    };

    if (onAddNewCustomer) {
      onAddNewCustomer(newCust);
    } else {
      onUpdateCustomer(newCust);
    }

    setSelectedCustomer(newCust);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustMobile('');
    setNewCustBusiness('');
    setNewCustGst('');
    setNewCustAddress('');
  };

  // Edit Customer Submit
  const handleEditCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    onUpdateCustomer(editingCustomer);
    if (selectedCustomer?.id === editingCustomer.id) {
      setSelectedCustomer(editingCustomer);
    }
    setEditingCustomer(null);
  };

  // Confirm Delete Customer
  const handleConfirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    if (onDeleteCustomer) {
      onDeleteCustomer(customerToDelete.id);
    }
    if (selectedCustomer?.id === customerToDelete.id) {
      setSelectedCustomer(null);
    }
    setCustomerToDelete(null);
  };

  return (
    <div id="loyalty-rewards-view" className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Members</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Award className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{customers.length} Customers</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Mobile-linked loyalty profiles</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Circulating Points</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-900 font-bold">
              <Coins className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{totalPointsInCirculation.toLocaleString()} Pts</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Worth ₹{calculatePointsDiscount(totalPointsInCirculation, loyaltyConfig).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} in discounts
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gold VIPs ({loyaltyConfig.goldMultiplier || 1.5}x)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700 font-bold">
              🥇
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{goldCount} Members</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{loyaltyConfig.goldThreshold || 500}+ lifetime reward points</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platinum Elite ({loyaltyConfig.platinumMultiplier || 2.0}x)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700 font-bold">
              💎
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-purple-900">{platinumCount} Members</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{loyaltyConfig.platinumThreshold || 2000}+ lifetime points</p>
        </div>
      </div>

      {/* Dynamic Loyalty Rules & Valuation Formula Card */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 border border-amber-300 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-amber-800 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-900 text-sm">
                Active Loyalty Reward Rules &amp; Exchange Rates
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live Formula
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              Every purchase of <strong className="text-slate-900 font-mono font-bold">₹{loyaltyConfig.spendAmountForPoints}</strong> earns{' '}
              <strong className="text-amber-900 font-mono font-bold">{loyaltyConfig.pointsAwardedPerSpend} Points</strong>{' '}
              (Cash Value: <strong className="text-emerald-800 font-mono font-bold">₹{(loyaltyConfig.pointsAwardedPerSpend * loyaltyConfig.pointValueInRupees).toFixed(2)}</strong>) •{' '}
              Redemption Rate: <strong className="text-slate-900 font-mono font-bold">1 Point = ₹{loyaltyConfig.pointValueInRupees.toFixed(2)} Direct Cash Off</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          id="open-loyalty-rules-btn"
          onClick={() => setShowRulesModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-xs whitespace-nowrap transition-colors"
        >
          <Settings2 className="h-4 w-4" />
          <span>Configure Loyalty Rules &amp; ₹ Rates</span>
        </button>
      </div>

      {/* Tiers Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Silver */}
        <div className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                🥈
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Silver Member</h4>
                <p className="text-[10px] text-slate-500">Entry Tier (0 - {(loyaltyConfig.goldThreshold || 500) - 1} Pts)</p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {silverCount} Members
            </span>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span>Points Rate:</span>
              <span className="font-bold text-slate-800">
                {(loyaltyConfig.pointsAwardedPerSpend * (loyaltyConfig.silverMultiplier || 1)).toFixed(1)} Pts / ₹{loyaltyConfig.spendAmountForPoints} Spend
              </span>
            </div>
            <div className="flex justify-between">
              <span>Redemption:</span>
              <span className="font-semibold text-emerald-700">1 Pt = ₹{loyaltyConfig.pointValueInRupees.toFixed(2)} Direct Cash Off</span>
            </div>
          </div>
        </div>

        {/* Gold */}
        <div className="rounded-2xl bg-white border border-amber-200 p-3.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center font-bold text-amber-800">
                🥇
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-xs">Gold VIP Member</h4>
                <p className="text-[10px] text-amber-700">{loyaltyConfig.goldThreshold || 500}+ Lifetime Points</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              {goldCount} Members
            </span>
          </div>
          <div className="text-xs text-amber-900 bg-amber-50/70 p-2 rounded-xl border border-amber-200/60 space-y-1">
            <div className="flex justify-between">
              <span>Points Rate:</span>
              <span className="font-bold text-amber-900">
                {(loyaltyConfig.pointsAwardedPerSpend * (loyaltyConfig.goldMultiplier || 1.5)).toFixed(1)} Pts / ₹{loyaltyConfig.spendAmountForPoints} ({loyaltyConfig.goldMultiplier || 1.5}x)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Perks:</span>
              <span className="font-semibold text-amber-800">Special seasonal discounts</span>
            </div>
          </div>
        </div>

        {/* Platinum */}
        <div className="rounded-2xl bg-white border border-purple-200 p-3.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-purple-800">
                💎
              </div>
              <div>
                <h4 className="font-bold text-purple-950 text-xs">Platinum Elite</h4>
                <p className="text-[10px] text-purple-700">{loyaltyConfig.platinumThreshold || 2000}+ Lifetime Points</p>
              </div>
            </div>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
              {platinumCount} Members
            </span>
          </div>
          <div className="text-xs text-purple-900 bg-purple-50/70 p-2 rounded-xl border border-purple-200/60 space-y-1">
            <div className="flex justify-between">
              <span>Points Rate:</span>
              <span className="font-bold text-purple-900">
                {(loyaltyConfig.pointsAwardedPerSpend * (loyaltyConfig.platinumMultiplier || 2.0)).toFixed(1)} Pts / ₹{loyaltyConfig.spendAmountForPoints} ({loyaltyConfig.platinumMultiplier || 2.0}x)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Perks:</span>
              <span className="font-semibold text-purple-800">Free item claims + VIP Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customers List & Point Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Customer Directory */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-700" />
              <h3 className="font-bold text-slate-900 text-sm">
                Customer Loyalty &amp; Credit Profiles ({filteredCustomers.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Add Customer Button */}
              <button
                type="button"
                id="add-customer-btn"
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Customer</span>
              </button>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 text-xs">
                {['ALL', 'Silver', 'Gold', 'Platinum'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTier(t)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      selectedTier === t
                        ? 'bg-amber-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search member by mobile number, customer name, shop..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-amber-600 focus:outline-none"
            />
          </div>

          {/* Customer Table */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No customer found. Click "Add Customer" to create a new profile.
              </div>
            ) : (
              filteredCustomers.map(customer => {
                const tier = customer.loyaltyTier || 'Silver';
                const isSelected = selectedCustomer?.id === customer.id;

                return (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        tier === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                        tier === 'Gold' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tier === 'Platinum' ? '💎' : tier === 'Gold' ? '🥇' : '🥈'}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">{customer.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                            tier === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {tier}
                          </span>
                          <span className="text-[10px] bg-white border px-1 rounded font-bold text-slate-600">
                            {customer.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-semibold text-slate-700">{customer.mobileNumber}</span>
                          {customer.businessName && <span>• {customer.businessName}</span>}
                          {customer.outstandingCredit > 0 && (
                            <span className="text-rose-700 font-bold">• Due: ₹{customer.outstandingCredit}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                      <div className="text-left sm:text-right mr-1">
                        <span className="font-mono font-black text-amber-900 text-sm block">
                          {(customer.loyaltyPoints || 0).toLocaleString()} Pts
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Worth ₹{calculatePointsDiscount(customer.loyaltyPoints || 0, loyaltyConfig).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Off
                        </span>
                      </div>

                      {/* Edit Loyalty & Credit Profile */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLoyaltyCreditCustomer(customer);
                        }}
                        className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors"
                        title="Edit Loyalty Points, Credit Limits & Terms"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                      </button>

                      {/* Edit Customer Basic Info */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCustomer({ ...customer });
                        }}
                        className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Edit Customer Basic Info"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Customer Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomerToDelete(customer);
                        }}
                        className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Quick Bonus Points */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBonusCustomer(customer);
                        }}
                        className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                        title="Award Quick Bonus Points"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>

                      {onSelectCustomerForBill && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCustomerForBill(customer);
                          }}
                          className="rounded-lg bg-amber-700 hover:bg-amber-800 text-white px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap"
                        >
                          Start Bill
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Customer Details & Points Ledger */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-700" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Customer Details &amp; History
              </h4>
            </div>
            {selectedCustomer && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="edit-selected-loyalty-credit-btn"
                  onClick={() => setLoyaltyCreditCustomer(selectedCustomer)}
                  className="flex items-center gap-1 text-[11px] text-amber-850 bg-amber-100/70 px-2 py-0.5 rounded-md font-bold border border-amber-300 hover:bg-amber-100 transition-colors"
                  title="Edit Loyalty Points, Credit Limits & Terms"
                >
                  <CreditCard className="h-3 w-3 text-amber-800" />
                  <span>Loyalty &amp; Credit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCustomer({ ...selectedCustomer })}
                  className="flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>

          {selectedCustomer ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</h5>
                    <p className="text-xs text-slate-600 font-mono">{selectedCustomer.mobileNumber}</p>
                    {selectedCustomer.businessName && (
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        {selectedCustomer.businessName}
                      </p>
                    )}
                    {selectedCustomer.address && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{selectedCustomer.address}</p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedCustomer.loyaltyTier === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                    selectedCustomer.loyaltyTier === 'Gold' ? 'bg-amber-200 text-amber-900' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {selectedCustomer.loyaltyTier || 'Silver'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Points Balance</span>
                    <span className="font-mono font-bold text-base text-amber-950 block">
                      {(selectedCustomer.loyaltyPoints || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      = ₹{calculatePointsDiscount(selectedCustomer.loyaltyPoints || 0, loyaltyConfig).toFixed(2)} Off
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Outstanding Due</span>
                    <span className="font-mono font-bold text-base text-rose-700 block">
                      ₹{(selectedCustomer.outstandingCredit || 0).toLocaleString()}
                    </span>
                    {(selectedCustomer.advanceBalance || 0) > 0 && (
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        Adv: ₹{(selectedCustomer.advanceBalance || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Credit Terms:</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">
                      Limit: ₹{(selectedCustomer.creditLimit || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Term: {selectedCustomer.creditDaysAllowed || 7} Days • Status:{' '}
                      <span className={`font-bold ${
                        selectedCustomer.creditStatus === 'BLOCKED' ? 'text-rose-600' :
                        selectedCustomer.creditStatus === 'ON_HOLD' ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {selectedCustomer.creditStatus || 'ACTIVE'}
                      </span>
                    </span>
                  </div>
                </div>

                {selectedCustomer.creditNotes && (
                  <div className="pt-1.5 border-t border-amber-200/60 text-[11px] text-slate-600 italic">
                    Note: {selectedCustomer.creditNotes}
                  </div>
                )}
              </div>

              {/* History Ledger List */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reward Points Ledger
                </span>

                {(!selectedCustomer.loyaltyHistory || selectedCustomer.loyaltyHistory.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-2">No points transactions recorded yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {selectedCustomer.loyaltyHistory.map(entry => (
                      <div 
                        key={entry.id}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded font-bold text-[10px] ${
                            entry.type === 'EARNED' ? 'bg-emerald-100 text-emerald-800' :
                            entry.type === 'REDEEMED' ? 'bg-amber-100 text-amber-900' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {entry.type === 'EARNED' ? '+EARNED' :
                             entry.type === 'REDEEMED' ? '-REDEEM' : '+BONUS'}
                          </span>
                          <div>
                            <p className="font-medium text-slate-800 text-[11px]">{entry.description}</p>
                            <p className="text-[9px] text-slate-400">{new Date(entry.date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <span className={`font-mono font-bold ${
                          entry.type === 'REDEEMED' ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {entry.type === 'REDEEMED' ? '-' : '+'}{entry.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select any customer on the left to view their detailed points ledger and history.
            </div>
          )}
        </div>
      </div>

      {/* 1. Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Add New Customer</h3>
              </div>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100">
                <button
                  type="button"
                  onClick={() => setNewCustType('B2C')}
                  className={`py-1.5 rounded-lg font-bold text-xs ${
                    newCustType === 'B2C' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Retail Customer (B2C)
                </button>
                <button
                  type="button"
                  onClick={() => setNewCustType('B2B')}
                  className={`py-1.5 rounded-lg font-bold text-xs ${
                    newCustType === 'B2B' ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Wholesale / Shop (B2B)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Kumar"
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={newCustMobile}
                    onChange={e => setNewCustMobile(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              {newCustType === 'B2B' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Business / Shop Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Balaji Kirana Store"
                      value={newCustBusiness}
                      onChange={e => setNewCustBusiness(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                    <input
                      type="text"
                      placeholder="23AAAAA0000A1Z5"
                      value={newCustGst}
                      onChange={e => setNewCustGst(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Area</label>
                <input
                  type="text"
                  placeholder="e.g. Main Market, Near Clock Tower"
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCustCreditLimit}
                    onChange={e => setNewCustCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Due (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCustOpeningCredit}
                    onChange={e => setNewCustOpeningCredit(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono text-rose-700 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Signup Points</label>
                  <input
                    type="number"
                    min={0}
                    value={newCustInitialPoints}
                    onChange={e => setNewCustInitialPoints(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono text-amber-800 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Customer Profile</h3>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleEditCustomerSubmit} className="space-y-3 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name}
                    onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={editingCustomer.mobileNumber}
                    onChange={e => setEditingCustomer({ ...editingCustomer, mobileNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Type</label>
                  <select
                    value={editingCustomer.type}
                    onChange={e => setEditingCustomer({ ...editingCustomer, type: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 focus:border-amber-600 focus:outline-none"
                  >
                    <option value="B2C">Retail Customer (B2C)</option>
                    <option value="B2B">Wholesale Merchant (B2B)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loyalty Tier</label>
                  <select
                    value={editingCustomer.loyaltyTier || 'Silver'}
                    onChange={e => setEditingCustomer({ ...editingCustomer, loyaltyTier: e.target.value as LoyaltyTier })}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Silver">Silver (1.0x)</option>
                    <option value="Gold">Gold (1.5x)</option>
                    <option value="Platinum">Platinum (2.0x)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Business / Shop Name</label>
                <input
                  type="text"
                  value={editingCustomer.businessName || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, businessName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editingCustomer.address || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loyalty Points</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCustomer.loyaltyPoints || 0}
                    onChange={e => setEditingCustomer({ ...editingCustomer, loyaltyPoints: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono font-bold text-amber-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCustomer.creditLimit || 0}
                    onChange={e => setEditingCustomer({ ...editingCustomer, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Outstanding (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCustomer.outstandingCredit || 0}
                    onChange={e => setEditingCustomer({ ...editingCustomer, outstandingCredit: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono font-bold text-rose-700 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={editingCustomer.notes || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  placeholder="e.g. Prefers delivery on Tuesdays"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Delete Customer?</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to remove this customer profile?
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-semibold text-slate-800">
              {customerToDelete.name} ({customerToDelete.mobileNumber})
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustomer}
                className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Grant Bonus Points Modal */}
      {bonusCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Award Bonus Points</span>
              </h4>
              <button
                type="button"
                onClick={() => setBonusCustomer(null)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Awarding bonus loyalty points to <strong className="text-slate-900">{bonusCustomer.name}</strong> ({bonusCustomer.mobileNumber}).
            </div>

            <form onSubmit={handleGrantBonus} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bonus Points to Credit
                </label>
                <input
                  type="number"
                  min="1"
                  value={bonusPoints}
                  onChange={e => setBonusPoints(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono font-bold text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason / Occasion
                </label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={e => setBonusReason(e.target.value)}
                  placeholder="e.g. Festival gift, Customer appreciation"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBonusCustomer(null)}
                  className="flex-1 rounded-xl border border-slate-300 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-700 py-2 font-bold text-white hover:bg-amber-800 shadow-xs"
                >
                  Award Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Loyalty Program Rules & Rates Configuration Modal */}
      {showRulesModal && (
        <LoyaltyRulesModal
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
          onSave={handleSaveRules}
        />
      )}

      {/* 5. Customer Loyalty Points & Credit Profile Editor Modal */}
      {loyaltyCreditCustomer && (
        <CustomerLoyaltyCreditModal
          isOpen={!!loyaltyCreditCustomer}
          customer={loyaltyCreditCustomer}
          onClose={() => setLoyaltyCreditCustomer(null)}
          onSave={handleSaveCustomerLoyaltyCredit}
        />
      )}
    </div>
  );
};
