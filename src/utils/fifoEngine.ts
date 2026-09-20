import { Product, FifoBatch, FifoAllocation } from '../types';

/**
 * Deducts stock from a product using First-In-First-Out (FIFO) batch allocation.
 * Older manufacturing/procurement batches are exhausted before newer ones are touched.
 */
export function allocateFifoStock(
  product: Product,
  requiredQty: number
): {
  updatedProduct: Product;
  allocations: FifoAllocation[];
  unfulfilledQty: number;
} {
  // Sort batches ascending by mfgDate (oldest first)
  const sortedBatches: FifoBatch[] = [...product.batches].sort((a, b) => 
    new Date(a.mfgDate).getTime() - new Date(b.mfgDate).getTime()
  );

  let remainingToFulfill = requiredQty;
  const allocations: FifoAllocation[] = [];

  const updatedBatches = sortedBatches.map(batch => {
    if (remainingToFulfill <= 0 || batch.availableQty <= 0) {
      return { ...batch };
    }

    if (batch.availableQty >= remainingToFulfill) {
      allocations.push({
        batchId: batch.batchId,
        qty: remainingToFulfill,
        unitCost: batch.unitCost
      });
      const newAvailable = batch.availableQty - remainingToFulfill;
      remainingToFulfill = 0;
      return { ...batch, availableQty: newAvailable };
    } else {
      // Consume whole batch
      const taken = batch.availableQty;
      allocations.push({
        batchId: batch.batchId,
        qty: taken,
        unitCost: batch.unitCost
      });
      remainingToFulfill -= taken;
      return { ...batch, availableQty: 0 };
    }
  });

  // If there's unfulfilled quantity (e.g. stock deficit), allocate at fallback cost
  if (remainingToFulfill > 0) {
    const fallbackCost = product.batches[product.batches.length - 1]?.unitCost || (product.wholesalePrice * 0.75);
    allocations.push({
      batchId: 'EMERGENCY-OVERDRAFT',
      qty: remainingToFulfill,
      unitCost: fallbackCost
    });
  }

  const newTotalStock = updatedBatches.reduce((acc, b) => acc + b.availableQty, 0);

  return {
    updatedProduct: {
      ...product,
      batches: updatedBatches,
      totalStock: Math.max(0, newTotalStock)
    },
    allocations,
    unfulfilledQty: remainingToFulfill
  };
}

/**
 * Adds a newly manufactured or procured batch to a product's FIFO queue
 */
export function addBatchToProduct(
  product: Product,
  newBatch: FifoBatch
): Product {
  const updatedBatches = [...product.batches, newBatch].sort((a, b) => 
    new Date(a.mfgDate).getTime() - new Date(b.mfgDate).getTime()
  );

  const newTotal = updatedBatches.reduce((acc, b) => acc + b.availableQty, 0);

  return {
    ...product,
    batches: updatedBatches,
    totalStock: newTotal
  };
}

/**
 * Updates an existing FIFO batch in a product and recalculates totalStock
 */
export function updateBatchInProduct(
  product: Product,
  batchId: string,
  updatedBatch: FifoBatch
): Product {
  const updatedBatches = product.batches.map(b => 
    b.batchId === batchId ? updatedBatch : b
  ).sort((a, b) => new Date(a.mfgDate).getTime() - new Date(b.mfgDate).getTime());

  const newTotal = updatedBatches.reduce((acc, b) => acc + b.availableQty, 0);

  return {
    ...product,
    batches: updatedBatches,
    totalStock: newTotal
  };
}

/**
 * Deletes a FIFO batch from a product and recalculates totalStock
 */
export function deleteBatchFromProduct(
  product: Product,
  batchId: string
): Product {
  const updatedBatches = product.batches.filter(b => b.batchId !== batchId);
  const newTotal = updatedBatches.reduce((acc, b) => acc + b.availableQty, 0);

  return {
    ...product,
    batches: updatedBatches,
    totalStock: newTotal
  };
}

/**
 * Restores allocated FIFO stock when an invoice is cancelled or voided
 */
export function restoreFifoStock(
  product: Product,
  allocations: FifoAllocation[]
): Product {
  const updatedBatches = product.batches.map(batch => {
    const allocation = allocations.find(a => a.batchId === batch.batchId);
    if (allocation) {
      const restored = batch.availableQty + allocation.qty;
      return {
        ...batch,
        availableQty: Math.min(batch.inwardQty, restored)
      };
    }
    return batch;
  });

  const newTotal = updatedBatches.reduce((acc, b) => acc + b.availableQty, 0);

  return {
    ...product,
    batches: updatedBatches,
    totalStock: newTotal
  };
}

/**
 * Calculates real-time FIFO Cost of Goods Sold (COGS) and Gross Profit for an invoice item
 */
export function calculateCogsAndMargin(allocations: FifoAllocation[], sellingPriceTotal: number) {
  const cogs = allocations.reduce((acc, a) => acc + (a.qty * a.unitCost), 0);
  const grossProfit = sellingPriceTotal - cogs;
  const marginPercentage = sellingPriceTotal > 0 ? (grossProfit / sellingPriceTotal) * 100 : 0;

  return { cogs, grossProfit, marginPercentage };
}
