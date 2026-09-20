import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  User, 
  Building2, 
  ShieldAlert, 
  Tag, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ShoppingBag,
  CreditCard,
  History,
  Trophy,
  Coins,
  Award,
  AlertTriangle,
  Wallet,
  Plus,
  Minus,
  Check,
  FileText
} from 'lucide-react';
import { Customer, Invoice } from '../types';

interface CustomerCaptureModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSelectCustomer: (customer: Customer, initialDueToAdd?: number, initialAdvanceToAdjust?: number) => void;
  customers: Customer[];
  onAddNewCustomer: (newCustomer: Customer) => void;
  invoices?: Invoice[];
}

export const CustomerCaptureModal: React.FC<CustomerCaptureModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  customers,
  onAddNewCustomer,
  invoices = []
}) => {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'B2C' | 'B2B'>('B2C');
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);

  // Due & Advance selection states
  const [dueToAdd, setDueToAdd] = useState<number>(0);
  const [advanceToAdjust, setAdvanceToAdjust] = useState<number>(0);

  // Live lookup whenever mobile changes
  useEffect(() => {
    const cleanNumber = mobile.replace(/\D/g, '');
    if (cleanNumber.length >= 6) {
      const found = customers.find(c => c.mobileNumber.includes(cleanNumber));
      setMatchedCustomer(found || null);
      if (found) {
        setName(found.name);
        setType(found.type);
        setBusinessName(found.businessName || '');
        setGstNumber(found.gstNumber || '');
        setAddress(found.address || '');
        setDueToAdd(0);
        setAdvanceToAdjust(0);
      }
    } else {
      setMatchedCustomer(null);
      setDueToAdd(0);
      setAdvanceToAdjust(0);
    }
  }, [mobile, customers]);

  // Keyboard shortcut listener for CustomerCaptureModal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
      } else if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        handleGuestBilling();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, '');

    if (!cleanMobile || cleanMobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number for billing and customer record.');
      return;
    }

    if (matchedCustomer) {
      onSelectCustomer(matchedCustomer, dueToAdd, advanceToAdjust);
      return;
    }

    // Create new customer with Welcome Loyalty Bonus
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      mobileNumber: cleanMobile,
      name: name.trim() || `Customer ${cleanMobile.slice(-4)}`,
      type,
      businessName: type === 'B2B' ? businessName.trim() : undefined,
      gstNumber: type === 'B2B' ? gstNumber.trim().toUpperCase() : undefined,
      address: address.trim() || undefined,
      creditLimit: type === 'B2B' ? 50000 : 0,
      outstandingCredit: 0,
      totalPurchases: 0,
      orderCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      notes: marketingConsent ? 'Subscribed to WhatsApp Marketing Offers' : undefined,
      loyaltyPoints: 50, // Welcome bonus points
      lifetimePoints: 50,
      loyaltyTier: 'Silver',
      loyaltyHistory: [
        {
          id: `log-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'BONUS',
          points: 50,
          description: 'Welcome bonus loyalty points for new mobile registration',
          balanceAfter: 50
        }
      ]
    };

    onAddNewCustomer(newCust);
    onSelectCustomer(newCust);
  };

  const handleGuestBilling = () => {
    const guestCustomer: Customer = {
      id: `guest-${Date.now()}`,
      mobileNumber: '0000000000',
      name: 'Counter Walk-in Retail Customer',
      type: 'B2C',
      creditLimit: 0,
      outstandingCredit: 0,
      totalPurchases: 0,
      orderCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      loyaltyPoints: 0,
      lifetimePoints: 0,
      loyaltyTier: 'Silver'
    };
    onSelectCustomer(guestCustomer);
  };

  return (
    <div id="customer-capture-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        id="customer-capture-card"
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-8"
      >
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-300/40 text-amber-200">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">ग्राहक मोबाइल नंबर (Customer Mobile Number)</h3>
                <span className="rounded-full bg-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-200 uppercase tracking-wider">
                  Mandatory For Billing
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Collect mobile number for digital billing, WhatsApp receipt, and marketing database
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mobile input with quick keypad hints */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              10-Digit Mobile Number / मोबाइल नंबर <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-semibold text-sm">
                +91
              </div>
              <input
                type="tel"
                id="customer-mobile-input"
                autoFocus
                maxLength={10}
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="9829012345"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-14 pr-12 text-lg font-bold tracking-wider text-slate-900 focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              />
              {matchedCustomer && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              )}
            </div>

            {/* Quick Demo Customer Selection Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] font-semibold text-slate-500">Quick Test Customer:</span>
              {customers.slice(0, 4).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setMobile(c.mobileNumber)}
                  className="rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 text-[11px] font-mono transition-colors"
                >
                  {c.name.split(' ')[0]} ({c.mobileNumber.slice(-4)})
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Used for repeat customer recognition, loyalty points accrual, 7-day credit check, and WhatsApp invoices.
            </p>
          </div>

          {/* If existing customer recognized */}
          {matchedCustomer ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 transition-all space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{matchedCustomer.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      matchedCustomer.type === 'B2B' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {matchedCustomer.type === 'B2B' ? 'Wholesale (B2B)' : 'Retail (B2C)'}
                    </span>
                  </div>
                  {matchedCustomer.businessName && (
                    <p className="text-xs font-medium text-slate-700 mt-0.5 flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      {matchedCustomer.businessName}
                    </p>
                  )}
                  {matchedCustomer.gstNumber && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      GSTIN: <span className="font-mono">{matchedCustomer.gstNumber}</span>
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Past Orders</span>
                  <span className="text-sm font-bold text-slate-800">{matchedCustomer.orderCount} Orders</span>
                </div>
              </div>

              {/* Customer Loyalty Points Display Banner */}
              <div className="rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/10 border border-amber-300/80 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                        अन्नपूर्णा लॉयल्टी अंक (Loyalty Points)
                      </span>
                      <span className="bg-amber-200/80 text-amber-900 font-bold text-[10px] px-2 py-0.2 rounded-full border border-amber-300">
                        {matchedCustomer.loyaltyTier || 'Silver'} Member
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/90 font-medium">
                      Available to redeem for instant bill discount (₹1 per point)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-amber-950 font-mono flex items-center justify-end gap-1">
                    <Coins className="h-4 w-4 text-amber-700" />
                    {matchedCustomer.loyaltyPoints || 0} Pts
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 block">
                    Worth ₹{matchedCustomer.loyaltyPoints || 0} Off
                  </span>
                </div>
              </div>

              {/* Previous Bill Due or Advance Balance Detected Alert */}
              {((matchedCustomer.outstandingCredit || 0) > 0 || (matchedCustomer.advanceBalance || 0) > 0) && (
                <div className="space-y-2 pt-2 border-t border-emerald-200/60">
                  {/* Previous Bill Due Option */}
                  {(matchedCustomer.outstandingCredit || 0) > 0 && (
                    <div className={`p-3 rounded-xl border transition-all ${
                      dueToAdd > 0 ? 'bg-rose-50 border-rose-400' : 'bg-amber-50/60 border-amber-300'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-600" />
                          <div>
                            <span className="text-xs font-bold text-rose-950 block">
                              Previous Bill Due (पिछला बकाया): ₹{matchedCustomer.outstandingCredit.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {invoices.filter(i => i.customerMobile === matchedCustomer.mobileNumber && i.paymentStatus === 'Pending_Credit').length} pending credit invoice(s)
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-black font-mono text-rose-700">
                          ₹{matchedCustomer.outstandingCredit.toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <span className="text-[11px] text-slate-600 font-medium">Add to this bill?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDueToAdd(matchedCustomer.outstandingCredit)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                              dueToAdd > 0
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
                            }`}
                          >
                            {dueToAdd > 0 ? `✓ Added ₹${dueToAdd}` : '+ Add Full Due'}
                          </button>
                          {dueToAdd > 0 && (
                            <button
                              type="button"
                              onClick={() => setDueToAdd(0)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100"
                            >
                              Ignore (हटाएं)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Advance Payment Option */}
                  {(matchedCustomer.advanceBalance || 0) > 0 && (
                    <div className={`p-3 rounded-xl border transition-all ${
                      advanceToAdjust > 0 ? 'bg-emerald-50 border-emerald-400' : 'bg-teal-50/60 border-teal-300'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-emerald-600" />
                          <div>
                            <span className="text-xs font-bold text-emerald-950 block">
                              Advance Payment Available (अग्रिम राशि): ₹{(matchedCustomer.advanceBalance || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Prepaid balance deposited in customer account
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-black font-mono text-emerald-700">
                          ₹{(matchedCustomer.advanceBalance || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <span className="text-[11px] text-slate-600 font-medium">Deduct from this bill?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAdvanceToAdjust(matchedCustomer.advanceBalance || 0)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                              advanceToAdjust > 0
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'
                            }`}
                          >
                            {advanceToAdjust > 0 ? `✓ Deduct ₹${advanceToAdjust}` : '- Deduct Advance'}
                          </button>
                          {advanceToAdjust > 0 && (
                            <button
                              type="button"
                              onClick={() => setAdvanceToAdjust(0)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100"
                            >
                              Keep Safe (सुरक्षित रखें)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Outstanding Credit Check for B2B */}
              {matchedCustomer.type === 'B2B' && (
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <CreditCard className="h-4 w-4 text-blue-700" />
                    7-Day Credit Limit: ₹{matchedCustomer.creditLimit.toLocaleString()}
                  </span>
                  <span className={`font-bold ${
                    matchedCustomer.outstandingCredit > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {matchedCustomer.outstandingCredit > 0 
                      ? `Total Due: ₹${matchedCustomer.outstandingCredit.toLocaleString()}`
                      : 'Zero Outstanding Credit'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* New Customer registration fields */
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Customer Type / ग्राहक प्रकार
                </span>
                <span className="text-xs text-amber-700 font-medium">New Customer</span>
              </div>

              {/* B2C vs B2B Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="type-b2c-btn"
                  onClick={() => setType('B2C')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    type === 'B2C'
                      ? 'border-amber-600 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingBag className="h-5 w-5 mb-1 text-amber-700" />
                  <span className="text-sm font-semibold">Retail (B2C)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Daily consumer rates / Cash &amp; UPI</span>
                </button>

                <button
                  type="button"
                  id="type-b2b-btn"
                  onClick={() => setType('B2B')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    type === 'B2B'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="h-5 w-5 mb-1 text-blue-700" />
                  <span className="text-sm font-semibold">Wholesale (B2B)</span>
                  <span className="text-[10px] text-blue-600 font-normal">Bulk rates + 7-Day Credit Option</span>
                </button>
              </div>

              {/* Name field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Full Name / नाम
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={type === 'B2B' ? 'e.g. Radheshyam Ji' : 'e.g. Rajesh Sharma'}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-amber-600 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* B2B Specific Fields */}
              {type === 'B2B' && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business / Shop / Caterer Name <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        placeholder="e.g. Radhey Sweets, Gupta Kirana Store"
                        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        GSTIN Number (Optional)
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        value={gstNumber}
                        onChange={e => setGstNumber(e.target.value.toUpperCase())}
                        placeholder="08AAAAA0000A1Z5"
                        className="w-full uppercase font-mono rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        7-Day Credit Limit
                      </label>
                      <div className="rounded-lg border border-slate-300 bg-slate-100 py-2 px-3 text-xs font-bold text-slate-800">
                        ₹50,000 (Default)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Marketing consent check */}
              <div className="pt-2 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="marketing-consent-cb"
                  checked={marketingConsent}
                  onChange={e => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-500"
                />
                <label htmlFor="marketing-consent-cb" className="text-xs text-slate-600 cursor-pointer">
                  Collect for Marketing: Send WhatsApp bill, seasonal wheat harvesting updates, Diwali/festive flour rates.
                </label>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              id="start-billing-btn"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-700 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:bg-amber-800 active:scale-[0.99] transition-all"
            >
              <span>बिलिंग शुरू करें (Start Billing)</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              id="walkin-guest-btn"
              onClick={handleGuestBilling}
              className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline transition-colors"
            >
              Skip / Quick Walk-in Retail Cash Sale (No Mobile)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
