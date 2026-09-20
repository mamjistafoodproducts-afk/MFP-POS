import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  Layers, 
  Plus, 
  Minus, 
  Keyboard, 
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Product } from '../types';
import { findProductByCode, searchProductsByBarcodeOrSKU, playBarcodeBeep } from '../utils/barcodeLookup';
import { BarcodeBadge } from './BarcodeBadge';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductScanned: (product: Product, quantity: number) => void;
  isB2B?: boolean;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductScanned,
  isB2B = false
}) => {
  const [manualCode, setManualCode] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [scanQuantity, setScanQuantity] = useState(1);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(true);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not supported in this browser. Please use manual code entry or quick barcode buttons.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);

      // Check if native BarcodeDetector API is available
      if ('BarcodeDetector' in window) {
        startNativeBarcodeDetection();
      }
    } catch (err: any) {
      setCameraError('Camera access unavailable or declined. You can scan by entering Barcode / SKU manually or clicking sample barcodes below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startNativeBarcodeDetection = async () => {
    try {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      const detector = new BarcodeDetectorClass({
        formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
      });

      const intervalId = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            handleCodeFound(rawValue);
          }
        } catch {
          // Frame detection dropped
        }
      }, 500);

      return () => clearInterval(intervalId);
    } catch {
      // Native detector unavailable
    }
  };

  const handleCodeFound = (code: string) => {
    const matched = findProductByCode(products, code);
    if (matched) {
      playBarcodeBeep();
      setLastScannedProduct(matched);
      setScanQuantity(1);
      setScanSuccessMessage(`Found: ${matched.name} (${matched.packSize})`);
      setManualCode('');

      if (continuousMode) {
        onProductScanned(matched, 1);
      }
    } else {
      setScanSuccessMessage(null);
      alert(`No product found for barcode / SKU "${code}". Please verify code or add it in inventory.`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeFound(manualCode.trim());
  };

  const handleConfirmAdd = () => {
    if (!lastScannedProduct) return;
    onProductScanned(lastScannedProduct, scanQuantity);
    if (!continuousMode) {
      onClose();
    } else {
      setLastScannedProduct(null);
      setScanQuantity(1);
    }
  };

  // Filter products for quick-scan buttons
  const sampleProducts = products.filter(p => {
    if (selectedCategoryFilter === 'ALL') return true;
    return p.category === selectedCategoryFilter;
  });

  if (!isOpen) return null;

  return (
    <div 
      id="barcode-scanner-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>बारकोड स्कैनर (Barcode Scanner)</span>
                <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                  USB / Camera Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Scan product barcode with camera, barcode gun, or type SKU/Barcode below
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="hidden sm:flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                checked={continuousMode}
                onChange={e => setContinuousMode(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-amber-500 focus:ring-0"
              />
              <span>Auto-Add (सतत स्कैन)</span>
            </label>
            <button
              type="button"
              id="close-scanner-btn"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Top Section: Viewfinder + Manual Entry */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Camera Viewfinder Column (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative w-full aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center text-slate-400 space-y-2">
                    <Camera className="h-10 w-10 mx-auto text-slate-600 stroke-1" />
                    <p className="text-xs font-semibold text-slate-300">
                      Camera Standby / Viewfinder
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {cameraError || 'Point camera at product barcode sticker'}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
                    >
                      Enable Camera
                    </button>
                  </div>
                )}

                {/* Laser scan line animation */}
                <div className="pointer-events-none absolute inset-x-6 top-0 bottom-0 flex flex-col justify-center">
                  <div className="relative h-28 border-2 border-dashed border-amber-400/80 rounded-lg flex items-center justify-center">
                    <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse"></div>
                    <span className="text-[10px] font-mono text-amber-300 bg-black/60 px-2 py-0.5 rounded">
                      Align Barcode Here
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between w-full text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Volume2 className="h-3.5 w-3.5 text-slate-400" />
                  Beep on scan enabled
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  Code-128 / EAN-13
                </span>
              </div>
            </div>

            {/* Manual Entry & Scanned Product Action Column (7 cols) */}
            <div className="md:col-span-7 flex flex-col space-y-3">
              {/* Manual Input Form */}
              <form onSubmit={handleManualSubmit} className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Manual Barcode / SKU / Code Entry (मैन्युअल प्रविष्टि)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Keyboard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      id="manual-barcode-input"
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                      placeholder="e.g. 890600100101, ATT-10K, or name..."
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm font-mono text-slate-900 focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    id="submit-barcode-btn"
                    className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <span>Lookup</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tip: If barcode is unreadable, enter the 12-digit number or SKU printed on packet.
                </p>
              </form>

              {/* Scanned Item Detail Card */}
              {lastScannedProduct ? (
                <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50/60 p-3.5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <h4 className="font-bold text-slate-900 text-sm">
                          {lastScannedProduct.name}
                        </h4>
                      </div>
                      <p className="text-xs text-emerald-900 font-semibold pl-7">
                        {lastScannedProduct.hindiName}
                      </p>
                      <div className="pl-7 mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                          {lastScannedProduct.packSize}
                        </span>
                        <span className="font-mono text-slate-500">
                          SKU: {lastScannedProduct.sku}
                        </span>
                        <span className="font-mono text-slate-500">
                          Barcode: {lastScannedProduct.barcode}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 font-mono block">
                        ₹{isB2B ? lastScannedProduct.wholesalePrice : lastScannedProduct.retailPrice}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isB2B ? 'Wholesale Rate' : 'Retail Rate'}
                      </span>
                    </div>
                  </div>

                  {/* Quantity and Confirm */}
                  <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">Quantity:</span>
                      <div className="flex items-center rounded-lg bg-white border border-emerald-300 p-0.5">
                        <button
                          type="button"
                          onClick={() => setScanQuantity(Math.max(1, scanQuantity - 1))}
                          className="h-7 w-7 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-slate-900 font-mono text-sm">
                          {scanQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setScanQuantity(scanQuantity + 1)}
                          className="h-7 w-7 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="confirm-add-scanned-btn"
                      onClick={handleConfirmAdd}
                      className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add To Bill (बिल में जोड़ें)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-400 bg-slate-50">
                  <Scan className="h-8 w-8 mx-auto stroke-1 text-slate-300 mb-1.5" />
                  <p className="text-xs font-medium text-slate-600">
                    Awaiting scan...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Scan via camera, plug in USB barcode gun, or click any product barcode below to test
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick-Scan Palette / Sample Barcodes for 1-Click Testing */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Test &amp; Quick-Scan Barcode Palette (त्वरित बारकोड टेस्ट)
                </span>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                {['ALL', 'Atta', 'Besan', 'Sattu', 'Masale'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      selectedCategoryFilter === cat
                        ? 'bg-amber-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {sampleProducts.map(p => (
                <div
                  key={p.id}
                  id={`quick-scan-prod-${p.id}`}
                  onClick={() => handleCodeFound(p.barcode || p.sku)}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer"
                  title="Click to simulate scanning this product barcode"
                >
                  <div className="min-w-0 pr-2">
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-amber-800 truncate">
                      {p.name}
                    </h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[9px] bg-slate-100 px-1 py-0.2 rounded text-slate-600 font-semibold">
                        {p.packSize}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">
                        {p.barcode}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <BarcodeBadge code={p.barcode} width={90} height={26} showText={false} />
                    <span className="text-[10px] font-bold text-amber-700 group-hover:underline mt-0.5">
                      Simulate Scan ⚡
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {continuousMode ? '⚡ Continuous auto-add enabled' : 'Manual add mode'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Done Scanning (पूर्ण)
          </button>
        </div>
      </div>
    </div>
  );
};
