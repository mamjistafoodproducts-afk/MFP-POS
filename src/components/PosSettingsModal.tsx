import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Store, 
  Sliders, 
  Keyboard, 
  Volume2, 
  VolumeX, 
  Printer, 
  Check, 
  RotateCcw, 
  Sparkles,
  Zap,
  Save,
  DollarSign,
  FileText
} from 'lucide-react';
import { PosSettings, StoreProfile, KeyboardShortcutsConfig } from '../types';
import { DEFAULT_POS_SETTINGS } from '../utils/posSettingsStorage';
import { eventToShortcutString } from '../utils/shortcutMatcher';
import { playScanSuccess, playSaleCompleteChime } from '../utils/audioEffects';

interface PosSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PosSettings;
  onSaveSettings: (newSettings: PosSettings) => void;
}

export const PosSettingsModal: React.FC<PosSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'shortcuts'>('billing');
  const [formSettings, setFormSettings] = useState<PosSettings>(settings);
  const [recordingKeyAction, setRecordingKeyAction] = useState<keyof KeyboardShortcutsConfig | null>(null);
  const [presetInput, setPresetInput] = useState(settings.quickTenderPresets.join(', '));
  const [saveToast, setSaveToast] = useState(false);

  if (!isOpen) return null;

  const handleProfileChange = (key: keyof StoreProfile, val: string) => {
    setFormSettings(prev => ({
      ...prev,
      storeProfile: {
        ...prev.storeProfile,
        [key]: val
      }
    }));
  };

  const handleShortcutKeyDown = (e: React.KeyboardEvent, actionKey: keyof KeyboardShortcutsConfig) => {
    e.preventDefault();
    e.stopPropagation();

    // Ignore solitary modifier presses
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

    const shortcutString = eventToShortcutString(e.nativeEvent);
    setFormSettings(prev => ({
      ...prev,
      shortcuts: {
        ...prev.shortcuts,
        [actionKey]: shortcutString
      }
    }));
    setRecordingKeyAction(null);
  };

  const handleSave = () => {
    // Parse presets
    const parsedPresets = presetInput
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0);

    const updated: PosSettings = {
      ...formSettings,
      quickTenderPresets: parsedPresets.length > 0 ? parsedPresets : [50, 100, 200, 500, 1000, 2000]
    };

    onSaveSettings(updated);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all POS settings and shortcuts to original factory defaults?')) {
      setFormSettings(DEFAULT_POS_SETTINGS);
      setPresetInput(DEFAULT_POS_SETTINGS.quickTenderPresets.join(', '));
    }
  };

  const handleTestSound = () => {
    if (formSettings.enableSoundEffects) {
      playSaleCompleteChime({ enabled: true, volume: formSettings.soundVolume });
    }
  };

  return (
    <div 
      id="pos-settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="pos-settings-card"
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 px-6 py-4 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-300/30 text-amber-200">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                POS Customization &amp; System Settings (पीओएस सेटिंग्स)
              </h3>
              <p className="text-xs text-amber-200/80">
                Customize Store Details, Rapid Billing Defaults, Audio Feedback &amp; Keyboard Bindings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-amber-200/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'billing'
                ? 'border-amber-700 text-amber-900 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span>Rapid Billing &amp; Hardware</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'shortcuts'
                ? 'border-amber-700 text-amber-900 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5 text-blue-600" />
            <span>Keyboard Shortcuts Remapper</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-amber-700 text-amber-900 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="h-3.5 w-3.5 text-emerald-600" />
            <span>Store &amp; Receipt Profile</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-800 space-y-6">
          {/* TAB 1: RAPID BILLING & HARDWARE */}
          {activeTab === 'billing' && (
            <div className="space-y-5">
              {/* Screen Density */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Cashier UI Density (स्क्रीन लेआउट घनत्व)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'compact', title: 'Compact (Super Fast)', desc: 'Maximizes visible items for high-speed cashiers on desktop/laptop' },
                    { id: 'comfortable', title: 'Comfortable', desc: 'Standard balanced spacing for regular desktop monitors' },
                    { id: 'spacious', title: 'Spacious Touch', desc: 'Extra large touch-friendly targets for tablets & touchscreens' },
                  ].map(d => (
                    <div
                      key={d.id}
                      onClick={() => setFormSettings(prev => ({ ...prev, uiDensity: d.id as any }))}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        formSettings.uiDensity === d.id
                          ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{d.title}</span>
                        {formSettings.uiDensity === d.id && (
                          <Check className="h-4 w-4 text-amber-700" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{d.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fast Typing & Scanner Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Auto-focus search after adding */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    id="auto-focus-search-check"
                    checked={formSettings.autoFocusSearchAfterAdd}
                    onChange={e => setFormSettings(prev => ({ ...prev, autoFocusSearchAfterAdd: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-500"
                  />
                  <div>
                    <label htmlFor="auto-focus-search-check" className="font-bold text-xs text-slate-900 cursor-pointer">
                      Auto-Focus Search After Adding Item
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Keeps keyboard cursor in the search box so you can type and add items continuously without touching mouse.
                    </p>
                  </div>
                </div>

                {/* Fast Quantity Multiplier (5*atta) */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    id="fast-qty-multiplier-check"
                    checked={formSettings.enableFastQuantityMultiplier}
                    onChange={e => setFormSettings(prev => ({ ...prev, enableFastQuantityMultiplier: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-500"
                  />
                  <div>
                    <label htmlFor="fast-qty-multiplier-check" className="font-bold text-xs text-slate-900 cursor-pointer">
                      Enable Multiplier Search (e.g. 5*atta)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Type quantity multiplier followed by star to add multiple bags instantly on pressing Enter.
                    </p>
                  </div>
                </div>

                {/* Auto Print Receipt */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    id="auto-print-check"
                    checked={formSettings.autoPrintReceipt}
                    onChange={e => setFormSettings(prev => ({ ...prev, autoPrintReceipt: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-500"
                  />
                  <div>
                    <label htmlFor="auto-print-check" className="font-bold text-xs text-slate-900 cursor-pointer">
                      Auto-Open Print Dialog On Bill Complete
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Immediately triggers thermal printer prompt when generating a bill.
                    </p>
                  </div>
                </div>

                {/* Show Hindi Names */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    id="show-hindi-check"
                    checked={formSettings.showHindiNames}
                    onChange={e => setFormSettings(prev => ({ ...prev, showHindiNames: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-500"
                  />
                  <div>
                    <label htmlFor="show-hindi-check" className="font-bold text-xs text-slate-900 cursor-pointer">
                      Show Hindi Product Names (हिंदी नाम दिखाएं)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Displays Hindi names like चक्की ताजा आटा, चना बेसन in catalog, search, and receipts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Audio Sound Feedback */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {formSettings.enableSoundEffects ? (
                      <Volume2 className="h-4 w-4 text-amber-700" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="font-bold text-xs text-slate-900">
                      POS Audio Sound Effects (स्कैन व बिलिंग बीप ध्वनि)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSettings.enableSoundEffects}
                      onChange={e => setFormSettings(prev => ({ ...prev, enableSoundEffects: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-700"></div>
                  </label>
                </div>

                {formSettings.enableSoundEffects && (
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-xs text-slate-600">Volume:</span>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={formSettings.soundVolume}
                      onChange={e => setFormSettings(prev => ({ ...prev, soundVolume: parseFloat(e.target.value) }))}
                      className="flex-1 accent-amber-700"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 w-12 text-right">
                      {Math.round(formSettings.soundVolume * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={handleTestSound}
                      className="rounded-lg bg-amber-100 hover:bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900 transition-colors"
                    >
                      Test Chime
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Cash Tender Presets */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Quick Cash Tender Denomination Presets (रुपये के त्वरित बटन)
                </label>
                <input
                  type="text"
                  value={presetInput}
                  onChange={e => setPresetInput(e.target.value)}
                  placeholder="50, 100, 200, 500, 1000, 2000"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-xs text-slate-900 focus:border-amber-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">
                  Enter comma-separated rupee amounts to show as rapid one-click cash tender buttons in checkout.
                </p>
              </div>

              {/* Default Payment Method */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Default Payment Method On New Bill
                </label>
                <div className="flex gap-3">
                  {(['Cash', 'Online', 'Credit-7-Days'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormSettings(prev => ({ ...prev, defaultPaymentMethod: method }))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        formSettings.defaultPaymentMethod === method
                          ? 'bg-amber-800 text-white border-amber-900 ring-2 ring-amber-700/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEYBOARD SHORTCUTS REMAPPER */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-blue-700 shrink-0" />
                  <span>
                    Click on any shortcut key box below, then press your desired computer keyboard key to rebind it!
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'focusSearch', label: 'Focus Product Search / Barcode', defaultKey: 'F2' },
                  { key: 'changeCustomer', label: 'Change Customer / Lookup', defaultKey: 'F3' },
                  { key: 'manualDiscount', label: 'Manual Bill Discount (₹)', defaultKey: 'F4' },
                  { key: 'cycleCategories', label: 'Cycle Product Categories', defaultKey: 'F5' },
                  { key: 'holdCart', label: 'Park / Hold Current Bill', defaultKey: 'F6' },
                  { key: 'recallCart', label: 'Recall Parked Bill', defaultKey: 'F7' },
                  { key: 'clearCart', label: 'Clear Current Cart', defaultKey: 'F8' },
                  { key: 'completeBill', label: 'Complete Bill / Tender Checkout', defaultKey: 'F9' },
                  { key: 'printReceipt', label: 'Print Bill / Receipt', defaultKey: 'F10' },
                  { key: 'openSettings', label: 'Open POS Settings', defaultKey: 'F11' },
                  { key: 'lockScreen', label: 'Lock Register Screen', defaultKey: 'F12' },
                  { key: 'toggleHelp', label: 'Toggle Shortcuts Help Sheet', defaultKey: 'F1' },
                  { key: 'payCash', label: 'Select Cash Mode', defaultKey: 'Alt+1' },
                  { key: 'payOnline', label: 'Select UPI Mode', defaultKey: 'Alt+2' },
                  { key: 'payCredit', label: 'Select 7-Day Credit Mode', defaultKey: 'Alt+3' },
                ].map(item => {
                  const actionKey = item.key as keyof KeyboardShortcutsConfig;
                  const currentShortcut = formSettings.shortcuts[actionKey];
                  const isRecording = recordingKeyAction === actionKey;

                  return (
                    <div 
                      key={item.key}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isRecording 
                          ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-500/30'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <span className="font-semibold text-xs text-slate-800">{item.label}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          tabIndex={0}
                          onClick={() => setRecordingKeyAction(actionKey)}
                          onKeyDown={e => {
                            if (isRecording) {
                              handleShortcutKeyDown(e, actionKey);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs border shadow-xs transition-all ${
                            isRecording
                              ? 'bg-amber-700 text-white border-amber-800 animate-pulse'
                              : 'bg-white text-amber-900 border-slate-300 hover:border-amber-400'
                          }`}
                        >
                          {isRecording ? 'Press Key...' : currentShortcut}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STORE & RECEIPT PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Store Name (English)
                  </label>
                  <input
                    type="text"
                    value={formSettings.storeProfile.storeName}
                    onChange={e => handleProfileChange('storeName', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Store Name (Hindi / स्थानीय नाम)
                  </label>
                  <input
                    type="text"
                    value={formSettings.storeProfile.storeNameHindi}
                    onChange={e => handleProfileChange('storeNameHindi', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Tagline / Description
                  </label>
                  <input
                    type="text"
                    value={formSettings.storeProfile.tagline}
                    onChange={e => handleProfileChange('tagline', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={formSettings.storeProfile.gstin}
                    onChange={e => handleProfileChange('gstin', e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    FSSAI License Number
                  </label>
                  <input
                    type="text"
                    value={formSettings.storeProfile.fssaiNumber}
                    onChange={e => handleProfileChange('fssaiNumber', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Store Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={formSettings.storeProfile.phone}
                    onChange={e => handleProfileChange('phone', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Thermal Printer Paper Size
                  </label>
                  <select
                    value={formSettings.receiptPaperSize}
                    onChange={e => setFormSettings(prev => ({ ...prev, receiptPaperSize: e.target.value as any }))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-900 focus:border-amber-600 focus:outline-none bg-white"
                  >
                    <option value="80mm">80mm Thermal POS Receipt (Standard Counter)</option>
                    <option value="58mm">58mm Thermal Receipt (Mini Mobile Printer)</option>
                    <option value="A4">A4 Full Page GST Tax Invoice</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Address / Mandi Location
                  </label>
                  <input
                    type="text"
                    value={formSettings.storeProfile.address}
                    onChange={e => handleProfileChange('address', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Receipt Footer Note / Return Policy
                  </label>
                  <textarea
                    rows={2}
                    value={formSettings.storeProfile.receiptFooterNote}
                    onChange={e => handleProfileChange('receiptFooterNote', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Factory Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              Cancel [Esc]
            </button>

            <button
              type="button"
              id="save-pos-settings-btn"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saveToast ? 'Saved ✓' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
