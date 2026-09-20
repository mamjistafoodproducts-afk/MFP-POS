import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory server backup store (synced from client or seed)
let serverSales: any[] = [];
let serverInventory: any[] = [];
let serverSuppliers: any[] = [];
let serverCustomers: any[] = [];
let serverCashBook: any[] = [];
let serverWholesaleOrders: any[] = [];
let serverFieldPayments: any[] = [];

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Annapurna POS Sync & Reporting API',
    uptime: process.uptime()
  });
});

// Bulk sync endpoint for offline-first synchronization
app.post('/api/sync', (req: Request, res: Response) => {
  try {
    const { sales, inventory, suppliers, customers, cashBook, wholesaleOrders, fieldPayments } = req.body;
    
    if (Array.isArray(sales)) serverSales = sales;
    if (Array.isArray(inventory)) serverInventory = inventory;
    if (Array.isArray(suppliers)) serverSuppliers = suppliers;
    if (Array.isArray(customers)) serverCustomers = customers;
    if (Array.isArray(cashBook)) serverCashBook = cashBook;
    if (Array.isArray(wholesaleOrders)) serverWholesaleOrders = wholesaleOrders;
    if (Array.isArray(fieldPayments)) serverFieldPayments = fieldPayments;

    res.json({
      success: true,
      message: 'Data successfully synchronized with server repository',
      syncedAt: new Date().toISOString(),
      counts: {
        sales: serverSales.length,
        inventory: serverInventory.length,
        suppliers: serverSuppliers.length,
        customers: serverCustomers.length,
        cashBook: serverCashBook.length,
        wholesaleOrders: serverWholesaleOrders.length,
        fieldPayments: serverFieldPayments.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper for CSV export
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      const val = obj[header];
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val ?? '').replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// Sales export (JSON or CSV)
app.get('/api/export/sales', (req: Request, res: Response) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  if (format === 'csv') {
    const flatSales = serverSales.map(s => ({
      InvoiceNo: s.id,
      Date: s.date,
      CustomerName: s.customerName,
      Mobile: s.customerMobile,
      Type: s.customerType,
      TotalAmount: s.grandTotal,
      PaymentMethod: s.paymentMethod,
      PaymentStatus: s.paymentStatus,
      DueDate: s.creditDueDate || 'N/A',
      ItemCount: s.items?.length || 0
    }));
    const csv = convertToCSV(flatSales);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="annapurna_sales_report.csv"');
    return res.send(csv);
  }
  res.json({ success: true, count: serverSales.length, data: serverSales });
});

// Inventory with FIFO Batches export
app.get('/api/export/inventory', (req: Request, res: Response) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  if (format === 'csv') {
    const flatBatches: any[] = [];
    serverInventory.forEach(prod => {
      if (prod.batches && prod.batches.length > 0) {
        prod.batches.forEach((b: any) => {
          flatBatches.push({
            SKU: prod.sku,
            ProductName: prod.name,
            Category: prod.category,
            PackSize: prod.packSize,
            BatchId: b.batchId,
            MfgDate: b.mfgDate,
            ExpiryDate: b.expiryDate,
            CostPrice: b.unitCost,
            RetailPrice: prod.retailPrice,
            WholesalePrice: prod.wholesalePrice,
            AvailableQty: b.availableQty,
            InwardQty: b.inwardQty
          });
        });
      } else {
        flatBatches.push({
          SKU: prod.sku,
          ProductName: prod.name,
          Category: prod.category,
          PackSize: prod.packSize,
          BatchId: 'NONE',
          MfgDate: 'N/A',
          ExpiryDate: 'N/A',
          CostPrice: prod.costPrice || 0,
          RetailPrice: prod.retailPrice,
          WholesalePrice: prod.wholesalePrice,
          AvailableQty: prod.totalStock || 0,
          InwardQty: prod.totalStock || 0
        });
      }
    });
    const csv = convertToCSV(flatBatches);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="annapurna_fifo_inventory.csv"');
    return res.send(csv);
  }
  res.json({ success: true, count: serverInventory.length, data: serverInventory });
});

// Daybook Cash in/out export
app.get('/api/export/daybook', (req: Request, res: Response) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  if (format === 'csv') {
    const csv = convertToCSV(serverCashBook);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="annapurna_cash_daybook.csv"');
    return res.send(csv);
  }
  res.json({ success: true, count: serverCashBook.length, data: serverCashBook });
});

// Suppliers & Purchase Orders export
app.get('/api/export/suppliers', (req: Request, res: Response) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  if (format === 'csv') {
    const csv = convertToCSV(serverSuppliers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="annapurna_suppliers_list.csv"');
    return res.send(csv);
  }
  res.json({ success: true, count: serverSuppliers.length, data: serverSuppliers });
});

// High-level summary report endpoint
app.get('/api/reports/summary', (req: Request, res: Response) => {
  const totalRevenue = serverSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalCreditDue = serverSales
    .filter(s => s.paymentMethod === 'Credit-7-Days' && s.paymentStatus === 'Pending_Credit')
    .reduce((sum, s) => sum + (s.grandTotal - (s.creditPaidAmount || 0)), 0);

  res.json({
    totalSalesCount: serverSales.length,
    totalRevenue,
    totalCreditDue,
    productsCount: serverInventory.length,
    suppliersCount: serverSuppliers.length
  });
});

// Start server with Vite middleware in dev
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Annapurna POS Server listening on port ${PORT}`);
  });
}

startServer();
