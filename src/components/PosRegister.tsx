import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Phone, 
  Building2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Clock, 
  Layers, 
  AlertTriangle,
  RefreshCw,
  Tag,
  CheckCircle2,
  Scan,
  Crown,
  Gift,
  Sparkles,
  Coins,
  Award,
  Keyboard,
  Settings,
  PauseCircle,
  Play,
  RotateCcw,
  Zap,
  Volume2,
  X,
  FileText,
  Wallet,
  KeyRound,
  Lock,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { 
  Product, 
  Customer, 
  ProductCategory, 
  Invoice, 
  PaymentMethod, 
  InvoiceItem,
  PosSettings,
  HeldCart,
  UserRole,
  FifoAllocation
} from '../types';
import { allocateFifoStock } from '../utils/fifoEngine';
import { BarcodeBadge } from './BarcodeBadge';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { LoyaltyRedemptionModal } from './LoyaltyRedemptionModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { HeldCartsModal } from './HeldCartsModal';
import { PosSettingsModal } from './PosSettingsModal';
import { CustomerBalanceAlertPopup } from './CustomerBalanceAlertPopup';
import { useHardwareBarcodeScanner } from '../utils/barcodeLookup';
import { calculatePointsEarned, getLoyaltyConfig, calculatePointsDiscount } from '../utils/loyaltyEngine';
import { matchesShortcut, isTypingInInput } from '../utils/shortcutMatcher';
import { CustomerLoyaltyCreditModal } from './CustomerLoyaltyCreditModal';
import { CarryBagModal } from './CarryBagModal';
import { PasscodeModal } from './PasscodeModal';
import { 
  playScanSuccess, 
  playQtyChange, 
  playItemRemoved, 
  playHoldChime, 
  playRecallChime, 
  playSaleCompleteChime, 
  playAlertBeep 
} from '../utils/audioEffects';
import { 
  getStoredHeldCarts, 
  addHeldCart, 
  removeHeldCart, 
  saveStoredHeldCarts 
} from '../utils/posSettingsStorage';

interface PosRegisterProps {
  products: Product[];
  currentCustomer: Customer;
  onChangeCustomer: () => void;
  onCompleteSale: (invoice: Invoice, updatedProducts: Product[]) => void;
  posSettings: PosSettings;
  onUpdatePosSettings: (newSettings: PosSettings) => void;
  customers?: Customer[];
  invoices?: Invoice[];
  onSelectCustomer?: (customer: Customer, initialDueToAdd?: number, initialAdvanceToAdjust?: number) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  initialDueToAdd?: number;
  initialAdvanceToAdjust?: number;
  userRole?: UserRole;
  onOpenPasscodeSettings?: () => void;
  onRequestElevateRole?: () => void;
}

interface CartEntry {
  product: Product;
  quantity: number;
  priceType: 'retail' | 'wholesale';
  customPrice?: number;
  discount: number;
}

export const PosRegister: React.FC<PosRegisterProps> = ({
  products,
  currentCustomer,
  onChangeCustomer,
  onCompleteSale,
  posSettings,
  onUpdatePosSettings,
  customers = [],
  invoices = [],
  onSelectCustomer,
  onUpdateCustomer,
  initialDueToAdd = 0,
  initialAdvanceToAdjust = 0,
  userRole = 'OWNER',
  onOpenPasscodeSettings,
  onRequestElevateRole
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    currentCustomer.type === 'B2B' ? 'Credit-7-Days' : posSettings.defaultPaymentMethod
  );
  const [cashTendered, setCashTendered] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Customer Previous Due and Advance Adjustment States
  const [previousDueAdded, setPreviousDueAdded] = useState<number>(initialDueToAdd);
  const [advanceAdjusted, setAdvanceAdjusted] = useState<number>(initialAdvanceToAdjust);
  const [isBalanceAlertOpen, setIsBalanceAlertOpen] = useState<boolean>(false);
  const [lastAlertCustomerId, setLastAlertCustomerId] = useState<string>('');
  const [inlineMobileInput, setInlineMobileInput] = useState<string>('');
  const [isInlineMobileActive, setIsInlineMobileActive] = useState<boolean>(false);

  // Modals state
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [isEditLoyaltyCreditOpen, setIsEditLoyaltyCreditOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isHeldCartsModalOpen, setIsHeldCartsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCarryBagModalOpen, setIsCarryBagModalOpen] = useState(false);
  const [ownerAuthPrompt, setOwnerAuthPrompt] = useState<{ action: string; onAuthorized: () => void } | null>(null);

  // Sync initialDueToAdd and initialAdvanceToAdjust if passed from customer selection
  useEffect(() => {
    if (initialDueToAdd > 0) {
      setPreviousDueAdded(initialDueToAdd);
    }
    if (initialAdvanceToAdjust > 0) {
      setAdvanceAdjusted(initialAdvanceToAdjust);
    }
  }, [initialDueToAdd, initialAdvanceToAdjust]);

  // Sound options shortcut
  const soundOpts = {
    enabled: posSettings.enableSoundEffects,
    volume: posSettings.soundVolume
  };

  // As soon as biller selects customer or enters mobile, if customer has previous due or advance payment,
  // pop up on the right-hand side of the screen!
  useEffect(() => {
    const hasDue = (currentCustomer.outstandingCredit || 0) > 0;
    const hasAdvance = (currentCustomer.advanceBalance || 0) > 0;

    if ((hasDue || hasAdvance) && lastAlertCustomerId !== currentCustomer.id) {
      setIsBalanceAlertOpen(true);
      setLastAlertCustomerId(currentCustomer.id);
      playAlertBeep(soundOpts);
    }
  }, [currentCustomer.id, currentCustomer.outstandingCredit, currentCustomer.advanceBalance, lastAlertCustomerId]);

  // Find any pending unpaid credit invoices for current customer's mobile
  const customerPendingInvoices = useMemo(() => {
    if (!invoices || !currentCustomer.mobileNumber) return [];
    return invoices.filter(
      inv => inv.customerMobile === currentCustomer.mobileNumber && 
      (inv.paymentStatus === 'Pending_Credit' || (inv.grandTotal - (inv.creditPaidAmount || 0)) > 0)
    );
  }, [invoices, currentCustomer.mobileNumber]);

  // Held Carts
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => getStoredHeldCarts());
  
  // Loyalty redemption state
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);
  const [loyaltyOfferTitle, setLoyaltyOfferTitle] = useState<string>('');

  // Keyboard navigation states
  const [highlightedProductIndex, setHighlightedProductIndex] = useState<number>(0);
  const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null);

  // Input refs for direct keyboard focusing
  const searchInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const cashTenderedRef = useRef<HTMLInputElement>(null);

  // Default pricing mode based on customer type
  const isB2B = currentCustomer.type === 'B2B';

  // Hardware barcode scanner (USB / Bluetooth keyboard wedge)
  useHardwareBarcodeScanner({
    products,
    onProductScanned: (product, qty = 1) => {
      addToCart(product, qty);
    },
    enabled: !isBarcodeScannerOpen && !isLoyaltyModalOpen && !isShortcutsModalOpen && !isHeldCartsModalOpen && !isSettingsModalOpen
  });

  // Parse quantity prefix multiplier if enabled, e.g. "5*atta" or "atta*5"
  const { cleanQuery, qtyMultiplier } = useMemo(() => {
    const raw = searchQuery.trim();
    if (!posSettings.enableFastQuantityMultiplier) {
      return { cleanQuery: raw, qtyMultiplier: 1 };
    }
    // "5*atta" or "5 * atta"
    const prefixMatch = raw.match(/^(\d+)\s*\*\s*(.*)$/);
    if (prefixMatch) {
      return { cleanQuery: prefixMatch[2].trim(), qtyMultiplier: Math.max(1, parseInt(prefixMatch[1], 10)) };
    }
    // "atta*5" or "atta * 5"
    const suffixMatch = raw.match(/^(.*?)\s*\*\s*(\d+)$/);
    if (suffixMatch) {
      return { cleanQuery: suffixMatch[1].trim(), qtyMultiplier: Math.max(1, parseInt(suffixMatch[2], 10)) };
    }
    return { cleanQuery: raw, qtyMultiplier: 1 };
  }, [searchQuery, posSettings.enableFastQuantityMultiplier]);

  // Filter products by category and search term
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const query = cleanQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.hindiName && p.hindiName.toLowerCase().includes(query)) ||
        p.sku.toLowerCase().includes(query) ||
        p.barcode.toLowerCase().includes(query) ||
        p.packSize.toLowerCase().includes(query);

      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, cleanQuery]);

  // Keep highlightedProductIndex bounded
  useEffect(() => {
    setHighlightedProductIndex(0);
  }, [cleanQuery, selectedCategory]);

  // Auto focus search input on mount and when modal closes
  useEffect(() => {
    if (
      !isBarcodeScannerOpen &&
      !isLoyaltyModalOpen &&
      !isShortcutsModalOpen &&
      !isHeldCartsModalOpen &&
      !isSettingsModalOpen
    ) {
      searchInputRef.current?.focus();
    }
  }, [isBarcodeScannerOpen, isLoyaltyModalOpen, isShortcutsModalOpen, isHeldCartsModalOpen, isSettingsModalOpen]);

  // Cart operations
  const addToCart = (product: Product, quantityToAdd = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantityToAdd;
        return next;
      }
      return [
        ...prev,
        {
          product,
          quantity: quantityToAdd,
          priceType: isB2B ? 'wholesale' : 'retail',
          discount: 0
        }
      ];
    });

    playScanSuccess(soundOpts);

    if (posSettings.autoFocusSearchAfterAdd) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const updated = prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartEntry[];

      if (delta > 0) {
        playQtyChange(true, soundOpts);
      } else if (delta < 0) {
        playQtyChange(false, soundOpts);
      }

      return updated;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const next = prev.filter(item => item.product.id !== productId);
      playItemRemoved(soundOpts);
      return next;
    });
  };

  const toggleItemPriceType = (productId: string) => {
    if (userRole === 'CASHIER') return;
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const nextType = item.priceType === 'retail' ? 'wholesale' : 'retail';
          return { ...item, priceType: nextType };
        }
        return item;
      })
    );
    playQtyChange(true, soundOpts);
  };

  // Carry Bag Handler: adds or updates carry bags with requested quantity (1, 2, 3, 4 etc.) and custom price (₹)
  const handleAddCarryBags = (quantity: number, pricePerBag: number, bagTitle: string) => {
    if (quantity <= 0) {
      // Remove carry bag if 0
      setCart(prev => prev.filter(item => item.product.id !== 'prod-carry-bag' && item.product.sku !== 'BAG-CARRY'));
      playItemRemoved(soundOpts);
      return;
    }

    const carryBagProduct: Product = {
      id: 'prod-carry-bag',
      sku: 'BAG-CARRY',
      barcode: '890600999001',
      name: bagTitle || 'Carry Bag / थैला',
      hindiName: 'मजबूत कैरी बैग (थैला)',
      category: 'Atta',
      subcategory: 'Packaging',
      packSize: 'Standard / Pcs',
      unit: 'bag',
      retailPrice: pricePerBag,
      wholesalePrice: pricePerBag,
      minStockThreshold: 10,
      gstRate: 0,
      hsnCode: '39232990',
      totalStock: 9999,
      batches: [
        {
          batchId: 'BAG-BATCH-01',
          mfgDate: new Date().toISOString().split('T')[0],
          expiryDate: '2030-01-01',
          inwardQty: 9999,
          availableQty: 9999,
          unitCost: 1,
          supplierName: 'Packaging Material'
        }
      ]
    };

    setCart(prev => {
      const filtered = prev.filter(item => item.product.id !== 'prod-carry-bag' && item.product.sku !== 'BAG-CARRY');
      return [
        ...filtered,
        {
          product: carryBagProduct,
          quantity,
          priceType: 'retail',
          customPrice: pricePerBag,
          discount: 0
        }
      ];
    });

    playScanSuccess(soundOpts);
  };

  // Check if carry bag exists in current cart
  const carryBagInCart = useMemo(() => {
    const found = cart.find(i => i.product.id === 'prod-carry-bag' || i.product.sku === 'BAG-CARRY');
    if (!found) return null;
    const unitPrice = found.customPrice !== undefined ? found.customPrice : found.product.retailPrice;
    return {
      quantity: found.quantity,
      unitPrice,
      name: found.product.name
    };
  }, [cart]);

  // Calculations
  const { subtotal, gstAmount, grandTotal, roundOff, loyaltyDiscountAmount, pointsEarned } = useMemo(() => {
    let sub = 0;
    let tax = 0;

    cart.forEach(item => {
      const unitRate =
        item.customPrice !== undefined
          ? item.customPrice
          : item.priceType === 'wholesale'
          ? item.product.wholesalePrice
          : item.product.retailPrice;
      const lineBase = unitRate * item.quantity;
      const lineGst = (lineBase * (item.product.gstRate || 0)) / 100;
      sub += lineBase;
      tax += lineGst;
    });

    // Loyalty points redemption: uses configured exchange rate (₹ per point)
    const loyaltyConf = getLoyaltyConfig();
    const rawPointDiscount = calculatePointsDiscount(redeemedPoints, loyaltyConf);
    const effectiveLoyaltyDiscount = Math.min(sub, rawPointDiscount);
    const totalDiscounts = discountTotal + effectiveLoyaltyDiscount;

    // Previous Due added increases payable amount; Advance adjusted reduces payable amount
    const netBeforeRound = Math.max(0, sub + tax - totalDiscounts + previousDueAdded - advanceAdjusted);
    const rounded = Math.round(netBeforeRound);
    const diff = rounded - netBeforeRound;

    // Points that will be earned on this bill based on dynamic earn rate (spend ₹X -> earn Y pts)
    const earned = calculatePointsEarned(sub, currentCustomer.loyaltyTier, loyaltyConf);

    return {
      subtotal: sub,
      gstAmount: tax,
      loyaltyDiscountAmount: effectiveLoyaltyDiscount,
      grandTotal: rounded,
      roundOff: diff,
      pointsEarned: earned
    };
  }, [cart, discountTotal, redeemedPoints, currentCustomer.loyaltyTier, previousDueAdded, advanceAdjusted]);

  // Cash change calculation
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);

  // 7-day credit due date
  const getSevenDaysDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  // Park / Hold Current Bill
  const handleHoldCurrentCart = () => {
    if (cart.length === 0) {
      playAlertBeep(soundOpts);
      alert('Cart is empty. Nothing to park.');
      return;
    }

    const newHeld: HeldCart = {
      id: `held-${Date.now()}`,
      heldAt: new Date().toISOString(),
      customer: currentCustomer,
      items: cart,
      discountTotal,
      paymentMethod,
      notes: paymentNotes,
      estimatedTotal: grandTotal,
      previousDueAdded,
      advanceAdjusted
    };

    const updated = addHeldCart(newHeld);
    setHeldCarts(updated);
    setCart([]);
    setDiscountTotal(0);
    setCashTendered('');
    setPaymentNotes('');
    setPreviousDueAdded(0);
    setAdvanceAdjusted(0);
    setIsBalanceAlertOpen(false);
    playHoldChime(soundOpts);
  };

  // Resume Parked Bill
  const handleResumeCart = (held: HeldCart) => {
    setCart(held.items);
    setDiscountTotal(held.discountTotal);
    setPaymentMethod(held.paymentMethod);
    setPaymentNotes(held.notes || '');
    if (held.previousDueAdded !== undefined) setPreviousDueAdded(held.previousDueAdded);
    if (held.advanceAdjusted !== undefined) setAdvanceAdjusted(held.advanceAdjusted);
    const updated = removeHeldCart(held.id);
    setHeldCarts(updated);
    setIsHeldCartsModalOpen(false);
    playRecallChime(soundOpts);
  };

  // Clear cart
  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Clear current bill / cart items?')) {
      setCart([]);
      setDiscountTotal(0);
      setCashTendered('');
      setPaymentNotes('');
      setPreviousDueAdded(0);
      setAdvanceAdjusted(0);
      setIsBalanceAlertOpen(false);
      playItemRemoved(soundOpts);
    }
  };

  // Category Cycling
  const categoriesList = ['ALL', 'Atta', 'Besan', 'Sattu', 'Masale'];
  const cycleNextCategory = () => {
    const currentIndex = categoriesList.indexOf(selectedCategory);
    const nextIndex = (currentIndex + 1) % categoriesList.length;
    setSelectedCategory(categoriesList[nextIndex]);
    playQtyChange(true, soundOpts);
  };

  // Checkout Execution
  const handleCheckout = () => {
    if (cart.length === 0) {
      playAlertBeep(soundOpts);
      alert('Cart is empty. Please add items or scan barcodes to generate bill.');
      return;
    }

    if (paymentMethod === 'Credit-7-Days' && !isB2B) {
      playAlertBeep(soundOpts);
      alert('7-Day Credit is available exclusively for B2B wholesale buyers.');
      return;
    }

    if (paymentMethod === 'Cash' && tenderedNum > 0 && tenderedNum < grandTotal) {
      if (!confirm(`Cash tendered (₹${tenderedNum}) is less than Total (₹${grandTotal}). Proceed anyway?`)) {
        return;
      }
    }

    // Execute FIFO stock allocation for all cart items
    let updatedProductsList = [...products];
    const invoiceItems: InvoiceItem[] = [];

    for (const item of cart) {
      const targetProdIndex = updatedProductsList.findIndex(p => p.id === item.product.id);
      const targetProd = updatedProductsList[targetProdIndex];

      const unitRate =
        item.customPrice !== undefined
          ? item.customPrice
          : item.priceType === 'wholesale'
          ? item.product.wholesalePrice
          : item.product.retailPrice;

      const gstRate = item.product.gstRate || 0;
      const lineTotal = (unitRate * item.quantity) + ((unitRate * item.quantity * gstRate) / 100);

      // FIFO Allocation
      let allocations: FifoAllocation[] = [];
      if (targetProd && targetProd.batches && targetProd.batches.length > 0) {
        const fifoResult = allocateFifoStock(targetProd, item.quantity);
        updatedProductsList[targetProdIndex] = fifoResult.updatedProduct;
        allocations = fifoResult.allocations;
      } else {
        allocations = [{ batchId: 'STANDARD-ALLOC', qty: item.quantity, unitCost: unitRate * 0.7 }];
      }

      invoiceItems.push({
        productId: item.product.id,
        name: item.product.name,
        hindiName: item.product.hindiName,
        packSize: item.product.packSize,
        unit: item.product.unit,
        quantity: item.quantity,
        unitPrice: unitRate,
        priceType: item.priceType,
        gstRate,
        gstAmount: (unitRate * item.quantity * gstRate) / 100,
        total: lineTotal,
        fifoAllocations: allocations,
        discount: 0
      });
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: `INV-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      customerId: currentCustomer.id,
      customerMobile: currentCustomer.mobileNumber,
      customerName: currentCustomer.name,
      customerType: currentCustomer.type,
      customerBusinessName: currentCustomer.businessName,
      customerGst: currentCustomer.gstNumber,
      items: invoiceItems,
      subtotal,
      discountAmount: discountTotal + loyaltyDiscountAmount,
      taxAmount: gstAmount,
      roundOff,
      grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'Credit-7-Days' ? 'Pending_Credit' : 'Paid',
      creditDueDate: paymentMethod === 'Credit-7-Days' ? getSevenDaysDueDate() : undefined,
      creditPaidAmount: 0,
      pointsEarned,
      pointsRedeemed: redeemedPoints,
      loyaltyDiscountAmount,
      previousDueAdded,
      advanceAdjusted,
      previousOutstandingBefore: currentCustomer.outstandingCredit || 0,
      advanceBalanceBefore: currentCustomer.advanceBalance || 0,
      notes: paymentNotes.trim() || undefined,
      synced: false
    };

    playSaleCompleteChime(soundOpts);
    onCompleteSale(newInvoice, updatedProductsList);

    setCart([]);
    setDiscountTotal(0);
    setRedeemedPoints(0);
    setLoyaltyOfferTitle('');
    setCashTendered('');
    setPaymentNotes('');
    setPreviousDueAdded(0);
    setAdvanceAdjusted(0);
    setIsBalanceAlertOpen(false);
  };

  // Keyboard navigation & Shortcuts Handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if any sub-modal is open (except Escape)
      const anyModalOpen = isBarcodeScannerOpen || isLoyaltyModalOpen || isShortcutsModalOpen || isHeldCartsModalOpen || isSettingsModalOpen || isBalanceAlertOpen;
      if (anyModalOpen) {
        if (e.key === 'Escape') {
          setIsBarcodeScannerOpen(false);
          setIsLoyaltyModalOpen(false);
          setIsShortcutsModalOpen(false);
          setIsHeldCartsModalOpen(false);
          setIsSettingsModalOpen(false);
          setIsBalanceAlertOpen(false);
        }
        return;
      }

      // Customer Balance Popup shortcut: Alt+B
      if (e.altKey && (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'u')) {
        e.preventDefault();
        setIsBalanceAlertOpen(prev => !prev);
        return;
      }

      const shortcuts = posSettings.shortcuts;

      // 1. HELP MODAL: F1 or '?'
      if (matchesShortcut(e, shortcuts.toggleHelp) || (e.key === '?' && !isTypingInInput(e.target))) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
        return;
      }

      // 2. FOCUS SEARCH: F2 or '/'
      if (matchesShortcut(e, shortcuts.focusSearch) || (e.key === '/' && !isTypingInInput(e.target))) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // 3. CHANGE CUSTOMER: F3 or Alt+C
      if (matchesShortcut(e, shortcuts.changeCustomer) || (e.altKey && e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        onChangeCustomer();
        return;
      }

      // 4. MANUAL DISCOUNT: F4 or Alt+D
      if (matchesShortcut(e, shortcuts.manualDiscount) || (e.altKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
        return;
      }

      // 5. CYCLE CATEGORIES: F5
      if (matchesShortcut(e, shortcuts.cycleCategories)) {
        e.preventDefault();
        cycleNextCategory();
        return;
      }

      // 6. HOLD CART: F6 or Alt+H
      if (matchesShortcut(e, shortcuts.holdCart) || (e.altKey && e.key.toLowerCase() === 'h')) {
        e.preventDefault();
        handleHoldCurrentCart();
        return;
      }

      // 7. RECALL CART: F7 or Alt+R
      if (matchesShortcut(e, shortcuts.recallCart) || (e.altKey && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        setIsHeldCartsModalOpen(true);
        return;
      }

      // 8. CLEAR CART: F8 or Alt+X
      if (matchesShortcut(e, shortcuts.clearCart) || (e.altKey && e.key.toLowerCase() === 'x')) {
        e.preventDefault();
        handleClearCart();
        return;
      }

      // 9. COMPLETE BILL / TENDER: F9 or Ctrl+Enter
      if (matchesShortcut(e, shortcuts.completeBill) || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        handleCheckout();
        return;
      }

      // 10. OPEN SETTINGS: F11 or Ctrl+,
      if (matchesShortcut(e, shortcuts.openSettings) || (e.ctrlKey && e.key === ',')) {
        e.preventDefault();
        setIsSettingsModalOpen(true);
        return;
      }

      // 11. PAYMENT MODES
      if (matchesShortcut(e, shortcuts.payCash) || (e.altKey && e.key === '1')) {
        e.preventDefault();
        setPaymentMethod('Cash');
        cashTenderedRef.current?.focus();
        return;
      }
      if (matchesShortcut(e, shortcuts.payOnline) || (e.altKey && e.key === '2')) {
        e.preventDefault();
        setPaymentMethod('Online');
        return;
      }
      if (matchesShortcut(e, shortcuts.payCredit) || (e.altKey && e.key === '3')) {
        if (isB2B) {
          e.preventDefault();
          setPaymentMethod('Credit-7-Days');
        }
        return;
      }

      // 12. BARCODE CAMERA: Alt+B
      if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsBarcodeScannerOpen(true);
        return;
      }

      // 13. LOYALTY MODAL: Alt+L
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsLoyaltyModalOpen(true);
        return;
      }

      // 14. QUICK CASH TENDER SHORTCUTS (Ctrl+0 for exact, Ctrl+1, Ctrl+2, Ctrl+5)
      if (e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (e.key === '0') {
          e.preventDefault();
          setPaymentMethod('Cash');
          setCashTendered(grandTotal.toString());
          return;
        }
        if (e.key === '1') {
          e.preventDefault();
          setPaymentMethod('Cash');
          setCashTendered((tenderedNum + 100).toString());
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          setPaymentMethod('Cash');
          setCashTendered((tenderedNum + 200).toString());
          return;
        }
        if (e.key === '5') {
          e.preventDefault();
          setPaymentMethod('Cash');
          setCashTendered((tenderedNum + 500).toString());
          return;
        }
      }

      // 15. CART ITEM NAVIGATION (when not typing in an input)
      if (!isTypingInInput(e.target) && cart.length > 0) {
        // Select next/prev cart item with '[' and ']' or Alt+Up/Down
        if (e.key === '[' || (e.altKey && e.key === 'ArrowUp')) {
          e.preventDefault();
          setSelectedCartIndex(prev => {
            if (prev === null) return 0;
            return Math.max(0, prev - 1);
          });
          return;
        }
        if (e.key === ']' || (e.altKey && e.key === 'ArrowDown')) {
          e.preventDefault();
          setSelectedCartIndex(prev => {
            if (prev === null) return 0;
            return Math.min(cart.length - 1, prev + 1);
          });
          return;
        }

        // Active cart item controls
        const activeItem = selectedCartIndex !== null && cart[selectedCartIndex] 
          ? cart[selectedCartIndex] 
          : cart[cart.length - 1]; // default to last added item

        if (activeItem) {
          if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
            e.preventDefault();
            updateQuantity(activeItem.product.id, 1);
            return;
          }
          if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
            e.preventDefault();
            updateQuantity(activeItem.product.id, -1);
            return;
          }
          if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            removeFromCart(activeItem.product.id);
            return;
          }
          if (e.key.toLowerCase() === 'w') {
            e.preventDefault();
            toggleItemPriceType(activeItem.product.id);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    posSettings,
    cart,
    currentCustomer,
    grandTotal,
    tenderedNum,
    selectedCartIndex,
    isB2B,
    selectedCategory,
    isBarcodeScannerOpen,
    isLoyaltyModalOpen,
    isShortcutsModalOpen,
    isHeldCartsModalOpen,
    isSettingsModalOpen
  ]);

  // Search input special key handler (Arrow navigation & Enter)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedProductIndex(prev => Math.min(filteredProducts.length - 1, prev + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedProductIndex(prev => Math.max(0, prev - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        const selected = filteredProducts[highlightedProductIndex] || filteredProducts[0];
        addToCart(selected, qtyMultiplier);
        setSearchQuery('');
        setHighlightedProductIndex(0);
      }
      return;
    }
    if (e.key === 'Escape') {
      if (searchQuery) {
        setSearchQuery('');
      } else {
        searchInputRef.current?.blur();
      }
      return;
    }
  };

  const tier = currentCustomer.loyaltyTier || 'Silver';
  const pointsBalance = currentCustomer.loyaltyPoints || 0;

  // Density classes
  const density = posSettings.uiDensity;
  const cardPadding = density === 'compact' ? 'p-2.5' : density === 'spacious' ? 'p-4' : 'p-3.5';
  const gridGap = density === 'compact' ? 'gap-2' : density === 'spacious' ? 'gap-4' : 'gap-3';
  const textTitleSize = density === 'compact' ? 'text-xs' : 'text-xs sm:text-sm';

  return (
    <div id="pos-register" className="flex flex-col lg:flex-row h-full gap-4">
      {/* LEFT COLUMN: Catalog & Item Selection */}
      <div className="flex-1 flex flex-col min-w-0 space-y-3.5">
        {/* Customer Header Banner with Integrated Loyalty Profile */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 sm:p-3.5 shadow-xs border border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-base ${
              isB2B ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {isB2B ? <Building2 className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  {currentCustomer.name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isB2B ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {isB2B ? 'B2B Wholesale' : 'B2C Retail'}
                </span>

                {/* Loyalty Tier Badge */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  tier === 'Platinum'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : tier === 'Gold'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <Crown className="h-3 w-3" />
                  <span>{tier} Club</span>
                </span>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-mono text-slate-700 font-semibold">{currentCustomer.mobileNumber}</span>
                {currentCustomer.businessName && (
                  <span>• <strong className="text-slate-700">{currentCustomer.businessName}</strong></span>
                )}
                <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[11px]">
                  <Coins className="h-3 w-3 text-amber-600" />
                  <span>{pointsBalance.toLocaleString()} Pts (₹{calculatePointsDiscount(pointsBalance, getLoyaltyConfig()).toFixed(0)} Off)</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Previous Due Alert Pill */}
            {(currentCustomer.outstandingCredit || 0) > 0 && (
              <button
                type="button"
                id="header-customer-due-badge"
                onClick={() => setIsBalanceAlertOpen(prev => !prev)}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                  previousDueAdded > 0
                    ? 'bg-rose-100 text-rose-900 border-rose-400 ring-2 ring-rose-500/20'
                    : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                }`}
                title="Customer has unpaid balance. Click to Add/Ignore [Alt+B]"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
                <span>Due: ₹{currentCustomer.outstandingCredit.toLocaleString()}</span>
                {previousDueAdded > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    +₹{previousDueAdded} Added
                  </span>
                )}
              </button>
            )}

            {/* Advance Payment Alert Pill */}
            {(currentCustomer.advanceBalance || 0) > 0 && (
              <button
                type="button"
                id="header-customer-advance-badge"
                onClick={() => setIsBalanceAlertOpen(prev => !prev)}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                  advanceAdjusted > 0
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                }`}
                title="Customer has advance deposit. Click to Deduct/Keep [Alt+B]"
              >
                <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Adv: ₹{(currentCustomer.advanceBalance || 0).toLocaleString()}</span>
                {advanceAdjusted > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    -₹{advanceAdjusted} Deducted
                  </span>
                )}
              </button>
            )}

            {/* Loyalty Redeem Button */}
            <button
              type="button"
              id="redeem-loyalty-btn"
              onClick={() => setIsLoyaltyModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
                redeemedPoints > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
              title="Redeem points [Alt+L]"
            >
              <Gift className="h-3.5 w-3.5 text-amber-700" />
              <span>
                {redeemedPoints > 0 ? `₹${calculatePointsDiscount(redeemedPoints, getLoyaltyConfig()).toFixed(0)} Redeemed ✓` : 'Redeem Points'}
              </span>
              <kbd className="hidden sm:inline-block text-[9px] bg-amber-100/80 px-1 rounded text-amber-800 font-mono">
                [Alt+L]
              </kbd>
            </button>

            {/* Quick Edit Customer Loyalty & Credit Profile */}
            {onUpdateCustomer && (
              <button
                type="button"
                id="header-edit-loyalty-credit-btn"
                onClick={() => {
                  if (userRole === 'CASHIER') {
                    setOwnerAuthPrompt({
                      action: 'Customer Credit & Loyalty Profile Editing',
                      onAuthorized: () => setIsEditLoyaltyCreditOpen(true)
                    });
                  } else {
                    setIsEditLoyaltyCreditOpen(true);
                  }
                }}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
                  userRole === 'CASHIER'
                    ? 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'border-amber-300 bg-white hover:bg-amber-50 text-amber-900'
                }`}
                title={userRole === 'CASHIER' ? "Edit Profile (Owner Passcode Required)" : "Edit Customer Loyalty Points, Credit Limits & Terms"}
              >
                <CreditCard className="h-3.5 w-3.5 text-amber-700" />
                <span className="hidden xl:inline">Loyalty &amp; Credit</span>
                {userRole === 'CASHIER' && <span className="text-[10px]">🔒</span>}
              </button>
            )}

            {/* Quick Mobile Lookup Input Toggle */}
            {isInlineMobileActive ? (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300">
                <Phone className="h-3.5 w-3.5 text-slate-500 ml-1" />
                <input
                  type="tel"
                  autoFocus
                  maxLength={10}
                  value={inlineMobileInput}
                  onChange={(e) => {
                    const typed = e.target.value;
                    setInlineMobileInput(typed);
                    const clean = typed.replace(/\D/g, '');
                    if (clean.length === 10 && onSelectCustomer && customers) {
                      const match = customers.find(c => c.mobileNumber === clean);
                      if (match) {
                        onSelectCustomer(match);
                        setIsInlineMobileActive(false);
                        setInlineMobileInput('');
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsInlineMobileActive(false);
                      setInlineMobileInput('');
                    }
                  }}
                  placeholder="Enter 10-digit mobile..."
                  className="w-36 text-xs px-2 py-0.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-amber-600 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setIsInlineMobileActive(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="quick-mobile-input-btn"
                onClick={() => setIsInlineMobileActive(true)}
                className="hidden sm:flex items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors"
                title="Type customer mobile number to load previous due / advance"
              >
                <Phone className="h-3 w-3 text-slate-500" />
                <span>Enter Mobile</span>
              </button>
            )}

            <button
              type="button"
              id="switch-customer-btn"
              onClick={onChangeCustomer}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              title="Change Customer [F3]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Change</span>
              <kbd className="hidden sm:inline-block text-[9px] bg-slate-200 px-1 rounded text-slate-600 font-mono font-bold">
                [F3]
              </kbd>
            </button>
          </div>
        </div>

        {/* Category Filters, Search, and Keyboard Controls Header */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Items (सभी)', count: products.length },
              { id: 'Atta', label: '🌾 Atta', count: products.filter(p => p.category === 'Atta').length },
              { id: 'Besan', label: '🟡 Besan', count: products.filter(p => p.category === 'Besan').length },
              { id: 'Sattu', label: '🥤 Sattu', count: products.filter(p => p.category === 'Sattu').length },
              { id: 'Masale', label: '🌶️ Masale', count: products.filter(p => p.category === 'Masale').length },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                id={`cat-filter-${cat.id.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                  selectedCategory === cat.id
                    ? 'bg-amber-800 text-white font-bold ring-2 ring-amber-700/30'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Search Box with Arrow Up/Down & Multiplier indicator */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              id="pos-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder='Press [F2] or [/] • Type "5*atta" or barcode + Enter...'
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-20 text-xs text-slate-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 focus:outline-none shadow-xs font-medium"
            />
            {qtyMultiplier > 1 ? (
              <span className="absolute right-2.5 top-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-900 border border-amber-300">
                Qty: {qtyMultiplier}x
              </span>
            ) : (
              <span className="absolute right-2.5 top-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 font-mono">
                [F2]
              </span>
            )}
          </div>

          {/* Actions: Scan Barcode, Carry Bag, Passcodes, Shortcuts Help & Settings */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* Quick Carry Bag Button */}
            <button
              type="button"
              id="open-carry-bag-btn"
              onClick={() => setIsCarryBagModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 px-2.5 py-2 text-xs font-bold transition-all shadow-xs"
              title="Add Carry Bags (थैला जोड़ें)"
            >
              <ShoppingBag className="h-4 w-4 text-amber-800" />
              <span className="inline">+ Carry Bag</span>
              {carryBagInCart && (
                <span className="rounded-full bg-amber-700 text-white px-1.5 py-0.2 text-[10px] font-bold">
                  {carryBagInCart.quantity}
                </span>
              )}
            </button>

            <button
              type="button"
              id="open-barcode-scanner-btn"
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-slate-900 text-white hover:bg-black px-2.5 py-2 text-xs font-bold transition-all shadow-xs"
              title="Camera Scanner [Alt+B]"
            >
              <Scan className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Scan</span>
            </button>

            <button
              type="button"
              id="open-keyboard-shortcuts-btn"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-2.5 py-2 text-xs font-bold transition-all shadow-xs"
              title="Keyboard Shortcuts Cheat Sheet [F1 or ?]"
            >
              <Keyboard className="h-4 w-4 text-amber-700" />
              <span className="hidden sm:inline">Keys</span>
              <span className="text-[10px] font-mono text-slate-400">[F1]</span>
            </button>

            {/* Passcodes Management */}
            {onOpenPasscodeSettings && (
              <button
                type="button"
                id="pos-passcodes-btn"
                onClick={() => {
                  if (userRole === 'CASHIER') {
                    setOwnerAuthPrompt({
                      action: 'Manage Owner & Cashier Passcodes',
                      onAuthorized: () => onOpenPasscodeSettings()
                    });
                  } else {
                    onOpenPasscodeSettings();
                  }
                }}
                className="flex items-center gap-1 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-2.5 py-2 text-xs font-bold transition-all shadow-xs"
                title={userRole === 'CASHIER' ? "Change Passcodes (Owner Passcode Required)" : "Manage Owner & Cashier Passcodes"}
              >
                <KeyRound className="h-4 w-4 text-amber-700" />
                <span className="hidden xl:inline">Passcodes</span>
                {userRole === 'CASHIER' && <span className="text-[10px]">🔒</span>}
              </button>
            )}

            {/* Role indicator badge */}
            {userRole === 'CASHIER' ? (
              <div 
                className="flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-900 shadow-2xs"
                title="Cashier Mode: Billing Only. Customization & Editing disabled."
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden sm:inline">Cashier</span>
                {onRequestElevateRole && (
                  <button
                    type="button"
                    onClick={onRequestElevateRole}
                    className="ml-1 text-[10px] text-blue-700 underline font-semibold hover:text-blue-950"
                    title="Unlock Owner Mode"
                  >
                    Unlock
                  </button>
                )}
              </div>
            ) : (
              <div 
                className="hidden sm:flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs font-bold text-amber-900 shadow-2xs"
                title="Owner Mode: Full Customization & Editing enabled."
              >
                <Crown className="h-3.5 w-3.5 text-amber-600" />
                <span>Owner</span>
              </div>
            )}

            <button
              type="button"
              id="open-pos-settings-btn"
              onClick={() => {
                if (userRole === 'CASHIER') {
                  setOwnerAuthPrompt({
                    action: 'POS Settings & Customization',
                    onAuthorized: () => setIsSettingsModalOpen(true)
                  });
                } else {
                  setIsSettingsModalOpen(true);
                }
              }}
              className="flex items-center gap-1 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 p-2 text-xs font-bold transition-all shadow-xs"
              title={userRole === 'CASHIER' ? "Settings (Owner Passcode Required)" : "POS Settings & Customization [F11]"}
            >
              <Settings className="h-4 w-4 text-slate-600" />
              {userRole === 'CASHIER' && <span className="text-[10px]">🔒</span>}
            </button>
          </div>
        </div>

        {/* Product Cards Grid with Keyboard Highlight indicator */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 ${gridGap} overflow-y-auto max-h-[calc(100vh-270px)] pr-1`}>
          {filteredProducts.map((product, index) => {
            const inCartEntry = cart.find(c => c.product.id === product.id);
            const activePrice = isB2B ? product.wholesalePrice : product.retailPrice;
            const isLowStock = product.totalStock <= product.minStockThreshold;
            const isHighlighted = index === highlightedProductIndex;

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                onClick={() => addToCart(product, qtyMultiplier)}
                className={`group relative flex flex-col justify-between rounded-xl bg-white ${cardPadding} border transition-all cursor-pointer select-none ${
                  isHighlighted 
                    ? 'border-amber-600 ring-2 ring-amber-500/30 shadow-md bg-amber-50/20' 
                    : 'border-slate-200 hover:border-amber-400 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 font-mono">
                      {product.packSize}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                      product.totalStock === 0
                        ? 'bg-rose-100 text-rose-700'
                        : isLowStock
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      <Layers className="h-3 w-3" />
                      {product.totalStock} {product.unit}s
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-baseline justify-between gap-1">
                      <h4 className={`font-bold text-slate-900 ${textTitleSize} group-hover:text-amber-800 transition-colors`}>
                        {product.name}
                      </h4>
                      {isHighlighted && (
                        <span className="rounded bg-amber-700 text-white text-[9px] font-bold px-1.5 py-0.2 animate-pulse">
                          [Enter]
                        </span>
                      )}
                    </div>
                    {posSettings.showHindiNames && (
                      <p className="text-[11px] font-semibold text-slate-600">
                        {product.hindiName}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>SKU: {product.sku}</span>
                      <BarcodeBadge barcode={product.barcode} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">
                      {isB2B ? 'Wholesale Rate' : 'Retail Rate'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black text-slate-900 font-mono">
                        ₹{activePrice}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        /{product.unit}
                      </span>
                    </div>
                  </div>

                  {inCartEntry ? (
                    <div 
                      className="flex items-center gap-1.5 bg-amber-50 rounded-lg p-1 border border-amber-200"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, -1)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-amber-100 font-bold text-xs"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-amber-900 font-mono text-xs">
                        {inCartEntry.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, 1)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-amber-100 font-bold text-xs"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product, qtyMultiplier);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-amber-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-800 shadow-xs transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{qtyMultiplier > 1 ? `+${qtyMultiplier}` : 'Add'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Bill Summary & Fast Checkout */}
      <div className="w-full lg:w-96 flex flex-col rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        {/* Cart Top Bar with Hold & Clear Shortcuts */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-800" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Current Bill / कार्ट</h3>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Carry Bag Button in Cart Header */}
            <button
              type="button"
              id="cart-carry-bag-btn"
              onClick={() => setIsCarryBagModalOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 px-2 py-1 text-[11px] font-bold transition-colors shadow-xs"
              title="Add / Configure Carry Bags (+ थैला जोड़ें)"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-700" />
              <span>+ Bag</span>
              {carryBagInCart && (
                <span className="rounded-full bg-amber-700 text-white px-1 text-[9px] font-bold">
                  {carryBagInCart.quantity}x
                </span>
              )}
            </button>

            {/* Hold Cart [F6] */}
            <button
              type="button"
              id="hold-cart-btn"
              onClick={handleHoldCurrentCart}
              disabled={cart.length === 0}
              className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Park / Hold Current Bill [F6]"
            >
              <PauseCircle className="h-3.5 w-3.5 text-amber-700" />
              <span>Hold</span>
              <span className="font-mono text-[9px] text-amber-700">[F6]</span>
            </button>

            {/* Recall Held Carts [F7] */}
            <button
              type="button"
              id="recall-cart-btn"
              onClick={() => setIsHeldCartsModalOpen(true)}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                heldCarts.length > 0
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
              title="Recall Parked Bill [F7]"
            >
              <Play className="h-3.5 w-3.5 text-emerald-600 fill-current" />
              <span>Held</span>
              {heldCarts.length > 0 && (
                <span className="rounded-full bg-emerald-600 text-white px-1 text-[9px]">
                  {heldCarts.length}
                </span>
              )}
              <span className="font-mono text-[9px]">[F7]</span>
            </button>

            {/* Clear Cart [F8] */}
            {cart.length > 0 && (
              <button
                type="button"
                id="clear-cart-btn"
                onClick={handleClearCart}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Clear Cart [F8]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Cart Item List with Keyboard Focus */}
        <div className="flex-1 overflow-y-auto py-2.5 space-y-2 min-h-[160px] max-h-[260px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8 text-center">
              <ShoppingBag className="h-10 w-10 stroke-1 mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Press <kbd className="px-1 py-0.2 rounded bg-slate-100 font-mono text-slate-700 font-bold border">F2</kbd> to search or scan barcode
              </p>
            </div>
          ) : (
            cart.map((item, index) => {
              const isCarryBag = item.product.id === 'prod-carry-bag' || item.product.sku === 'BAG-CARRY';
              const unitRate =
                item.customPrice !== undefined
                  ? item.customPrice
                  : item.priceType === 'wholesale'
                  ? item.product.wholesalePrice
                  : item.product.retailPrice;
              const lineTotal = unitRate * item.quantity;
              const isSelected = selectedCartIndex === index;

              return (
                <div 
                  key={item.product.id}
                  onClick={() => setSelectedCartIndex(index)}
                  className={`flex flex-col p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400/40 shadow-xs'
                      : isCarryBag
                      ? 'bg-amber-50/40 border-amber-200 hover:bg-amber-50'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 block leading-snug">
                          {item.product.name}
                        </span>
                        {isCarryBag && (
                          <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                            🛍️ Carry Bag
                          </span>
                        )}
                        {isSelected && !isCarryBag && (
                          <span className="text-[9px] bg-amber-700 text-white font-bold px-1 rounded">
                            [Selected]
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          {item.product.packSize}
                        </span>
                        {isCarryBag ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCarryBagModalOpen(true);
                            }}
                            className="px-1.5 py-0.2 rounded font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300"
                            title="Edit carry bag quantity or price (थैलों की संख्या व दर बदलें)"
                          >
                            Edit Bag / Rate ✎
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={userRole === 'CASHIER'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (userRole === 'CASHIER') return;
                              toggleItemPriceType(item.product.id);
                            }}
                            className={`px-1.5 py-0.2 rounded font-semibold ${
                              item.priceType === 'wholesale' ? 'text-blue-700 bg-blue-50' : 'text-emerald-700 bg-emerald-50'
                            } ${userRole === 'CASHIER' ? 'opacity-60 cursor-not-allowed' : ''}`}
                            title={userRole === 'CASHIER' ? "Price switching locked to Owner" : "Press [W] on keyboard to toggle"}
                          >
                            {item.priceType === 'wholesale' ? 'Wholesale' : 'Retail'} {userRole === 'CASHIER' ? '🔒' : '[W] ⇄'}
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.product.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove item [Delete]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.product.id, -1);
                        }}
                        className="h-6 w-6 flex items-center justify-center rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
                        title="Press [-]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-slate-900 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.product.id, 1);
                        }}
                        className="h-6 w-6 flex items-center justify-center rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
                        title="Press [+]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">
                        ₹{unitRate} x {item.quantity}
                      </span>
                      <span className="font-black text-slate-900 font-mono text-sm">
                        ₹{lineTotal}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bill Breakdown with F4 Discount focus */}
        <div className="border-t border-slate-200 pt-2.5 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span>
          </div>

          {loyaltyDiscountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
              <span className="flex items-center gap-1">
                <Gift className="h-3.5 w-3.5" />
                <span>Loyalty Points Discount:</span>
              </span>
              <span className="font-mono">- ₹{loyaltyDiscountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <span>Manual Discount (₹):</span>
              {userRole === 'CASHIER' ? (
                <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                  🔒 Owner Only
                </span>
              ) : (
                <kbd className="font-mono text-[9px] bg-slate-100 border px-1 rounded text-slate-500">[F4]</kbd>
              )}
            </span>
            <input
              ref={discountInputRef}
              type="number"
              min={0}
              disabled={userRole === 'CASHIER'}
              value={discountTotal || ''}
              onChange={e => {
                if (userRole === 'CASHIER') return;
                setDiscountTotal(Math.max(0, parseFloat(e.target.value) || 0));
              }}
              placeholder={userRole === 'CASHIER' ? "Locked" : "0"}
              title={userRole === 'CASHIER' ? "Discount modification locked to Owner" : "Manual discount [F4]"}
              className={`w-20 text-right py-0.5 px-1.5 border rounded font-mono text-xs focus:outline-none ${
                userRole === 'CASHIER'
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'border-slate-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
              }`}
            />
          </div>

          <div className="flex justify-between">
            <span>GST Tax (Est.):</span>
            <span className="font-mono">₹{gstAmount.toFixed(2)}</span>
          </div>

          {/* Previous Due added to bill */}
          {previousDueAdded > 0 && (
            <div className="flex justify-between items-center text-rose-800 font-bold bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                <span>+ Previous Due Added:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono">+ ₹{previousDueAdded.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => setPreviousDueAdded(0)}
                  className="text-rose-500 hover:text-rose-700 p-0.5 rounded"
                  title="Remove previous due from this bill"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Advance Adjusted in bill */}
          {advanceAdjusted > 0 && (
            <div className="flex justify-between items-center text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
              <span className="flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                <span>- Advance Adjusted:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono">- ₹{advanceAdjusted.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => setAdvanceAdjusted(0)}
                  className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded"
                  title="Remove advance adjustment from this bill"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Customer Due/Advance Alert Link */}
          {((currentCustomer.outstandingCredit || 0) > 0 || (currentCustomer.advanceBalance || 0) > 0) && (
            <button
              type="button"
              id="open-balance-popup-btn"
              onClick={() => setIsBalanceAlertOpen(true)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-lg border border-slate-300 transition-colors"
            >
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-slate-600" />
                <span>Customer Ledger / Due & Advance:</span>
              </span>
              <span className="text-amber-800 font-mono underline">Manage [Alt+B]</span>
            </button>
          )}

          {roundOff !== 0 && (
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Round off:</span>
              <span className="font-mono">₹{roundOff.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-950 font-black text-base">
            <span>Total Payable:</span>
            <span className="font-mono text-xl text-amber-950">₹{grandTotal}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="pt-2.5 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Payment Mode / भुगतान माध्यम
            </label>
            <span className="text-[10px] text-slate-400 font-mono">Alt+1, 2, 3</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* Cash */}
            <button
              type="button"
              id="pay-cash-btn"
              onClick={() => {
                setPaymentMethod('Cash');
                cashTenderedRef.current?.focus();
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                paymentMethod === 'Cash'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Banknote className="h-4 w-4 mb-0.5 text-emerald-700" />
              <span className="text-xs">Cash [1]</span>
            </button>

            {/* Online UPI */}
            <button
              type="button"
              id="pay-online-btn"
              onClick={() => setPaymentMethod('Online')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                paymentMethod === 'Online'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <QrCode className="h-4 w-4 mb-0.5 text-indigo-700" />
              <span className="text-xs">UPI [2]</span>
            </button>

            {/* 7-Day Credit (B2B only) */}
            <button
              type="button"
              id="pay-credit-btn"
              disabled={!isB2B}
              onClick={() => setPaymentMethod('Credit-7-Days')}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                !isB2B
                  ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400'
                  : paymentMethod === 'Credit-7-Days'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title={!isB2B ? '7-Day Credit is ONLY for B2B Wholesale buyers' : '7 Days Credit'}
            >
              <Clock className="h-4 w-4 mb-0.5 text-blue-700" />
              <span className="text-xs">Credit [3]</span>
            </button>
          </div>

          {/* Payment Specific Sub-UI & Quick Tender Preset Buttons */}
          {paymentMethod === 'Cash' && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Cash Received:</span>
                <div className="flex items-center gap-2">
                  <input
                    ref={cashTenderedRef}
                    type="number"
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckout();
                      }
                    }}
                    placeholder={`₹${grandTotal}`}
                    className="w-24 text-right py-1 px-2 border border-slate-300 rounded-lg font-mono font-bold text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {changeDue > 0 && (
                    <span className="text-emerald-700 font-bold text-[11px] whitespace-nowrap">
                      Change: ₹{changeDue}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Cash Tender Presets */}
              <div className="flex items-center gap-1 overflow-x-auto pt-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setCashTendered(grandTotal.toString())}
                  className="px-2 py-1 rounded bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-[10px] whitespace-nowrap shadow-2xs"
                  title="Exact amount [Ctrl+0]"
                >
                  Exact (₹{grandTotal})
                </button>
                {posSettings.quickTenderPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCashTendered(preset.toString())}
                    className="px-1.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-mono font-semibold text-[10px] whitespace-nowrap shadow-2xs"
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentMethod === 'Credit-7-Days' && (
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-xs">
              <div className="flex items-center justify-between text-blue-950 font-semibold">
                <span>Credit Due Date:</span>
                <span className="font-mono underline font-bold">{getSevenDaysDueDate()}</span>
              </div>
              <p className="text-[10px] text-blue-700 mt-0.5">
                Strictly 7-day payment cycle for B2B wholesale buyers.
              </p>
            </div>
          )}
        </div>

        {/* Complete Bill Button with F9 Shortcut Badge */}
        <div className="pt-2.5 mt-2">
          <button
            type="button"
            id="checkout-btn"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full flex items-center justify-between rounded-xl bg-amber-700 hover:bg-amber-800 py-3 px-4 text-sm font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Generate Bill (बिल पूरा करें)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-amber-100">₹{grandTotal}</span>
              <kbd className="rounded bg-amber-900 px-1.5 py-0.5 text-[10px] font-mono text-amber-200">
                [F9]
              </kbd>
            </div>
          </button>
        </div>
      </div>

      {/* Barcode Scanner Camera Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        products={products}
        onProductScanned={(scannedProduct, quantity) => {
          addToCart(scannedProduct, quantity);
        }}
        isB2B={isB2B}
      />

      {/* Loyalty Redemption Modal */}
      <LoyaltyRedemptionModal
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
        customer={currentCustomer}
        currentBillSubtotal={subtotal}
        onApplyPointsDiscount={(pointsToRedeem) => {
          setRedeemedPoints(pointsToRedeem);
        }}
        onApplyOffer={(offer) => {
          setRedeemedPoints(offer.pointsCost);
          setLoyaltyOfferTitle(offer.title);
        }}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        shortcuts={posSettings.shortcuts}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Held / Parked Carts Modal */}
      <HeldCartsModal
        isOpen={isHeldCartsModalOpen}
        onClose={() => setIsHeldCartsModalOpen(false)}
        heldCarts={heldCarts}
        onResumeCart={handleResumeCart}
        onDeleteCart={(id) => setHeldCarts(removeHeldCart(id))}
        onClearAll={() => {
          if (confirm('Clear all parked bills?')) {
            saveStoredHeldCarts([]);
            setHeldCarts([]);
          }
        }}
      />

      {/* Full POS Customization Modal */}
      <PosSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={posSettings}
        onSaveSettings={onUpdatePosSettings}
      />

      {/* Customer Previous Due & Advance Balance Alert Popup (Right-hand side popup) */}
      <CustomerBalanceAlertPopup
        isOpen={isBalanceAlertOpen}
        onClose={() => setIsBalanceAlertOpen(false)}
        customer={currentCustomer}
        pendingInvoices={customerPendingInvoices}
        currentDueAdded={previousDueAdded}
        currentAdvanceAdjusted={advanceAdjusted}
        onApplyDue={(amt) => {
          setPreviousDueAdded(amt);
          playQtyChange(true, soundOpts);
        }}
        onRemoveDue={() => {
          setPreviousDueAdded(0);
          playItemRemoved(soundOpts);
        }}
        onApplyAdvance={(amt) => {
          setAdvanceAdjusted(amt);
          playQtyChange(true, soundOpts);
        }}
        onRemoveAdvance={() => {
          setAdvanceAdjusted(0);
          playItemRemoved(soundOpts);
        }}
        cartTotal={grandTotal}
      />

      {/* Customer Loyalty & Credit Profile Modal in POS */}
      {isEditLoyaltyCreditOpen && onUpdateCustomer && (
        <CustomerLoyaltyCreditModal
          isOpen={isEditLoyaltyCreditOpen}
          customer={currentCustomer}
          onClose={() => setIsEditLoyaltyCreditOpen(false)}
          onSave={(updatedCust) => {
            onUpdateCustomer(updatedCust);
            if (onSelectCustomer) {
              onSelectCustomer(updatedCust, previousDueAdded, advanceAdjusted);
            }
          }}
        />
      )}

      {/* Carry Bag Configuration Modal */}
      <CarryBagModal
        isOpen={isCarryBagModalOpen}
        onClose={() => setIsCarryBagModalOpen(false)}
        onAddBags={handleAddCarryBags}
        currentBagCount={carryBagInCart?.quantity || 0}
        currentBagPrice={carryBagInCart?.unitPrice || 5}
      />

      {/* Owner Passcode Authorization Prompt for Cashier Gated Actions */}
      {ownerAuthPrompt && (
        <PasscodeModal
          isOpen={true}
          onClose={() => setOwnerAuthPrompt(null)}
          requiredRole="OWNER"
          title="Owner Passcode Required"
          subtitle={`Owner authorization is required for: "${ownerAuthPrompt.action}". Enter Owner Passcode to proceed:`}
          onSuccess={() => {
            const cb = ownerAuthPrompt.onAuthorized;
            setOwnerAuthPrompt(null);
            cb();
          }}
        />
      )}
    </div>
  );
};
