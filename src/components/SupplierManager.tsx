import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Plus, 
  Phone, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  PackageCheck, 
  Star, 
  AlertCircle,
  Truck,
  DollarSign,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  X,
  AlertTriangle
} from 'lucide-react';
import { Supplier, PurchaseOrder, Product, ProductCategory } from '../types';

interface SupplierManagerProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  onCreatePO: (po: PurchaseOrder) => void;
  onReceivePO: (poId: string) => void;
  onRecordSupplierPayment: (supplierId: string, amount: number, mode: string) => void;
  onAddSupplier?: (supplier: Supplier) => void;
  onUpdateSupplier?: (supplier: Supplier) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  onUpdatePO?: (po: PurchaseOrder) => void;
  onDeletePO?: (poId: string) => void;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({
  suppliers,
  purchaseOrders,
  products,
  onCreatePO,
  onReceivePO,
  onRecordSupplierPayment,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onUpdatePO,
  onDeletePO
}) => {
  const [activeTab, setActiveTab] = useState<'POS' | 'SUPPLIERS' | 'COST_TRENDS'>('POS');
  const [showCreatePoModal, setShowCreatePoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank_Transfer');

  // Supplier Add / Edit States
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // New Supplier Form State
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupMobile, setNewSupMobile] = useState('');
  const [newSupCategory, setNewSupCategory] = useState<Supplier['category']>('Grain Farmer');
  const [newSupAddress, setNewSupAddress] = useState('');
  const [newSupBalance, setNewSupBalance] = useState<number>(0);
  const [newSupRating, setNewSupRating] = useState<number>(5);

  // PO Edit State
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'SUPPLIER' | 'PO';
    id: string;
    name: string;
  } | null>(null);

  // New PO form state
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || '');
  const [poExpectedDelivery, setPoExpectedDelivery] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [poItemName, setPoItemName] = useState('Sharbati Wheat Grade-A (Milling Grain)');
  const [poItemCategory, setPoItemCategory] = useState<'Atta' | 'Besan' | 'Sattu' | 'Masale' | 'Raw Grain' | 'Packaging'>('Raw Grain');
  const [poQty, setPoQty] = useState<number>(1000);
  const [poUnit, setPoUnit] = useState('kg');
  const [poUnitCost, setPoUnitCost] = useState<number>(28);

  // Automated Restock alerts: Products below min stock
  const restockAlerts = products.filter(p => p.totalStock <= p.minStockThreshold);

  // Total pending payments across all suppliers
  const totalPendingSupplierDues = suppliers.reduce((s, sup) => s + sup.pendingBalance, 0);

  const handleCreatePurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === poSupplierId);
    if (!sup) return;

    const itemTotal = poQty * poUnitCost;
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(100 + Math.random() * 900)}`,
      supplierId: sup.id,
      supplierName: sup.name,
      date: new Date().toISOString().split('T')[0],
      expectedDelivery: poExpectedDelivery,
      status: 'Ordered',
      items: [
        {
          itemName: poItemName,
          category: poItemCategory,
          qty: poQty,
          unit: poUnit,
          unitCost: poUnitCost,
          total: itemTotal
        }
      ],
      totalAmount: itemTotal,
      paidAmount: 0,
      paymentStatus: 'Pending',
      paymentMethod: 'Bank_Transfer'
    };

    onCreatePO(newPO);
    setShowCreatePoModal(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return;
    onRecordSupplierPayment(selectedSupplierId, amt, paymentMode);
    setShowPaymentModal(false);
    setPaymentAmount('');
  };

  // Add Supplier Submit
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupName.trim(),
      contactPerson: newSupContact.trim() || newSupName.trim(),
      mobile: newSupMobile.trim(),
      category: newSupCategory,
      address: newSupAddress.trim(),
      pendingBalance: Number(newSupBalance) || 0,
      performanceRating: Number(newSupRating) || 5,
      costTrends: [
        {
          item: `${newSupCategory} Initial Rate`,
          date: new Date().toISOString().split('T')[0],
          pricePerUnit: 25
        }
      ]
    };

    if (onAddSupplier) {
      onAddSupplier(newSupplier);
    }
    setShowAddSupplierModal(false);
    setNewSupName('');
    setNewSupContact('');
    setNewSupMobile('');
    setNewSupAddress('');
    setNewSupBalance(0);
  };

  // Edit Supplier Submit
  const handleEditSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    if (onUpdateSupplier) {
      onUpdateSupplier(editingSupplier);
    }
    setEditingSupplier(null);
  };

  // Edit PO Submit
  const handleEditPOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPO) return;
    if (onUpdatePO) {
      onUpdatePO(editingPO);
    }
    setEditingPO(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'SUPPLIER' && onDeleteSupplier) {
      onDeleteSupplier(deleteTarget.id);
    } else if (deleteTarget.type === 'PO' && onDeletePO) {
      onDeletePO(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div id="supplier-manager" className="space-y-6">
      {/* Top Supplier Dues & Restock Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Suppliers</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{suppliers.length} Vendors</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Farmers, Mandi Traders &amp; Packaging</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Supplier Dues</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-700 font-bold">
              ₹
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-700">₹{totalPendingSupplierDues.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Outstanding Mandi / Vendor credit</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active POs</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Truck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {purchaseOrders.filter(p => p.status === 'Ordered').length} In-Transit
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting delivery &amp; Goods Receipt (GRN)</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock SKUs</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-800">{restockAlerts.length} Need Grain</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Below safety manufacturing threshold</p>
        </div>
      </div>

      {/* Navigation Tabs and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('POS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'POS'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SUPPLIERS'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Suppliers Directory ({suppliers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COST_TRENDS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'COST_TRENDS'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Mandi Cost Trends
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'SUPPLIERS' && (
            <button
              type="button"
              id="add-supplier-btn"
              onClick={() => setShowAddSupplierModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Supplier</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 shadow-2xs whitespace-nowrap"
          >
            <DollarSign className="h-4 w-4" />
            <span>Pay Supplier</span>
          </button>

          <button
            type="button"
            id="issue-po-btn"
            onClick={() => setShowCreatePoModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-800 shadow-xs whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Issue New PO</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'POS' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-800" />
              <h3 className="font-bold text-slate-900 text-sm">
                Purchase Order Pipeline &amp; Automated Goods Receipt (GRN)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Receiving a PO automatically creates an inward FIFO batch
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {purchaseOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No purchase orders created yet. Click "Issue New PO" to procure grains or packaging.
              </div>
            ) : (
              purchaseOrders.map(po => (
                <div key={po.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{po.poNumber}</span>
                        <span className="text-xs font-semibold text-slate-700">• {po.supplierName}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          po.status === 'Received' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : po.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {po.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Issued: <strong className="font-mono">{po.date}</strong></span>
                        <span>Expected: <strong className="font-mono">{po.expectedDelivery}</strong></span>
                        {po.notes && <span className="italic text-slate-400">"{po.notes}"</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-black font-mono text-slate-900 block">
                          ₹{po.totalAmount.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Paid: ₹{po.paidAmount.toLocaleString()} • Due: ₹{(po.totalAmount - po.paidAmount).toLocaleString()}
                        </span>
                      </div>

                      {po.status === 'Ordered' && (
                        <button
                          type="button"
                          onClick={() => onReceivePO(po.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs whitespace-nowrap"
                        >
                          <PackageCheck className="h-4 w-4" />
                          <span>Receive Goods (FIFO)</span>
                        </button>
                      )}

                      {/* Edit PO */}
                      <button
                        type="button"
                        onClick={() => setEditingPO({ ...po })}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit PO"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete PO */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({
                          type: 'PO',
                          id: po.id,
                          name: `PO #${po.poNumber} (${po.supplierName})`
                        })}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete PO"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* PO Item Details */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                    {po.items.map((it, idx) => (
                      <span key={idx} className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-medium">
                        • {it.itemName}: <strong>{it.qty} {it.unit}</strong> @ ₹{it.unitCost}/{it.unit} (₹{it.total})
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIER DIRECTORY & INVOICES */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{sup.name}</h4>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      {sup.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{sup.contactPerson} ({sup.mobile})</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{sup.address}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-500 justify-end text-xs font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{sup.performanceRating} / 5</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase mt-2 block">Pending Dues</span>
                  <span className="text-base font-black font-mono text-rose-700 block">
                    ₹{sup.pendingBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Edit Supplier Button */}
                  <button
                    type="button"
                    onClick={() => setEditingSupplier({ ...sup })}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-700 transition-colors"
                  >
                    <Edit2 className="h-3 w-3 text-blue-600" />
                    <span>Edit</span>
                  </button>

                  {/* Delete Supplier Button */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({
                      type: 'SUPPLIER',
                      id: sup.id,
                      name: `Supplier: ${sup.name}`
                    })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Supplier"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSupplierId(sup.id);
                      setShowPaymentModal(true);
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Pay Invoice
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPoSupplierId(sup.id);
                      setShowCreatePoModal(true);
                    }}
                    className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-800"
                  >
                    Order Goods
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: COST TRENDS ANALYTICS */}
      {activeTab === 'COST_TRENDS' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <TrendingUp className="h-5 w-5 text-amber-800" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Raw Material Cost Trends &amp; Price Volatility (लागत रुझान)
              </h3>
              <p className="text-[11px] text-slate-500">
                Track Mandi price changes for wheat, chana, and whole spices over time
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.flatMap(s => s.costTrends).map((trend, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{trend.item}</span>
                  <span className="font-mono text-[10px] text-slate-500">{trend.date}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-slate-500">Procured At:</span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    ₹{trend.pricePerUnit} / unit
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Supplier / Mandi Trader</h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Agro Traders"
                  value={newSupName}
                  onChange={e => setNewSupName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    value={newSupContact}
                    onChange={e => setNewSupContact(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={newSupMobile}
                    onChange={e => setNewSupMobile(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newSupCategory}
                  onChange={e => setNewSupCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 bg-white focus:border-amber-600 focus:outline-none"
                >
                  <option value="Grain Farmer">Grain Farmer (किसान)</option>
                  <option value="Chana Mandi Trader">Chana Mandi Trader (चना आढ़ती)</option>
                  <option value="Spice Mandi Broker">Spice Mandi Broker (मसाला ब्रोकर)</option>
                  <option value="Packaging Pouch Mfr">Packaging Pouch Mfr (पैकेजिंग निर्माता)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Mandi Location</label>
                <input
                  type="text"
                  placeholder="e.g. Shop 14, Krishi Upaj Mandi, MP"
                  value={newSupAddress}
                  onChange={e => setNewSupAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Pending Dues (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newSupBalance}
                    onChange={e => setNewSupBalance(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Performance Rating (1-5)</label>
                  <select
                    value={newSupRating}
                    onChange={e => setNewSupRating(parseInt(e.target.value) || 5)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 bg-white focus:border-amber-600 focus:outline-none"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                    <option value={3}>⭐⭐⭐ (3/5)</option>
                    <option value={2}>⭐⭐ (2/5)</option>
                    <option value={1}>⭐ (1/5)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Supplier Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Supplier Details</h3>
              </div>
              <button onClick={() => setEditingSupplier(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleEditSupplierSubmit} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Firm Name *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name}
                  onChange={e => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 font-semibold focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editingSupplier.contactPerson}
                    onChange={e => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={editingSupplier.mobile}
                    onChange={e => setEditingSupplier({ ...editingSupplier, mobile: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={editingSupplier.category}
                  onChange={e => setEditingSupplier({ ...editingSupplier, category: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 bg-white focus:border-amber-600 focus:outline-none"
                >
                  <option value="Grain Farmer">Grain Farmer (किसान)</option>
                  <option value="Chana Mandi Trader">Chana Mandi Trader (चना आढ़ती)</option>
                  <option value="Spice Mandi Broker">Spice Mandi Broker (मसाला ब्रोकर)</option>
                  <option value="Packaging Pouch Mfr">Packaging Pouch Mfr (पैकेजिंग निर्माता)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editingSupplier.address}
                  onChange={e => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pending Balance (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingSupplier.pendingBalance}
                    onChange={e => setEditingSupplier({ ...editingSupplier, pendingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono font-bold text-rose-700 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Performance Rating (1-5)</label>
                  <select
                    value={editingSupplier.performanceRating}
                    onChange={e => setEditingSupplier({ ...editingSupplier, performanceRating: parseInt(e.target.value) || 5 })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 bg-white focus:border-amber-600 focus:outline-none"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                    <option value={3}>⭐⭐⭐ (3/5)</option>
                    <option value={2}>⭐⭐ (2/5)</option>
                    <option value={1}>⭐ (1/5)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
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

      {/* 3. Edit Purchase Order Modal */}
      {editingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Purchase Order</h3>
                <p className="text-[11px] font-mono text-slate-500">{editingPO.poNumber} • {editingPO.supplierName}</p>
              </div>
              <button onClick={() => setEditingPO(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleEditPOSubmit} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editingPO.status}
                  onChange={e => setEditingPO({ ...editingPO, status: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 bg-white focus:border-amber-600 focus:outline-none"
                >
                  <option value="Ordered">Ordered (In-Transit)</option>
                  <option value="Received">Received (GRN Inwarded)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PO Date</label>
                  <input
                    type="date"
                    value={editingPO.date}
                    onChange={e => setEditingPO({ ...editingPO, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={editingPO.expectedDelivery}
                    onChange={e => setEditingPO({ ...editingPO, expectedDelivery: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingPO.totalAmount}
                    onChange={e => setEditingPO({ ...editingPO, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono font-bold focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingPO.paidAmount}
                    onChange={e => setEditingPO({ ...editingPO, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono font-bold text-emerald-800 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  value={editingPO.notes || ''}
                  onChange={e => setEditingPO({ ...editingPO, notes: e.target.value })}
                  placeholder="e.g. Deliver via Mandi gate #2, check moisture < 12%"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPO(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow-xs"
                >
                  Save PO Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Delete {deleteTarget.type === 'SUPPLIER' ? 'Supplier' : 'Purchase Order'}?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to remove this record?
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-semibold text-slate-800">
              {deleteTarget.name}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showCreatePoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Issue Purchase Order</h3>
              <button onClick={() => setShowCreatePoModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreatePurchaseOrder} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Supplier *</label>
                <select
                  value={poSupplierId}
                  onChange={e => setPoSupplierId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Item / Commodity Name *</label>
                <input
                  type="text"
                  required
                  value={poItemName}
                  onChange={e => setPoItemName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={poItemCategory}
                    onChange={e => setPoItemCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 bg-white focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Raw Grain">Raw Grain (गेहूं / चना)</option>
                    <option value="Packaging">Packaging Pouches / Bags</option>
                    <option value="Atta">Atta</option>
                    <option value="Besan">Besan</option>
                    <option value="Sattu">Sattu</option>
                    <option value="Masale">Masale</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    required
                    value={poExpectedDelivery}
                    onChange={e => setPoExpectedDelivery(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={poQty}
                    onChange={e => setPoQty(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono font-bold focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={poUnit}
                    onChange={e => setPoUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={poUnitCost}
                    onChange={e => setPoUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono font-bold focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200/80 flex justify-between items-center text-xs">
                <span className="font-bold text-amber-950">Total PO Value:</span>
                <span className="font-mono font-black text-sm text-amber-950">
                  ₹{(poQty * poUnitCost).toLocaleString()}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePoModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 shadow-xs"
                >
                  Generate PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Pay Supplier Pending Invoice</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - Due: ₹{s.pendingBalance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 20000"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 font-mono font-bold text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:border-amber-600 focus:outline-none"
                >
                  <option value="Bank_Transfer">NEFT / RTGS Bank Transfer</option>
                  <option value="Cash">Cash (Deducts from Cash Register)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
