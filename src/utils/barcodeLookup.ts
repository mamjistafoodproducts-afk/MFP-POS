import { useEffect, useRef } from 'react';
import { Product } from '../types';

/**
 * Finds a product by barcode, SKU (case-insensitive), or exact ID
 */
export function findProductByCode(products: Product[], code: string): Product | undefined {
  if (!code) return undefined;
  const clean = code.trim().toLowerCase();

  return products.find(p => 
    (p.barcode && p.barcode.toLowerCase() === clean) ||
    p.sku.toLowerCase() === clean ||
    p.id.toLowerCase() === clean
  );
}

/**
 * Searches products by partial code, barcode, SKU or name
 */
export function searchProductsByBarcodeOrSKU(products: Product[], query: string): Product[] {
  if (!query) return [];
  const clean = query.trim().toLowerCase();

  return products.filter(p =>
    (p.barcode && p.barcode.toLowerCase().includes(clean)) ||
    p.sku.toLowerCase().includes(clean) ||
    p.name.toLowerCase().includes(clean) ||
    p.hindiName.toLowerCase().includes(clean)
  );
}

/**
 * Play standard POS barcode beep sound using Web Audio API
 */
export function playBarcodeBeep(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch POS beep (A6)
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Silent fail if audio blocked by autoplay policy
  }
}

export interface UseHardwareBarcodeScannerOptions {
  products?: Product[];
  onProductScanned?: (product: Product, quantity?: number) => void;
  onBarcodeScanned?: (barcode: string) => void;
  enabled?: boolean;
}

/**
 * Hook to listen for USB/Bluetooth hardware barcode scanner inputs (keyboard wedge)
 * Hardware scanners send keystrokes with very short intervals (<40ms) terminating with 'Enter'.
 */
export function useHardwareBarcodeScanner(
  optionsOrCallback: ((barcode: string) => void) | UseHardwareBarcodeScannerOptions,
  enabledParam = true
) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const isOptionsObj = typeof optionsOrCallback === 'object' && optionsOrCallback !== null;
  const enabled = isOptionsObj ? (optionsOrCallback.enabled ?? true) : enabledParam;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing inside an active input or textarea
      const target = e.target as HTMLElement | null;
      const isTypingInInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // If user is inside an input, only intercept if it's the dedicated barcode input or not handled
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Most hardware barcode scanners type all characters within 20-50ms of each other
      if (e.key === 'Enter') {
        const scannedCode = bufferRef.current.trim();
        bufferRef.current = '';

        if (scannedCode.length >= 3) {
          playBarcodeBeep();

          if (isOptionsObj) {
            const { products = [], onProductScanned, onBarcodeScanned } = optionsOrCallback;
            if (onProductScanned) {
              const matchedProduct = findProductByCode(products, scannedCode);
              if (matchedProduct) {
                onProductScanned(matchedProduct, 1);
              } else if (onBarcodeScanned) {
                onBarcodeScanned(scannedCode);
              }
            } else if (onBarcodeScanned) {
              onBarcodeScanned(scannedCode);
            }
          } else if (typeof optionsOrCallback === 'function') {
            optionsOrCallback(scannedCode);
          }
        }
        return;
      }

      // If key is a printable single character
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (timeDiff > 120 && !isTypingInInput) {
          // If paused for more than 120ms, reset buffer (it was human typing, not a scanner burst)
          bufferRef.current = e.key;
        } else {
          bufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [optionsOrCallback, enabled, isOptionsObj]);
}

/**
 * Generates an array of bar widths for Code-128 visual barcode pattern representation
 */
export function generateBarcodeBarPattern(code: string): number[] {
  // Deterministic pseudo-pattern based on characters in code
  const bars: number[] = [2, 1, 1, 2]; // Start guard
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    hash = (hash * 31 + charCode) % 1000;
    // Map each char to 3 pairs of bar-space
    bars.push((charCode % 3) + 1);
    bars.push(((charCode >> 1) % 2) + 1);
    bars.push(((charCode >> 2) % 3) + 1);
    bars.push(1);
  }
  bars.push(2, 1, 2, 2); // Stop guard
  return bars;
}
