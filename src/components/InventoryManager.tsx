import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Search, 
  Tag, 
  Filter, 
  ShieldAlert, 
  Clock, 
  ArrowDownCircle, 
  Building,
  Edit2,
  Trash2,
  X,
  Check,
  Package,
  Barcode,
  Sparkles
} from 'lucide-react';
import { Product, FifoBatch, InventoryAlert, ProductCategory } from '../types';
import { calculateInventoryAlerts } from '../utils/storage';
import { updateBatchInProduct, deleteBatchFromProduct, addBatchToProduct } from '../utils/fifoEngine';

interface InventoryManagerProps {
  products: Product[];
  onAddBatch: (productId: string, batch: FifoBatch) => void;
  onUpdateBatch?: (productId: string, batchId: string, updatedBatch: FifoBatch) => void;
  onDeleteBatch?: (productId: string, batchId: string) => void;
  onUpdateProduct: (updated: Product) => void;
  onAddProduct?: (newProduct: Product) => void;
  onDeleteProduct?: (productId: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onAddBatch,
  onUpdateBatch,
  onDeleteBatch,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Batch Modal State
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [targetProductId, setTargetProductId] = useState<string>(products[0]?.id || '');
  const [batchIdInput, setBatchIdInput] = useState('');
  const [mfgDateInput, setMfgDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDateInput, setExpiryDateInput] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [inwardQtyInput, setInwardQtyInput] = useState<number>(50);
  const [unitCostInput, setUnitCostInput] = useState<number>(300);
  const [supplierNameInput, setSupplierNameInput] = useState('In-House Mill Production');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Add New Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdHindi, setNewProdHindi] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('Atta');
  const [newProdPackSize, setNewProdPackSize] = useState('5 kg');
  const [newProdUnit, setNewProdUnit] = useState<'kg' | 'packet' | 'bag'>('bag');
  const [newProdRetail, setNewProdRetail] = useState<number>(260);
  const [newProdWholesale, setNewProdWholesale] = useState<number>(230);
  const [newProdGst, setNewProdGst] = useState<number>(5);
  const [newProdHsn, setNewProdHsn] = useState('11010000');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdMinStock, setNewProdMinStock] = useState<number>(10);
  const [initialBatchQty, setInitialBatchQty] = useState<number>(50);
  const [initialBatchCost, setInitialBatchCost] = useState<number>(180);

  // Edit Batch Modal State
  const [editingBatchData, setEditingBatchData] = useState<{
    productId: string;
    productName: string;
    originalBatchId: string;
    batch: FifoBatch;
  } | null>(null);

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'PRODUCT' | 'BATCH';
    productId: string;
    batchId?: string;
    title: string;
  } | null>(null);

  // Real-time alerts
  const inventoryAlerts = calculateInventoryAlerts(products);

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = 
      !q || 
      p.name.toLowerCase().includes(q) || 
      p.hindiName.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Calculate total stock valuation
  const totalValuation = products.reduce((acc, p) => {
    const cost = p.batches.reduce((bSum, b) => bSum + (b.availableQty * b.unitCost), 0);
    return acc + cost;
  }, 0);

  const totalUnitsInStock = products.reduce((acc, p) => acc + p.totalStock, 0);

  // Create Inward Batch
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductId) return;

    const generatedBatchId = batchIdInput.trim() || `BATCH-${Date.now().toString().slice(-6)}`;
    const newBatch: FifoBatch = {
      batchId: generatedBatchId,
      mfgDate: mfgDateInput,
      expiryDate: expiryDateInput,
      inwardQty: inwardQtyInput,
      availableQty: inwardQtyInput,
      unitCost: unitCostInput,
      supplierName: supplierNameInput
    };

    onAddBatch(targetProductId, newBatch);
    setShowAddBatchModal(false);
    setBatchIdInput('');
  };

  // Save Edited Product
  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    setEditingProduct(null);
  };

  // Save New Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const newId = `prod-${Date.now()}`;
    const generatedSku = newProdSku.trim() || `${newProdCategory.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const generatedBarcode = newProdBarcode.trim() || `890${Date.now().toString().slice(-10)}`;

    const initialBatches: FifoBatch[] = [];
    if (initialBatchQty > 0) {
      initialBatches.push({
        batchId: `BATCH-INIT-${Date.now().toString().slice(-4)}`,
        mfgDate: new Date().toISOString().split('T')[0],
        expiryDate: (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + 4);
          return d.toISOString().split('T')[0];
        })(),
        inwardQty: initialBatchQty,
        availableQty: initialBatchQty,
        unitCost: initialBatchCost,
        supplierName: 'Initial Stock Inward'
      });
    }

    const createdProduct: Product = {
      id: newId,
      name: newProdName.trim(),
      hindiName: newProdHindi.trim() || newProdName.trim(),
      category: newProdCategory,
      packSize: newProdPackSize.trim(),
      unit: newProdUnit,
      retailPrice: Number(newProdRetail),
      wholesalePrice: Number(newProdWholesale),
      gstRate: Number(newProdGst),
      hsnCode: newProdHsn.trim(),
      sku: generatedSku,
      barcode: generatedBarcode,
      minStockThreshold: Number(newProdMinStock),
      batches: initialBatches,
      totalStock: initialBatchQty
    };

    if (onAddProduct) {
      onAddProduct(createdProduct);
    } else {
      onUpdateProduct(createdProduct);
    }

    setShowAddProductModal(false);
    // Reset form
    setNewProdName('');
    setNewProdHindi('');
    setNewProdSku('');
    setNewProdBarcode('');
  };

  // Save Edited Batch
  const handleSaveBatchEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatchData) return;

    const { productId, originalBatchId, batch } = editingBatchData;
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    if (onUpdateBatch) {
      onUpdateBatch(productId, originalBatchId, batch);
    } else {
      const updatedProd = updateBatchInProduct(targetProduct, originalBatchId, batch);
      onUpdateProduct(updatedProd);
    }
    setEditingBatchData(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'PRODUCT') {
      if (onDeleteProduct) {
        onDeleteProduct(itemToDelete.productId);
      }
    } else if (itemToDelete.type === 'BATCH' && itemToDelete.batchId) {
      if (onDeleteBatch) {
        onDeleteBatch(itemToDelete.productId, itemToDelete.batchId);
      } else {
        const targetProduct = products.find(p => p.id === itemToDelete.productId);
        if (targetProduct) {
          const updatedProd = deleteBatchFromProduct(targetProduct, itemToDelete.batchId);
          onUpdateProduct(updatedProd);
        }
      }
    }
    setItemToDelete(null);
  };

  return (
    <div id="inventory-manager" className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total SKUs</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{products.length} Products</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Atta, Besan, Sattu &amp; Masale</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Physical Stock Count</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalUnitsInStock} Units</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all active FIFO batches</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">FIFO Stock Value (Cost)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold">
              ₹
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">₹{totalValuation.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Calculated from batch cost prices</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Alerts</span>
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              inventoryAlerts.length > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{inventoryAlerts.length} Alerts</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Low inventory or near-expiry batches</p>
        </div>
      </div>

      {/* Real-time Inventory Alerts Notification Panel */}
      {inventoryAlerts.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-rose-700" />
            <h4 className="font-bold text-rose-950 text-xs uppercase tracking-wider">
              Critical Inventory Alerts ({inventoryAlerts.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {inventoryAlerts.map(alert => (
              <div 
                key={alert.id}
                className="flex items-start gap-2.5 rounded-xl bg-white p-2.5 border border-rose-200 shadow-2xs text-xs"
              >
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 leading-tight">
                    {alert.productName} ({alert.hindiName})
                  </p>
                  {alert.type === 'LOW_STOCK' && (
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Low Stock: <strong>{alert.currentStock} left</strong> (Min threshold is {alert.threshold})
                    </p>
                  )}
                  {alert.type === 'NEAR_EXPIRY' && (
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Batch {alert.batchId} expires in <strong>{alert.daysLeft} days</strong> ({alert.currentStock} units)
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'Atta', 'Besan', 'Sattu', 'Masale'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Products' : cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, barcode..."
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* Add New Product Button */}
          <button
            type="button"
            id="add-product-btn"
            onClick={() => setShowAddProductModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>

          {/* Add Batch Button */}
          <button
            type="button"
            id="add-batch-btn"
            onClick={() => setShowAddBatchModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-800 shadow-xs whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Inward Batch</span>
          </button>
        </div>
      </div>

      {/* Products Table with Detailed FIFO Batches View & Edit Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-800" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                FIFO Stock Inventory &amp; Batch Traceability (पहले आया, पहले बिका)
              </h3>
              <p className="text-[11px] text-slate-500">
                Click "Edit Product" to change prices, barcode, or stock limits. Click any batch to edit its cost, quantity, or dates.
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            {filteredProducts.length} items shown
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No products match your search or filter</p>
              <button
                onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
                className="mt-3 text-xs text-amber-700 font-bold hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredProducts.map(prod => {
              const isLowStock = prod.totalStock <= prod.minStockThreshold;
              const isOutOfStock = prod.totalStock <= 0;
              return (
              <div 
                key={prod.id} 
                className={`p-4 transition-colors ${
                  isOutOfStock
                    ? 'bg-rose-50/70 border-l-4 border-l-rose-700'
                    : isLowStock
                    ? 'bg-rose-50/40 border-l-4 border-l-rose-500 hover:bg-rose-50/60'
                    : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Urgent Animated Alert Badge if item reached minStockThreshold */}
                {isLowStock && (
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-xs animate-pulse">
                      <AlertTriangle className="h-3 w-3 animate-bounce shrink-0" />
                      <span>
                        {isOutOfStock
                          ? 'OUT OF STOCK (0 UNITS LEFT)'
                          : `MIN STOCK THRESHOLD REACHED (${prod.totalStock} / Min Limit: ${prod.minStockThreshold} ${prod.unit}s)`}
                      </span>
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 font-mono">
                      Restock / GRN PO Required
                    </span>
                  </div>
                )}

                {/* Product Summary Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{prod.name}</span>
                      <span className="text-xs text-amber-800 font-medium">({prod.hindiName})</span>
                      <span className="rounded bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
                        {prod.category}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-700 font-semibold">
                        {prod.packSize}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>SKU: <strong className="font-mono text-slate-800">{prod.sku}</strong></span>
                      {prod.barcode && (
                        <span className="flex items-center gap-1 font-mono">
                          <Barcode className="h-3.5 w-3.5 text-slate-400" />
                          {prod.barcode}
                        </span>
                      )}
                      <span>Retail: <strong className="font-mono text-slate-900 font-bold">₹{prod.retailPrice}</strong></span>
                      <span>Wholesale: <strong className="font-mono text-blue-900 font-bold">₹{prod.wholesalePrice}</strong></span>
                      <span>GST: <strong className="font-mono text-slate-700">{prod.gstRate}%</strong></span>
                      <span className={isLowStock ? 'text-rose-700 font-bold' : ''}>
                        Min Threshold: <strong className="font-mono">{prod.minStockThreshold}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end lg:self-auto">
                    {/* Stock status indicator */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Available</span>
                      <span className={`text-base font-black font-mono block ${
                        isOutOfStock
                          ? 'text-rose-700 animate-pulse'
                          : isLowStock
                          ? 'text-rose-600 animate-pulse'
                          : 'text-slate-900'
                      }`}>
                        {prod.totalStock} {prod.unit}s
                      </span>
                      {isLowStock && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300 animate-bounce">
                          <AlertTriangle className="h-2 w-2" />
                          <span>≤ Threshold</span>
                        </span>
                      )}
                    </div>

                    {/* Edit Product Button */}
                    <button
                      type="button"
                      id={`edit-prod-${prod.id}`}
                      onClick={() => setEditingProduct({ ...prod })}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs transition-colors"
                      title="Edit Product Details & Prices"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                      <span>Edit</span>
                    </button>

                    {/* Add Batch to this Product */}
                    <button
                      type="button"
                      onClick={() => {
                        setTargetProductId(prod.id);
                        setShowAddBatchModal(true);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 shadow-2xs transition-colors"
                      title="Add Inward FIFO Batch"
                    >
                      <Plus className="h-3.5 w-3.5 text-amber-700" />
                      <span>New Batch</span>
                    </button>

                    {/* Delete Product */}
                    <button
                      type="button"
                      onClick={() => setItemToDelete({
                        type: 'PRODUCT',
                        productId: prod.id,
                        title: `Product: ${prod.name} (${prod.packSize})`
                      })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* FIFO Batches breakdown with individual edit & delete buttons */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active FIFO Batches (Sorted Oldest to Newest)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {prod.batches.length} batch{prod.batches.length === 1 ? '' : 'es'} in queue
                    </span>
                  </div>

                  {prod.batches.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">No batches in stock. Click "New Batch" to inward stock.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {prod.batches.map((batch, bIdx) => (
                        <div 
                          key={batch.batchId}
                          className={`rounded-xl p-2.5 border text-xs relative group ${
                            batch.availableQty === 0
                              ? 'bg-slate-50 border-slate-200 text-slate-400'
                              : bIdx === 0
                              ? 'bg-amber-50/70 border-amber-200 text-amber-950 ring-1 ring-amber-500/20'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900">{batch.batchId}</span>
                            <div className="flex items-center gap-1">
                              {bIdx === 0 && batch.availableQty > 0 && (
                                <span className="rounded bg-amber-200 text-amber-900 px-1.5 py-0.2 text-[9px] font-bold uppercase">
                                  1st in FIFO
                                </span>
                              )}
                              
                              {/* Edit Batch Button */}
                              <button
                                type="button"
                                onClick={() => setEditingBatchData({
                                  productId: prod.id,
                                  productName: prod.name,
                                  originalBatchId: batch.batchId,
                                  batch: { ...batch }
                                })}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit this Batch"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>

                              {/* Delete Batch Button */}
                              <button
                                type="button"
                                onClick={() => setItemToDelete({
                                  type: 'BATCH',
                                  productId: prod.id,
                                  batchId: batch.batchId,
                                  title: `Batch: ${batch.batchId} from ${prod.name}`
                                })}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete this Batch"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-1 space-y-0.5 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Mfg Date:</span>
                              <span className="font-mono">{batch.mfgDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Expiry Date:</span>
                              <span className="font-mono">{batch.expiryDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Cost Price (CP):</span>
                              <span className="font-mono font-bold text-emerald-800">₹{batch.unitCost}</span>
                            </div>
                            {batch.supplierName && (
                              <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Source:</span>
                                <span className="truncate max-w-[120px]">{batch.supplierName}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t border-slate-100 font-semibold">
                              <span>Available:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {batch.availableQty} / {batch.inwardQty} {prod.unit}s
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* 1. Add Batch Modal */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Add Manufactured / Inward FIFO Batch
              </h3>
              <button 
                onClick={() => setShowAddBatchModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={targetProductId}
                  onChange={e => setTargetProductId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 font-medium focus:border-amber-600 focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.packSize})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Batch Number / लॉट संख्या</label>
                <input
                  type="text"
                  value={batchIdInput}
                  onChange={e => setBatchIdInput(e.target.value)}
                  placeholder={`e.g. BATCH-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-01`}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mfg Date (निर्माण)</label>
                  <input
                    type="date"
                    value={mfgDateInput}
                    onChange={e => setMfgDateInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date (समाप्ति)</label>
                  <input
                    type="date"
                    value={expiryDateInput}
                    onChange={e => setExpiryDateInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inward Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={inwardQtyInput}
                    onChange={e => setInwardQtyInput(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Cost (CP ₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={unitCostInput}
                    onChange={e => setUnitCostInput(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Source / Supplier / Production Line</label>
                <input
                  type="text"
                  value={supplierNameInput}
                  onChange={e => setSupplierNameInput(e.target.value)}
                  placeholder="e.g. Chakki Line #1, Mandi Procurement"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 shadow-xs"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Edit Product (उत्पाद संपादित करें)
                </h3>
              </div>
              <button 
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-3.5 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-semibold focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hindi Name (हिंदी नाम) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.hindiName}
                    onChange={e => setEditingProduct({ ...editingProduct, hindiName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-semibold focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Atta">Atta (आटा)</option>
                    <option value="Besan">Besan (बेसन)</option>
                    <option value="Sattu">Sattu (सत्तू)</option>
                    <option value="Masale">Masale (मसाले)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pack Size</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.packSize}
                    onChange={e => setEditingProduct({ ...editingProduct, packSize: e.target.value })}
                    placeholder="e.g. 500g, 1kg, 5kg"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={editingProduct.unit}
                    onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="bag">bag</option>
                    <option value="packet">packet</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Retail Price (B2C ₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingProduct.retailPrice}
                    onChange={e => setEditingProduct({ ...editingProduct, retailPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wholesale (B2B ₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingProduct.wholesalePrice}
                    onChange={e => setEditingProduct({ ...editingProduct, wholesalePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold text-blue-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={editingProduct.gstRate}
                    onChange={e => setEditingProduct({ ...editingProduct, gstRate: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value={0}>0% (Loose/Exempt)</option>
                    <option value={5}>5% (Packaged Grain/Flour)</option>
                    <option value={12}>12% (Processed Spice)</option>
                    <option value={18}>18% (Standard)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={editingProduct.sku}
                    onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barcode (EAN/Code 128)</label>
                  <input
                    type="text"
                    value={editingProduct.barcode}
                    onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Stock Threshold</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.minStockThreshold}
                    onChange={e => setEditingProduct({ ...editingProduct, minStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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

      {/* 3. Add New Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">
                  Add New Product to Catalog (नया उत्पाद जोड़ें)
                </h3>
              </div>
              <button 
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Name (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharbati MP Whole Wheat Atta"
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-semibold focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hindi Name (हिंदी नाम)</label>
                  <input
                    type="text"
                    placeholder="e.g. शरबती आटा"
                    value={newProdHindi}
                    onChange={e => setNewProdHindi(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-semibold focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value as ProductCategory)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Atta">Atta (आटा)</option>
                    <option value="Besan">Besan (बेसन)</option>
                    <option value="Sattu">Sattu (सत्तू)</option>
                    <option value="Masale">Masale (मसाले)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pack Size</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10 kg, 5 kg, 500g"
                    value={newProdPackSize}
                    onChange={e => setNewProdPackSize(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={newProdUnit}
                    onChange={e => setNewProdUnit(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="bag">bag</option>
                    <option value="packet">packet</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Retail Price (B2C ₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newProdRetail}
                    onChange={e => setNewProdRetail(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wholesale (B2B ₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newProdWholesale}
                    onChange={e => setNewProdWholesale(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold text-blue-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={newProdGst}
                    onChange={e => setNewProdGst(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value={0}>0% (Loose/Exempt)</option>
                    <option value={5}>5% (Packaged Flour/Spices)</option>
                    <option value={12}>12% (Processed)</option>
                    <option value={18}>18% (Standard)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU (Auto if blank)</label>
                  <input
                    type="text"
                    placeholder="e.g. ATTA-MP-10"
                    value={newProdSku}
                    onChange={e => setNewProdSku(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barcode (Auto if blank)</label>
                  <input
                    type="text"
                    placeholder="e.g. 8901234001015"
                    value={newProdBarcode}
                    onChange={e => setNewProdBarcode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min={0}
                    value={newProdMinStock}
                    onChange={e => setNewProdMinStock(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Initial opening batch */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="block font-bold text-slate-800 mb-2">Initial Opening Stock Inward</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Opening Quantity ({newProdUnit}s)</label>
                    <input
                      type="number"
                      min={0}
                      value={initialBatchQty}
                      onChange={e => setInitialBatchQty(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Unit Cost Price (₹ CP)</label>
                    <input
                      type="number"
                      min={0}
                      value={initialBatchCost}
                      onChange={e => setInitialBatchCost(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Batch Modal */}
      {editingBatchData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Edit FIFO Batch
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingBatchData.productName}
                </p>
              </div>
              <button 
                onClick={() => setEditingBatchData(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchEdit} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Batch Number / ID *</label>
                <input
                  type="text"
                  required
                  value={editingBatchData.batch.batchId}
                  onChange={e => setEditingBatchData({
                    ...editingBatchData,
                    batch: { ...editingBatchData.batch, batchId: e.target.value }
                  })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available Qty (Current)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingBatchData.batch.availableQty}
                    onChange={e => setEditingBatchData({
                      ...editingBatchData,
                      batch: { ...editingBatchData.batch, availableQty: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inward Qty (Total)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingBatchData.batch.inwardQty}
                    onChange={e => setEditingBatchData({
                      ...editingBatchData,
                      batch: { ...editingBatchData.batch, inwardQty: parseInt(e.target.value) || 1 }
                    })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mfg Date (निर्माण)</label>
                  <input
                    type="date"
                    required
                    value={editingBatchData.batch.mfgDate}
                    onChange={e => setEditingBatchData({
                      ...editingBatchData,
                      batch: { ...editingBatchData.batch, mfgDate: e.target.value }
                    })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date (समाप्ति)</label>
                  <input
                    type="date"
                    required
                    value={editingBatchData.batch.expiryDate}
                    onChange={e => setEditingBatchData({
                      ...editingBatchData,
                      batch: { ...editingBatchData.batch, expiryDate: e.target.value }
                    })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Cost (CP ₹) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={editingBatchData.batch.unitCost}
                  onChange={e => setEditingBatchData({
                    ...editingBatchData,
                    batch: { ...editingBatchData.batch, unitCost: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs font-mono font-bold text-emerald-800 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier / Production Source</label>
                <input
                  type="text"
                  value={editingBatchData.batch.supplierName || ''}
                  onChange={e => setEditingBatchData({
                    ...editingBatchData,
                    batch: { ...editingBatchData.batch, supplierName: e.target.value }
                  })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBatchData(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 shadow-xs"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Delete {itemToDelete.type === 'PRODUCT' ? 'Product' : 'Batch'}?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-semibold text-slate-800">
              {itemToDelete.title}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
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
    </div>
  );
};
