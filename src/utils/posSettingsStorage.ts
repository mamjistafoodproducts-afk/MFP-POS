import { PosSettings, StoreProfile, KeyboardShortcutsConfig, HeldCart } from '../types';

const SETTINGS_STORAGE_KEY = 'annapurna_pos_custom_settings';
const HELD_CARTS_STORAGE_KEY = 'annapurna_pos_held_carts';

export const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: 'Mamjista Food Products',
  storeNameHindi: 'ममजिस्टा फूड प्रोडक्ट्स',
  tagline: 'Mfr of Fresh Chakki Atta, Besan, Bhuna Sattu & Pure Ground Spices',
  gstin: '08AABCA1234F1Z1',
  fssaiNumber: '12224026000189',
  phone: '9829012345',
  address: 'Mandi Yard Gate #1, Industrial Area',
  receiptHeaderNote: 'Freshly milled stone-ground pure flours & whole ground spices',
  receiptFooterNote: 'Thank you for buying fresh & pure! Quality Guaranteed.',
  terms: 'Goods once sold under FIFO batch assurance can be exchanged within 48 hours with receipt.'
};

export const DEFAULT_SHORTCUTS: KeyboardShortcutsConfig = {
  focusSearch: 'F2',
  changeCustomer: 'F3',
  manualDiscount: 'F4',
  cycleCategories: 'F5',
  holdCart: 'F6',
  recallCart: 'F7',
  clearCart: 'F8',
  completeBill: 'F9',
  printReceipt: 'F10',
  openSettings: 'F11',
  lockScreen: 'F12',
  toggleHelp: 'F1',
  payCash: 'Alt+1',
  payOnline: 'Alt+2',
  payCredit: 'Alt+3'
};

export const DEFAULT_POS_SETTINGS: PosSettings = {
  storeProfile: DEFAULT_STORE_PROFILE,
  shortcuts: DEFAULT_SHORTCUTS,
  defaultPaymentMethod: 'Cash',
  enableSoundEffects: true,
  soundVolume: 0.7,
  uiDensity: 'compact',
  autoPrintReceipt: false,
  showHindiNames: true,
  autoFocusSearchAfterAdd: true,
  quickTenderPresets: [50, 100, 200, 500, 1000, 2000],
  receiptPaperSize: '80mm',
  enableFastQuantityMultiplier: true
};

export function getStoredPosSettings(): PosSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_POS_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_POS_SETTINGS,
      ...parsed,
      storeProfile: {
        ...DEFAULT_STORE_PROFILE,
        ...(parsed.storeProfile || {})
      },
      shortcuts: {
        ...DEFAULT_SHORTCUTS,
        ...(parsed.shortcuts || {})
      }
    };
  } catch (e) {
    console.warn('Failed to load stored POS settings, using defaults', e);
    return DEFAULT_POS_SETTINGS;
  }
}

export function saveStoredPosSettings(settings: PosSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save POS settings', e);
  }
}

export function getStoredHeldCarts(): HeldCart[] {
  try {
    const raw = localStorage.getItem(HELD_CARTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load held carts', e);
    return [];
  }
}

export function saveStoredHeldCarts(carts: HeldCart[]): void {
  try {
    localStorage.setItem(HELD_CARTS_STORAGE_KEY, JSON.stringify(carts));
  } catch (e) {
    console.error('Failed to save held carts', e);
  }
}

export function addHeldCart(cart: HeldCart): HeldCart[] {
  const current = getStoredHeldCarts();
  const updated = [cart, ...current];
  saveStoredHeldCarts(updated);
  return updated;
}

export function removeHeldCart(id: string): HeldCart[] {
  const current = getStoredHeldCarts();
  const updated = current.filter(c => c.id !== id);
  saveStoredHeldCarts(updated);
  return updated;
}
