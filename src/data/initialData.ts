import { Product, Customer, Supplier, PurchaseOrder, CashTransaction, Invoice, WholesaleOrder, FieldPaymentReceipt } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  // --- ATTA ---
  {
    id: 'prod-atta-10kg',
    sku: 'ATT-10K',
    barcode: '890600100101',
    name: 'Chakki Fresh Sharbati Atta (10 Kg Bag)',
    hindiName: 'चक्की फ्रेश शरबती आटा (10 कि.ग्रा.)',
    category: 'Atta',
    subcategory: 'Flour',
    packSize: '10kg',
    unit: 'bag',
    retailPrice: 420,
    wholesalePrice: 370,
    minStockThreshold: 15,
    gstRate: 0,
    hsnCode: '11010000',
    totalStock: 65,
    batches: [
      {
        batchId: 'ATT-BATCH-2608A',
        mfgDate: '2026-08-20',
        expiryDate: '2026-11-20',
        inwardQty: 50,
        availableQty: 25,
        unitCost: 310,
        supplierName: 'Rameshwar Farmer Producer Co.'
      },
      {
        batchId: 'ATT-BATCH-2609B',
        mfgDate: '2026-09-02',
        expiryDate: '2026-12-02',
        inwardQty: 50,
        availableQty: 40,
        unitCost: 315,
        supplierName: 'Rameshwar Farmer Producer Co.'
      }
    ]
  },
  {
    id: 'prod-atta-5kg',
    sku: 'ATT-05K',
    barcode: '890600100505',
    name: 'Chakki Fresh Sharbati Atta (5 Kg Bag)',
    hindiName: 'चक्की फ्रेश शरबती आटा (5 कि.ग्रा.)',
    category: 'Atta',
    subcategory: 'Flour',
    packSize: '5kg',
    unit: 'bag',
    retailPrice: 220,
    wholesalePrice: 195,
    minStockThreshold: 20,
    gstRate: 0,
    hsnCode: '11010000',
    totalStock: 48,
    batches: [
      {
        batchId: 'ATT5-BATCH-2608',
        mfgDate: '2026-08-25',
        expiryDate: '2026-11-25',
        inwardQty: 60,
        availableQty: 48,
        unitCost: 160,
        supplierName: 'Rameshwar Farmer Producer Co.'
      }
    ]
  },
  {
    id: 'prod-atta-bulk-50kg',
    sku: 'ATT-50K',
    barcode: '890600105050',
    name: 'Sharbati Atta Commercial Bulk Sack (50 Kg)',
    hindiName: 'शरबती आटा थोक बोरी (50 कि.ग्रा.)',
    category: 'Atta',
    subcategory: 'Flour',
    packSize: '50kg',
    unit: 'bag',
    retailPrice: 2000,
    wholesalePrice: 1750,
    minStockThreshold: 8,
    gstRate: 0,
    hsnCode: '11010000',
    totalStock: 22,
    batches: [
      {
        batchId: 'ATT50-BATCH-2608',
        mfgDate: '2026-08-22',
        expiryDate: '2026-11-22',
        inwardQty: 30,
        availableQty: 22,
        unitCost: 1520,
        supplierName: 'Rameshwar Farmer Producer Co.'
      }
    ]
  },
  {
    id: 'prod-atta-multigrain-5kg',
    sku: 'ATT-MULTI-5K',
    barcode: '890600109050',
    name: 'Diet Multigrain Atta - 9 Grains (5 Kg)',
    hindiName: 'मल्टीग्रेन पौष्टिक आटा (5 कि.ग्रा.)',
    category: 'Atta',
    subcategory: 'Flour',
    packSize: '5kg',
    unit: 'bag',
    retailPrice: 310,
    wholesalePrice: 270,
    minStockThreshold: 10,
    gstRate: 0,
    hsnCode: '11010000',
    totalStock: 25,
    batches: [
      {
        batchId: 'MULTI-BATCH-2608',
        mfgDate: '2026-08-28',
        expiryDate: '2026-11-28',
        inwardQty: 40,
        availableQty: 25,
        unitCost: 220,
        supplierName: 'Rameshwar Farmer Producer Co.'
      }
    ]
  },

  // --- BESAN ---
  {
    id: 'prod-besan-1kg',
    sku: 'BES-01K',
    barcode: '890600200101',
    name: 'Pure Chana Dal Besan - Fine Mill (1 Kg Pack)',
    hindiName: 'शुद्ध चना दाल बारीक बेसन (1 कि.ग्रा.)',
    category: 'Besan',
    subcategory: 'Flour',
    packSize: '1kg',
    unit: 'packet',
    retailPrice: 110,
    wholesalePrice: 92,
    minStockThreshold: 25,
    gstRate: 5,
    hsnCode: '11061000',
    totalStock: 78,
    batches: [
      {
        batchId: 'BES1-BATCH-2608',
        mfgDate: '2026-08-18',
        expiryDate: '2026-12-18',
        inwardQty: 100,
        availableQty: 38,
        unitCost: 78,
        supplierName: 'Bikaner Chana & Pulses Mandi Trader'
      },
      {
        batchId: 'BES1-BATCH-2609',
        mfgDate: '2026-09-01',
        expiryDate: '2027-01-01',
        inwardQty: 80,
        availableQty: 40,
        unitCost: 80,
        supplierName: 'Bikaner Chana & Pulses Mandi Trader'
      }
    ]
  },
  {
    id: 'prod-besan-500g',
    sku: 'BES-500G',
    barcode: '890600200505',
    name: 'Pure Chana Dal Besan (500 Gm Pouch)',
    hindiName: 'शुद्ध चना दाल बेसन (500 ग्राम पाउच)',
    category: 'Besan',
    subcategory: 'Flour',
    packSize: '500g',
    unit: 'packet',
    retailPrice: 58,
    wholesalePrice: 48,
    minStockThreshold: 30,
    gstRate: 5,
    hsnCode: '11061000',
    totalStock: 95,
    batches: [
      {
        batchId: 'BES500-BATCH-2609',
        mfgDate: '2026-09-02',
        expiryDate: '2027-01-02',
        inwardQty: 120,
        availableQty: 95,
        unitCost: 40,
        supplierName: 'Bikaner Chana & Pulses Mandi Trader'
      }
    ]
  },
  {
    id: 'prod-besan-mota-25kg',
    sku: 'BES-MOTA-25K',
    barcode: '890600202525',
    name: 'Mota Besan For Sweets & Namkeen (25 Kg Sack)',
    hindiName: 'मोटा बेसन - लड्डू/नमकीन स्पेशल (25 कि.ग्रा. बोरी)',
    category: 'Besan',
    subcategory: 'Flour',
    packSize: '25kg',
    unit: 'bag',
    retailPrice: 2550,
    wholesalePrice: 2200,
    minStockThreshold: 6,
    gstRate: 5,
    hsnCode: '11061000',
    totalStock: 16,
    batches: [
      {
        batchId: 'BES25-BATCH-2608',
        mfgDate: '2026-08-24',
        expiryDate: '2026-12-24',
        inwardQty: 25,
        availableQty: 16,
        unitCost: 1900,
        supplierName: 'Bikaner Chana & Pulses Mandi Trader'
      }
    ]
  },

  // --- SATTU ---
  {
    id: 'prod-sattu-chana-1kg',
    sku: 'SAT-CHANA-01K',
    barcode: '890600300101',
    name: 'Desi Bhuna Chana Sattu Premium (1 Kg)',
    hindiName: 'देसी भुना चना सत्तू प्रीमियम (1 कि.ग्रा.)',
    category: 'Sattu',
    subcategory: 'Flour',
    packSize: '1kg',
    unit: 'packet',
    retailPrice: 170,
    wholesalePrice: 142,
    minStockThreshold: 20,
    gstRate: 5,
    hsnCode: '11061000',
    totalStock: 52,
    batches: [
      {
        batchId: 'SAT1-BATCH-2608',
        mfgDate: '2026-08-15',
        expiryDate: '2026-11-15',
        inwardQty: 60,
        availableQty: 18,
        unitCost: 118,
        supplierName: 'Bikaner Chana & Pulses Mandi Trader'
      },
      {
        batchId: 'SAT1-BATCH-2609',
        mfgDate: '2026-09-03',
        expiryDate: '2026-12-03',
        inwardQty: 50,
        availableQty: 34,
        unitCost: 120,
        supplierName: 'Bikaner Chana & Pulses Mandi Trader'
      }
    ]
  },
  {
    id: 'prod-sattu-chana-500g',
    sku: 'SAT-CHANA-500G',
    barcode: '890600300505',
    name: 'Desi Bhuna Chana Sattu (500 Gm)',
    hindiName: 'देसी भुना चना सत्तू (500 ग्राम पाउच)',
    category: 'Sattu',
    subcategory: 'Flour',
    packSize: '500g',
    unit: 'packet',
    retailPrice: 90,
    wholesalePrice: 75,
    minStockThreshold: 20,
    gstRate: 5,
    hsnCode: '11061000',
    totalStock: 64,
    batches: [
      {
        batchId: 'SAT500-BATCH-2608',
        mfgDate: '2026-08-27',
        expiryDate: '2026-11-27',
        inwardQty: 80,
        availableQty: 64,
        unitCost: 61,
        supplierName: 'Bikaner Chana & Pulses Mandi Trader'
      }
    ]
  },
  {
    id: 'prod-sattu-barley-1kg',
    sku: 'SAT-BARLEY-01K',
    barcode: '890600300909',
    name: 'Pure Jau / Barley Sattu Cooling Formula (1 Kg)',
    hindiName: 'शुद्ध जौ सत्तू (1 कि.ग्रा.)',
    category: 'Sattu',
    subcategory: 'Flour',
    packSize: '1kg',
    unit: 'packet',
    retailPrice: 130,
    wholesalePrice: 110,
    minStockThreshold: 12,
    gstRate: 5,
    hsnCode: '11061000',
    totalStock: 28,
    batches: [
      {
        batchId: 'SATJAU-BATCH-2608',
        mfgDate: '2026-08-20',
        expiryDate: '2026-11-20',
        inwardQty: 40,
        availableQty: 28,
        unitCost: 88,
        supplierName: 'Rameshwar Farmer Producer Co.'
      }
    ]
  },

  // --- MASALE (Pure & Blended Spices) ---
  {
    id: 'prod-haldi-500g',
    sku: 'MAS-HAL-500G',
    barcode: '890600400501',
    name: 'Salem Special Golden Haldi Powder (500 Gm)',
    hindiName: 'सेलम स्पेशल हल्दी पाउडर (500 ग्राम)',
    category: 'Masale',
    subcategory: 'Pure Spices',
    packSize: '500g',
    unit: 'packet',
    retailPrice: 140,
    wholesalePrice: 115,
    minStockThreshold: 20,
    gstRate: 5,
    hsnCode: '09103030',
    totalStock: 44,
    batches: [
      {
        batchId: 'HAL500-BATCH-2608',
        mfgDate: '2026-08-10',
        expiryDate: '2027-08-10',
        inwardQty: 60,
        availableQty: 44,
        unitCost: 90,
        supplierName: 'Spices Board Mandi Broker - Unjha & Guntur'
      }
    ]
  },
  {
    id: 'prod-haldi-1kg',
    sku: 'MAS-HAL-01K',
    barcode: '890600401001',
    name: 'Salem Special Golden Haldi Powder (1 Kg Pack)',
    hindiName: 'सेलम स्पेशल हल्दी पाउडर (1 कि.ग्रा.)',
    category: 'Masale',
    subcategory: 'Pure Spices',
    packSize: '1kg',
    unit: 'packet',
    retailPrice: 270,
    wholesalePrice: 220,
    minStockThreshold: 15,
    gstRate: 5,
    hsnCode: '09103030',
    totalStock: 35,
    batches: [
      {
        batchId: 'HAL1-BATCH-2608',
        mfgDate: '2026-08-10',
        expiryDate: '2027-08-10',
        inwardQty: 50,
        availableQty: 35,
        unitCost: 175,
        supplierName: 'Spices Board Mandi Broker - Unjha & Guntur'
      }
    ]
  },
  {
    id: 'prod-mirch-500g',
    sku: 'MAS-MIR-500G',
    barcode: '890600400502',
    name: 'Guntur Stemless Lal Mirch Powder (500 Gm)',
    hindiName: 'गुंटूर डंठल-रहित लाल मिर्च पाउडर (500 ग्राम)',
    category: 'Masale',
    subcategory: 'Pure Spices',
    packSize: '500g',
    unit: 'packet',
    retailPrice: 190,
    wholesalePrice: 160,
    minStockThreshold: 20,
    gstRate: 5,
    hsnCode: '09042211',
    totalStock: 38,
    batches: [
      {
        batchId: 'MIR500-BATCH-2608',
        mfgDate: '2026-08-12',
        expiryDate: '2027-08-12',
        inwardQty: 50,
        availableQty: 38,
        unitCost: 130,
        supplierName: 'Spices Board Mandi Broker - Unjha & Guntur'
      }
    ]
  },
  {
    id: 'prod-mirch-1kg',
    sku: 'MAS-MIR-01K',
    barcode: '890600401002',
    name: 'Guntur Lal Mirch Powder Hot & Color (1 Kg)',
    hindiName: 'गुंटूर लाल मिर्च पाउडर (1 कि.ग्रा.)',
    category: 'Masale',
    subcategory: 'Pure Spices',
    packSize: '1kg',
    unit: 'packet',
    retailPrice: 360,
    wholesalePrice: 310,
    minStockThreshold: 15,
    gstRate: 5,
    hsnCode: '09042211',
    totalStock: 32,
    batches: [
      {
        batchId: 'MIR1-BATCH-2608',
        mfgDate: '2026-08-12',
        expiryDate: '2027-08-12',
        inwardQty: 40,
        availableQty: 32,
        unitCost: 250,
        supplierName: 'Spices Board Mandi Broker - Unjha & Guntur'
      }
    ]
  },
  {
    id: 'prod-dhaniya-500g',
    sku: 'MAS-DHAN-500G',
    barcode: '890600400503',
    name: 'Ramganj Mandi Green Dhaniya Powder (500 Gm)',
    hindiName: 'रामगंजमंडी खुशबूदार धनिया पाउडर (500 ग्राम)',
    category: 'Masale',
    subcategory: 'Pure Spices',
    packSize: '500g',
    unit: 'packet',
    retailPrice: 130,
    wholesalePrice: 105,
    minStockThreshold: 20,
    gstRate: 5,
    hsnCode: '09092200',
    totalStock: 42,
    batches: [
      {
        batchId: 'DHAN500-BATCH-2608',
        mfgDate: '2026-08-14',
        expiryDate: '2027-08-14',
        inwardQty: 60,
        availableQty: 42,
        unitCost: 82,
        supplierName: 'Spices Board Mandi Broker - Unjha & Guntur'
      }
    ]
  },
  {
    id: 'prod-garam-masala-200g',
    sku: 'MAS-GM-200G',
    barcode: '890600400204',
    name: 'Royal Shahi Garam Masala (18 Spices) (200 Gm)',
    hindiName: 'शाही गरम मसाला (18 मसाले मिश्रण) (200 ग्राम)',
    category: 'Masale',
    subcategory: 'Blended Spices',
    packSize: '200g',
    unit: 'packet',
    retailPrice: 180,
    wholesalePrice: 150,
    minStockThreshold: 15,
    gstRate: 5,
    hsnCode: '09109100',
    totalStock: 29,
    batches: [
      {
        batchId: 'GM200-BATCH-2608',
        mfgDate: '2026-08-15',
        expiryDate: '2027-08-15',
        inwardQty: 40,
        availableQty: 29,
        unitCost: 115,
        supplierName: 'Spices Board Mandi Broker - Unjha & Guntur'
      }
    ]
  },
  {
    id: 'prod-sabji-masala-200g',
    sku: 'MAS-SAB-200G',
    barcode: '890600400205',
    name: 'All-in-One Kitchen King Sabji Masala (200 Gm)',
    hindiName: 'ऑल-इन-वन सब्जी मसाला (200 ग्राम)',
    category: 'Masale',
    subcategory: 'Blended Spices',
    packSize: '200g',
    unit: 'packet',
    retailPrice: 120,
    wholesalePrice: 98,
    minStockThreshold: 15,
    gstRate: 5,
    hsnCode: '09109100',
    totalStock: 33,
    batches: [
      {
        batchId: 'SAB200-BATCH-2608',
        mfgDate: '2026-08-16',
        expiryDate: '2027-08-16',
        inwardQty: 45,
        availableQty: 33,
        unitCost: 75,
        supplierName: 'Spices Board Mandi Broker - Unjha & Guntur'
      }
    ]
  },
  {
    id: 'prod-jeera-1kg',
    sku: 'MAS-JEERA-01K',
    barcode: '890600401006',
    name: 'Unjha Premium Machine Clean Jeera (1 Kg)',
    hindiName: 'ऊंझा प्रीमियम जीरा (1 कि.ग्रा.)',
    category: 'Masale',
    subcategory: 'Whole Spices',
    packSize: '1kg',
    unit: 'packet',
    retailPrice: 480,
    wholesalePrice: 420,
    minStockThreshold: 10,
    gstRate: 5,
    hsnCode: '09093129',
    totalStock: 18,
    batches: [
      {
        batchId: 'JEER1-BATCH-2608',
        mfgDate: '2026-08-05',
        expiryDate: '2027-08-05',
        inwardQty: 30,
        availableQty: 18,
        unitCost: 350,
        supplierName: 'Spices Board Mandi Broker - Unjha & Guntur'
      }
    ]
  },
  {
    id: 'prod-chaat-masala-200g',
    sku: 'MAS-CHAT-200G',
    barcode: '890600400207',
    name: 'Tangy Hing-Jeera Chaat Masala (200 Gm)',
    hindiName: 'चटपटा चाट मसाला (200 ग्राम)',
    category: 'Masale',
    subcategory: 'Blended Spices',
    packSize: '200g',
    unit: 'packet',
    retailPrice: 110,
    wholesalePrice: 88,
    minStockThreshold: 10,
    gstRate: 5,
    hsnCode: '09109100',
    totalStock: 24,
    batches: [
      {
        batchId: 'CHAT200-BATCH-2608',
        mfgDate: '2026-08-18',
        expiryDate: '2027-08-18',
        inwardQty: 35,
        availableQty: 24,
        unitCost: 65,
        supplierName: 'Spices Board Mandi Broker - Unjha & Guntur'
      }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-b2b-01',
    mobileNumber: '9829012345',
    name: 'Radheshyam Agarwal',
    type: 'B2B',
    businessName: 'Shree Radhey Sweets & Caterers',
    gstNumber: '08AAACR1234F1Z5',
    address: 'Station Road, Mandi Gate #2',
    creditLimit: 75000,
    outstandingCredit: 18500,
    advanceBalance: 0,
    totalPurchases: 142000,
    orderCount: 14,
    createdAt: '2026-01-15',
    notes: 'Regular wholesale buyer for 25kg Mota Besan & Atta. Repays credit within 7 days.',
    loyaltyPoints: 1420,
    lifetimePoints: 2100,
    loyaltyTier: 'Gold',
    loyaltyHistory: [
      { id: 'log-1', date: '2026-08-10', type: 'EARNED', points: 450, description: 'Points earned on order INV-26-0001', invoiceId: 'inv-2026-0001', balanceAfter: 1420 }
    ]
  },
  {
    id: 'cust-b2b-02',
    mobileNumber: '9414098765',
    name: 'Suresh Kumar Gupta',
    type: 'B2B',
    businessName: 'Gupta Brothers Kirana Mart',
    gstNumber: '08AABCG9876M1Z2',
    address: 'Shop No. 12, Main Bazaar',
    creditLimit: 60000,
    outstandingCredit: 32000,
    advanceBalance: 0,
    totalPurchases: 215000,
    orderCount: 22,
    createdAt: '2026-02-01',
    notes: 'Big reseller of 5kg/10kg Atta & Masale. Weekly billing.',
    loyaltyPoints: 2150,
    lifetimePoints: 3400,
    loyaltyTier: 'Platinum',
    loyaltyHistory: [
      { id: 'log-2', date: '2026-08-14', type: 'EARNED', points: 650, description: 'Points earned on order INV-26-0002', invoiceId: 'inv-2026-0002', balanceAfter: 2150 }
    ]
  },
  {
    id: 'cust-b2b-03',
    mobileNumber: '9782045678',
    name: 'Gurpreet Singh',
    type: 'B2B',
    businessName: 'Kaveri Family Dhaba & Hotel',
    gstNumber: '08AABCK4321Q1Z9',
    address: 'Highway Bypass, Milestone 4',
    creditLimit: 50000,
    outstandingCredit: 0,
    advanceBalance: 3500,
    totalPurchases: 98000,
    orderCount: 9,
    createdAt: '2026-03-10',
    notes: 'Orders 50kg bulk Atta & Haldi/Mirch. Paid up on time. Has advance deposit of ₹3,500.',
    loyaltyPoints: 980,
    lifetimePoints: 1250,
    loyaltyTier: 'Gold',
    loyaltyHistory: [
      { id: 'log-3', date: '2026-08-18', type: 'EARNED', points: 300, description: 'Bonus welcome loyalty points', balanceAfter: 980 }
    ]
  },
  {
    id: 'cust-b2c-01',
    mobileNumber: '9828112233',
    name: 'Rajesh Sharma',
    type: 'B2C',
    address: 'Sector 4, Housing Board',
    creditLimit: 0,
    outstandingCredit: 850,
    advanceBalance: 0,
    totalPurchases: 8400,
    orderCount: 6,
    createdAt: '2026-04-12',
    loyaltyPoints: 84,
    lifetimePoints: 120,
    loyaltyTier: 'Silver',
    loyaltyHistory: [
      { id: 'log-4', date: '2026-08-22', type: 'EARNED', points: 84, description: 'Points earned on grocery purchase', balanceAfter: 84 }
    ]
  },
  {
    id: 'cust-b2c-02',
    mobileNumber: '9929334455',
    name: 'Anita Verma',
    type: 'B2C',
    address: 'Adarsh Nagar, Gali 3',
    creditLimit: 0,
    outstandingCredit: 0,
    advanceBalance: 500,
    totalPurchases: 5200,
    orderCount: 4,
    createdAt: '2026-05-20',
    loyaltyPoints: 52,
    lifetimePoints: 75,
    loyaltyTier: 'Silver'
  },
  {
    id: 'cust-b2c-03',
    mobileNumber: '9827445566',
    name: 'Mohammad Tariq',
    type: 'B2C',
    address: 'Purani Haveli Chowk',
    creditLimit: 0,
    outstandingCredit: 1200,
    advanceBalance: 200,
    totalPurchases: 3900,
    orderCount: 3,
    createdAt: '2026-06-08',
    loyaltyPoints: 39,
    lifetimePoints: 50,
    loyaltyTier: 'Silver'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-01',
    name: 'Rameshwar Farmer Producer Co.',
    contactPerson: 'Mukesh Choudhary',
    mobile: '9829155443',
    category: 'Grain Farmer',
    address: 'Village Mandawar, Krishi Upaj Mandi Yard',
    pendingBalance: 45000,
    performanceRating: 4.8,
    costTrends: [
      { item: 'Sharbati Wheat (Grain)', date: '2026-06-15', pricePerUnit: 26.5 },
      { item: 'Sharbati Wheat (Grain)', date: '2026-07-20', pricePerUnit: 27.2 },
      { item: 'Sharbati Wheat (Grain)', date: '2026-08-25', pricePerUnit: 28.0 }
    ]
  },
  {
    id: 'sup-02',
    name: 'Bikaner Chana & Pulses Mandi Trader',
    contactPerson: 'Kishore Jhanwar',
    mobile: '9414266778',
    category: 'Chana Mandi Trader',
    address: 'Danaganj Anaj Mandi, Bikaner',
    pendingBalance: 28000,
    performanceRating: 4.7,
    costTrends: [
      { item: 'Desi Chana Whole (Grain)', date: '2026-06-10', pricePerUnit: 64.0 },
      { item: 'Desi Chana Whole (Grain)', date: '2026-07-15', pricePerUnit: 67.5 },
      { item: 'Desi Chana Whole (Grain)', date: '2026-08-20', pricePerUnit: 71.0 }
    ]
  },
  {
    id: 'sup-03',
    name: 'Spices Board Mandi Broker - Unjha & Guntur',
    contactPerson: 'Dinesh Patel',
    mobile: '9825099881',
    category: 'Spice Mandi Broker',
    address: 'Spice Complex, Unjha APMC Yard',
    pendingBalance: 34000,
    performanceRating: 4.9,
    costTrends: [
      { item: 'Salem Haldi Whole (Finger)', date: '2026-06-05', pricePerUnit: 145.0 },
      { item: 'Salem Haldi Whole (Finger)', date: '2026-07-10', pricePerUnit: 152.0 },
      { item: 'Salem Haldi Whole (Finger)', date: '2026-08-15', pricePerUnit: 160.0 },
      { item: 'Guntur Chilli Stemless', date: '2026-08-15', pricePerUnit: 215.0 },
      { item: 'Unjha Jeera Bold Quality', date: '2026-08-15', pricePerUnit: 310.0 }
    ]
  },
  {
    id: 'sup-04',
    name: 'Balaji Packaging & Woven Sacks Ltd',
    contactPerson: 'Sunil Mittal',
    mobile: '9829033441',
    category: 'Packaging Pouch Mfr',
    address: 'RIICO Industrial Area, Phase 2',
    pendingBalance: 12000,
    performanceRating: 4.6,
    costTrends: [
      { item: 'Atta 10kg Laminated Bag', date: '2026-07-01', pricePerUnit: 9.5 },
      { item: 'Atta 10kg Laminated Bag', date: '2026-08-15', pricePerUnit: 9.8 },
      { item: 'Spice 500g 3-Ply Pouches', date: '2026-08-15', pricePerUnit: 3.2 }
    ]
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-2026-001',
    poNumber: 'PO-26-001',
    supplierId: 'sup-01',
    supplierName: 'Rameshwar Farmer Producer Co.',
    date: '2026-08-28',
    expectedDelivery: '2026-09-02',
    status: 'Received',
    items: [
      {
        itemName: 'Sharbati Wheat Grade-A (Milling Grain)',
        category: 'Raw Grain',
        qty: 3000,
        unit: 'kg',
        unitCost: 28.0,
        total: 84000
      }
    ],
    totalAmount: 84000,
    paidAmount: 50000,
    paymentStatus: 'Partial',
    paymentMethod: 'Bank_Transfer',
    invoicesRef: 'INV-RAW-8841',
    receivedAt: '2026-09-01'
  },
  {
    id: 'po-2026-002',
    poNumber: 'PO-26-002',
    supplierId: 'sup-02',
    supplierName: 'Bikaner Chana & Pulses Mandi Trader',
    date: '2026-09-01',
    expectedDelivery: '2026-09-05',
    status: 'Received',
    items: [
      {
        itemName: 'Desi Chana Whole (For Sattu & Besan)',
        category: 'Raw Grain',
        qty: 1500,
        unit: 'kg',
        unitCost: 71.0,
        total: 106500
      }
    ],
    totalAmount: 106500,
    paidAmount: 80000,
    paymentStatus: 'Partial',
    paymentMethod: 'Bank_Transfer',
    invoicesRef: 'INV-CHANA-409',
    receivedAt: '2026-09-04'
  },
  {
    id: 'po-2026-003',
    poNumber: 'PO-26-003',
    supplierId: 'sup-03',
    supplierName: 'Spices Board Mandi Broker - Unjha & Guntur',
    date: '2026-09-06',
    expectedDelivery: '2026-09-12',
    status: 'Ordered',
    items: [
      {
        itemName: 'Salem Turmeric Whole Finger',
        category: 'Masale',
        qty: 300,
        unit: 'kg',
        unitCost: 160.0,
        total: 48000
      },
      {
        itemName: 'Unjha Cumin Seeds (Jeera)',
        category: 'Masale',
        qty: 200,
        unit: 'kg',
        unitCost: 310.0,
        total: 62000
      }
    ],
    totalAmount: 110000,
    paidAmount: 0,
    paymentStatus: 'Pending',
    paymentMethod: 'Bank_Transfer'
  }
];

export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [
  {
    id: 'ctx-001',
    date: '2026-09-08T08:30:00.000Z',
    type: 'CASH_IN',
    category: 'OWNER_CAPITAL',
    amount: 15000,
    description: 'Opening Cash Register balance for the day'
  },
  {
    id: 'ctx-002',
    date: '2026-09-08T09:45:00.000Z',
    type: 'CASH_OUT',
    category: 'LABOR_WAGES',
    amount: 1200,
    description: 'Chakki & Mill unloading labor daily daily wage'
  },
  {
    id: 'ctx-003',
    date: '2026-09-08T10:15:00.000Z',
    type: 'CASH_OUT',
    category: 'TEA_EXPENSE',
    amount: 180,
    description: 'Shop morning tea & biscuits for workers and buyers'
  },
  {
    id: 'ctx-004',
    date: '2026-09-08T11:00:00.000Z',
    type: 'CASH_IN',
    category: 'CREDIT_REPAYMENT',
    amount: 10000,
    description: 'Credit repayment received from Gupta Brothers Kirana Mart'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-2026-0001',
    invoiceNo: 'INV-26-0001',
    date: '2026-09-03T10:30:00.000Z',
    customerId: 'cust-b2b-01',
    customerMobile: '9829012345',
    customerName: 'Radheshyam Agarwal',
    customerType: 'B2B',
    customerBusinessName: 'Shree Radhey Sweets & Caterers',
    customerGst: '08AAACR1234F1Z5',
    items: [
      {
        productId: 'prod-besan-mota-25kg',
        name: 'Mota Besan For Sweets & Namkeen (25 Kg Sack)',
        hindiName: 'मोटा बेसन - लड्डू/नमकीन स्पेशल (25 कि.ग्रा. बोरी)',
        packSize: '25kg',
        unit: 'bag',
        quantity: 5,
        unitPrice: 2200,
        priceType: 'wholesale',
        gstRate: 5,
        gstAmount: 550,
        total: 11550,
        fifoAllocations: [
          { batchId: 'BES25-BATCH-2608', qty: 5, unitCost: 1900 }
        ],
        discount: 0
      },
      {
        productId: 'prod-sattu-chana-1kg',
        name: 'Desi Bhuna Chana Sattu Premium (1 Kg)',
        hindiName: 'देसी भुना चना सत्तू प्रीमियम (1 कि.ग्रा.)',
        packSize: '1kg',
        unit: 'packet',
        quantity: 30,
        unitPrice: 142,
        priceType: 'wholesale',
        gstRate: 5,
        gstAmount: 213,
        total: 4473,
        fifoAllocations: [
          { batchId: 'SAT1-BATCH-2608', qty: 30, unitCost: 118 }
        ],
        discount: 0
      }
    ],
    subtotal: 15260,
    discountAmount: 0,
    taxAmount: 763,
    roundOff: 0,
    grandTotal: 16023,
    paymentMethod: 'Credit-7-Days',
    paymentStatus: 'Pending_Credit',
    creditDueDate: '2026-09-10', // Strictly 7 days from Sept 3
    creditPaidAmount: 0,
    notes: '7 Days Credit for Diwali preparations',
    synced: true
  },
  {
    id: 'inv-2026-0002',
    invoiceNo: 'INV-26-0002',
    date: '2026-09-04T14:15:00.000Z',
    customerId: 'cust-b2b-02',
    customerMobile: '9414098765',
    customerName: 'Suresh Kumar Gupta',
    customerType: 'B2B',
    customerBusinessName: 'Gupta Brothers Kirana Mart',
    customerGst: '08AABCG9876M1Z2',
    items: [
      {
        productId: 'prod-atta-10kg',
        name: 'Chakki Fresh Sharbati Atta (10 Kg Bag)',
        hindiName: 'चक्की फ्रेश शरबती आटा (10 कि.ग्रा.)',
        packSize: '10kg',
        unit: 'bag',
        quantity: 20,
        unitPrice: 370,
        priceType: 'wholesale',
        gstRate: 0,
        gstAmount: 0,
        total: 7400,
        fifoAllocations: [
          { batchId: 'ATT-BATCH-2608A', qty: 20, unitCost: 310 }
        ],
        discount: 0
      },
      {
        productId: 'prod-haldi-500g',
        name: 'Salem Special Golden Haldi Powder (500 Gm)',
        hindiName: 'सेलम स्पेशल हल्दी पाउडर (500 ग्राम)',
        packSize: '500g',
        unit: 'packet',
        quantity: 20,
        unitPrice: 115,
        priceType: 'wholesale',
        gstRate: 5,
        gstAmount: 115,
        total: 2415,
        fifoAllocations: [
          { batchId: 'HAL500-BATCH-2608', qty: 20, unitCost: 90 }
        ],
        discount: 0
      }
    ],
    subtotal: 9700,
    discountAmount: 0,
    taxAmount: 115,
    roundOff: 0,
    grandTotal: 9815,
    paymentMethod: 'Credit-7-Days',
    paymentStatus: 'Pending_Credit',
    creditDueDate: '2026-09-11', // Strictly 7 days from Sept 4
    creditPaidAmount: 0,
    synced: true
  },
  {
    id: 'inv-2026-0003',
    invoiceNo: 'INV-26-0003',
    date: '2026-09-07T16:40:00.000Z',
    customerId: 'cust-b2c-01',
    customerMobile: '9828112233',
    customerName: 'Rajesh Sharma',
    customerType: 'B2C',
    items: [
      {
        productId: 'prod-atta-10kg',
        name: 'Chakki Fresh Sharbati Atta (10 Kg Bag)',
        hindiName: 'चक्की फ्रेश शरबती आटा (10 कि.ग्रा.)',
        packSize: '10kg',
        unit: 'bag',
        quantity: 1,
        unitPrice: 420,
        priceType: 'retail',
        gstRate: 0,
        gstAmount: 0,
        total: 420,
        fifoAllocations: [
          { batchId: 'ATT-BATCH-2608A', qty: 1, unitCost: 310 }
        ],
        discount: 0
      },
      {
        productId: 'prod-garam-masala-200g',
        name: 'Royal Shahi Garam Masala (18 Spices) (200 Gm)',
        hindiName: 'शाही गरम मसाला (18 मसाले मिश्रण) (200 ग्राम)',
        packSize: '200g',
        unit: 'packet',
        quantity: 1,
        unitPrice: 180,
        priceType: 'retail',
        gstRate: 5,
        gstAmount: 9,
        total: 189,
        fifoAllocations: [
          { batchId: 'GM200-BATCH-2608', qty: 1, unitCost: 115 }
        ],
        discount: 0
      }
    ],
    subtotal: 600,
    discountAmount: 0,
    taxAmount: 9,
    roundOff: 1,
    grandTotal: 610,
    paymentMethod: 'Online',
    paymentStatus: 'Paid',
    creditPaidAmount: 0,
    synced: true
  }
];


export const INITIAL_WHOLESALE_ORDERS: WholesaleOrder[] = [
  {
    id: 'wo-26-101',
    orderNumber: 'WO-26-101',
    customerId: 'cust-b2b-01',
    customerName: 'Radheshyam Agarwal',
    customerBusinessName: 'Shree Radhey Sweets & Caterers',
    customerMobile: '9829012345',
    salesRepName: 'Amit Meena (Field Rep #1)',
    orderDate: '2026-09-08T09:30:00.000Z',
    expectedDeliveryDate: '2026-09-10',
    items: [
      {
        productId: 'prod-besan-mota-25kg',
        sku: 'BES-MOTA-25K',
        barcode: '890600202525',
        name: 'Mota Besan For Sweets & Namkeen (25 Kg Sack)',
        hindiName: 'मोटा बेसन - लड्डू/नमकीन स्पेशल',
        packSize: '25kg',
        unit: 'bag',
        quantity: 8,
        wholesaleRate: 2200,
        total: 17600
      },
      {
        productId: 'prod-atta-bulk-50kg',
        sku: 'ATT-50K',
        barcode: '890600105050',
        name: 'Sharbati Atta Commercial Bulk Sack (50 Kg)',
        hindiName: 'शरबती आटा थोक बोरी',
        packSize: '50kg',
        unit: 'bag',
        quantity: 5,
        wholesaleRate: 1750,
        total: 8750
      }
    ],
    subtotal: 26350,
    volumeDiscount: 500,
    grandTotal: 25850,
    status: 'Confirmed',
    paymentTerms: 'Credit-7-Days',
    notes: 'Urgent delivery for upcoming Ganesh Utsav catering order. Send fresh milling lot.',
    synced: true
  },
  {
    id: 'wo-26-102',
    orderNumber: 'WO-26-102',
    customerId: 'cust-b2b-02',
    customerName: 'Suresh Kumar Gupta',
    customerBusinessName: 'Gupta Brothers Kirana Mart',
    customerMobile: '9414098765',
    salesRepName: 'Amit Meena (Field Rep #1)',
    orderDate: '2026-09-08T10:15:00.000Z',
    expectedDeliveryDate: '2026-09-11',
    items: [
      {
        productId: 'prod-atta-10kg',
        sku: 'ATT-10K',
        barcode: '890600100101',
        name: 'Chakki Fresh Sharbati Atta (10 Kg Bag)',
        hindiName: 'चक्की फ्रेश शरबती आटा',
        packSize: '10kg',
        unit: 'bag',
        quantity: 15,
        wholesaleRate: 370,
        total: 5550
      },
      {
        productId: 'prod-haldi-500g',
        sku: 'MAS-HAL-500G',
        barcode: '890600400501',
        name: 'Salem Special Golden Haldi Powder (500 Gm)',
        hindiName: 'सेलम स्पेशल हल्दी पाउडर',
        packSize: '500g',
        unit: 'packet',
        quantity: 20,
        wholesaleRate: 115,
        total: 2300
      }
    ],
    subtotal: 7850,
    volumeDiscount: 150,
    grandTotal: 7700,
    status: 'Pending_Approval',
    paymentTerms: 'Credit-7-Days',
    notes: 'Shop restock order. Deliver to Main Bazaar shop after 4 PM.',
    synced: true
  },
  {
    id: 'wo-26-103',
    orderNumber: 'WO-26-103',
    customerId: 'cust-b2b-03',
    customerName: 'Gurpreet Singh',
    customerBusinessName: 'Kaveri Family Dhaba & Hotel',
    customerMobile: '9782045678',
    salesRepName: 'Amit Meena (Field Rep #1)',
    orderDate: '2026-09-14T11:20:00.000Z',
    expectedDeliveryDate: '2026-09-16',
    items: [
      {
        productId: 'prod-atta-bulk-50kg',
        sku: 'ATT-50K',
        barcode: '890600105050',
        name: 'Sharbati Atta Commercial Bulk Sack (50 Kg)',
        hindiName: 'शरबती आटा थोक बोरी',
        packSize: '50kg',
        unit: 'bag',
        quantity: 10,
        wholesaleRate: 1750,
        total: 17500
      }
    ],
    subtotal: 17500,
    volumeDiscount: 0,
    grandTotal: 17500,
    status: 'Confirmed',
    paymentTerms: 'Credit-7-Days',
    notes: 'Weekly flour supply for highway dhaba kitchen.',
    synced: true
  },
  {
    id: 'wo-26-104',
    orderNumber: 'WO-26-104',
    customerId: 'cust-b2b-01',
    customerName: 'Radheshyam Agarwal',
    customerBusinessName: 'Shree Radhey Sweets & Caterers',
    customerMobile: '9829012345',
    salesRepName: 'Amit Meena (Field Rep #1)',
    orderDate: '2026-09-16T14:45:00.000Z',
    expectedDeliveryDate: '2026-09-18',
    items: [
      {
        productId: 'prod-besan-mota-25kg',
        sku: 'BES-MOTA-25K',
        barcode: '890600202525',
        name: 'Mota Besan For Sweets & Namkeen (25 Kg Sack)',
        hindiName: 'मोटा बेसन - लड्डू/नमकीन स्पेशल',
        packSize: '25kg',
        unit: 'bag',
        quantity: 12,
        wholesaleRate: 2200,
        total: 26400
      }
    ],
    subtotal: 26400,
    volumeDiscount: 600,
    grandTotal: 25800,
    status: 'Dispatched',
    paymentTerms: 'Credit-7-Days',
    notes: 'Urgent weekend festival prep requirement.',
    synced: true
  },
  {
    id: 'wo-26-105',
    orderNumber: 'WO-26-105',
    customerId: 'cust-b2b-02',
    customerName: 'Suresh Kumar Gupta',
    customerBusinessName: 'Gupta Brothers Kirana Mart',
    customerMobile: '9414098765',
    salesRepName: 'Amit Meena (Field Rep #1)',
    orderDate: '2026-09-18T16:10:00.000Z',
    expectedDeliveryDate: '2026-09-20',
    items: [
      {
        productId: 'prod-sattu-chana-1kg',
        sku: 'SAT-CHANA-01K',
        barcode: '890600300101',
        name: 'Desi Bhuna Chana Sattu Premium (1 Kg)',
        hindiName: 'देसी भुना चना सत्तू',
        packSize: '1kg',
        unit: 'packet',
        quantity: 40,
        wholesaleRate: 142,
        total: 5680
      },
      {
        productId: 'prod-haldi-500g',
        sku: 'MAS-HAL-500G',
        barcode: '890600400501',
        name: 'Salem Special Golden Haldi Powder (500 Gm)',
        hindiName: 'सेलम स्पेशल हल्दी पाउडर',
        packSize: '500g',
        unit: 'packet',
        quantity: 25,
        wholesaleRate: 115,
        total: 2875
      }
    ],
    subtotal: 8555,
    volumeDiscount: 155,
    grandTotal: 8400,
    status: 'Confirmed',
    paymentTerms: 'Advance-UPI',
    notes: 'Restock order paid via advance UPI.',
    synced: true
  },
  {
    id: 'wo-26-106',
    orderNumber: 'WO-26-106',
    customerId: 'cust-b2b-01',
    customerName: 'Radheshyam Agarwal',
    customerBusinessName: 'Shree Radhey Sweets & Caterers',
    customerMobile: '9829012345',
    salesRepName: 'Amit Meena (Field Rep #1)',
    orderDate: '2026-09-19T09:15:00.000Z',
    expectedDeliveryDate: '2026-09-21',
    items: [
      {
        productId: 'prod-atta-10kg',
        sku: 'ATT-10K',
        barcode: '890600100101',
        name: 'Chakki Fresh Sharbati Atta (10 Kg Bag)',
        hindiName: 'चक्की फ्रेश शरबती आटा',
        packSize: '10kg',
        unit: 'bag',
        quantity: 20,
        wholesaleRate: 370,
        total: 7400
      }
    ],
    subtotal: 7400,
    volumeDiscount: 0,
    grandTotal: 7400,
    status: 'Pending_Approval',
    paymentTerms: 'Credit-7-Days',
    notes: 'Morning order booked by sales rep.',
    synced: true
  }
];

export const INITIAL_FIELD_PAYMENTS: FieldPaymentReceipt[] = [
  {
    id: 'fpr-26-01',
    receiptNo: 'RCP-FL-001',
    customerId: 'cust-b2b-01',
    customerName: 'Radheshyam Agarwal',
    customerBusinessName: 'Shree Radhey Sweets & Caterers',
    customerMobile: '9829012345',
    amount: 10000,
    paymentMode: 'Cash',
    referenceNo: 'CASH-REC-101',
    collectedAt: '2026-09-08T11:00:00.000Z',
    salesRepName: 'Amit Meena (Field Rep #1)',
    notes: 'Partial payment against last week credit bill INV-26-0001',
    synced: true
  },
  {
    id: 'fpr-26-02',
    receiptNo: 'RCP-FL-002',
    customerId: 'cust-b2b-03',
    customerName: 'Gurpreet Singh',
    customerBusinessName: 'Kaveri Family Dhaba & Hotel',
    customerMobile: '9782045678',
    amount: 15000,
    paymentMode: 'UPI_QR',
    referenceNo: 'UPI982348821901',
    collectedAt: '2026-09-07T17:30:00.000Z',
    salesRepName: 'Amit Meena (Field Rep #1)',
    notes: 'Advance booking payment for upcoming wedding catering spice supply',
    synced: true
  }
];
