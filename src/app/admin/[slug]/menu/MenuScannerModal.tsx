'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  X, 
  Check, 
  Loader2, 
  FileText, 
  Utensils, 
  Image as ImageIcon, 
  DollarSign, 
  Edit3, 
  Trash2, 
  Plus, 
  ArrowRight, 
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Key
} from 'lucide-react';
import { SAMPLE_MENU_PRESETS, ScannedMenuItem, inferDietaryType } from '@/lib/menuScanner';
import { getFoodPhotoForDish, getFoodPhotoOptions, FoodPhotoResult } from '@/lib/foodImageSearch';
import { Restaurant, Category } from '@/types/database';
import { DataStore } from '@/lib/store';

interface MenuScannerModalProps {
  restaurant: Restaurant;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function MenuScannerModal({
  restaurant,
  categories,
  isOpen,
  onClose,
  onSuccess,
}: MenuScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'PHOTO' | 'TEXT' | 'PRESET'>('PHOTO');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [detectedItems, setDetectedItems] = useState<ScannedMenuItem[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gemini_api_key') || '';
      if (saved) setGeminiApiKey(saved);
    }
  }, []);

  const handleSaveGeminiKey = (key: string) => {
    setGeminiApiKey(key);
    if (typeof window !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem('gemini_api_key', key.trim());
      } else {
        localStorage.removeItem('gemini_api_key');
      }
    }
  };

  // Photo Picker Modal for individual item
  const [photoPickerItem, setPhotoPickerItem] = useState<ScannedMenuItem | null>(null);
  const [photoOptions, setPhotoOptions] = useState<FoodPhotoResult[]>([]);
  const [customPhotoQuery, setCustomPhotoQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform AI scan
  const handleStartScan = async (params: { presetId?: string; imageBase64?: string; text?: string }) => {
    try {
      setIsScanning(true);
      setStatusMessage(null);
      setScanStep('Analyzing menu photo layout and typography...');

      const timer1 = setTimeout(() => {
        setScanStep('Detecting dishes, categories & prices...');
      }, 700);

      const timer2 = setTimeout(() => {
        setScanStep('Matching dishes with appetizing web food photos...');
      }, 1400);

      const response = await fetch('/api/menu/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetId: params.presetId,
          imageBase64: params.imageBase64,
          rawText: params.text,
          currency: restaurant.currency || '₹',
          clientApiKey: geminiApiKey.trim() || undefined,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await response.json();

      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setDetectedItems(data.items);
        setIsReviewing(true);
      } else {
        setStatusMessage(data.error || 'Could not detect menu items. Try another photo or a preset.');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Scanning failed. Please check network and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Open photo replacement picker
  const handleOpenPhotoPicker = (item: ScannedMenuItem) => {
    setPhotoPickerItem(item);
    setCustomPhotoQuery(item.name);
    const options = getFoodPhotoOptions(item.name, item.category);
    setPhotoOptions(options);
  };

  const handleSearchCustomPhoto = () => {
    if (!customPhotoQuery.trim()) return;
    const options = getFoodPhotoOptions(customPhotoQuery);
    setPhotoOptions(options);
  };

  const handleSelectPhoto = (url: string) => {
    if (!photoPickerItem) return;
    setDetectedItems((prev) =>
      prev.map((it) => (it.id === photoPickerItem.id ? { ...it, image_url: url } : it))
    );
    setPhotoPickerItem(null);
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setDetectedItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  // Edit draft item
  const handleUpdateItem = (id: string, updates: Partial<ScannedMenuItem>) => {
    setDetectedItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  // Remove draft item
  const handleRemoveItem = (id: string) => {
    setDetectedItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Bulk import into DataStore
  const handleImportAll = async () => {
    const selected = detectedItems.filter((it) => it.selected !== false);
    if (selected.length === 0) {
      alert('Please select at least 1 dish to import.');
      return;
    }

    try {
      setIsImporting(true);

      // 1. Ensure categories exist
      const categoryMap = new Map<string, string>();
      for (const cat of categories) {
        categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
      }

      const itemsToSave: Array<any> = [];

      for (const item of selected) {
        let catId = categoryMap.get(item.category.toLowerCase().trim());
        if (!catId) {
          const newCat = await DataStore.ensureCategory(restaurant.id, item.category);
          catId = newCat.id;
          categoryMap.set(item.category.toLowerCase().trim(), catId);
        }

        itemsToSave.push({
          restaurant_id: restaurant.id,
          category_id: catId,
          name: item.name,
          price: item.price,
          description: item.description,
          image_url: item.image_url,
          is_veg: item.is_veg,
          is_available: true,
        });
      }

      await DataStore.saveBulkMenuItems(itemsToSave);
      await onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Failed to import items into database');
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = detectedItems.filter((i) => i.selected !== false).length;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden min-w-0 mx-2 sm:mx-auto">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-800 bg-stone-900/95 flex items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">AI Menu Scanner</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase whitespace-nowrap shrink-0">
                  Auto-Detect + Web Photos
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate">
                Snap or upload a photo of your printed menu card to auto-import dishes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
          {!isReviewing ? (
            /* STAGE 1: UPLOAD / SNAP / SELECT PRESET */
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 p-1 bg-stone-950 border border-stone-800 rounded-2xl max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('PHOTO')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'PHOTO'
                      ? 'bg-amber-500 text-stone-950 shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Menu Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PRESET')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'PRESET'
                      ? 'bg-amber-500 text-stone-950 shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sample Menu Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('TEXT')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'TEXT'
                      ? 'bg-amber-500 text-stone-950 shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Text</span>
                </button>
              </div>

              {/* Free AI Engine Configuration & Status */}
              <div className="max-w-xl mx-auto bg-stone-950/80 border border-stone-800/90 rounded-2xl p-3 sm:p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-bold text-stone-300">Vision Engine:</span>
                    {geminiApiKey.trim() ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Google Gemini 1.5 Flash (Active)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Free Server OCR Engine (Active)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="text-stone-400 hover:text-amber-400 font-bold transition text-[11px] underline"
                  >
                    {showKeyInput ? 'Close Settings' : geminiApiKey.trim() ? 'Change Key' : 'Add Free Gemini Key'}
                  </button>
                </div>

                {showKeyInput && (
                  <div className="pt-2 border-t border-stone-800/80 space-y-2 text-[11px]">
                    <p className="text-stone-400 leading-relaxed">
                      Google offers a <strong>100% free Gemini API tier</strong> (15 requests/minute, no credit card required) at{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:underline font-bold"
                      >
                        aistudio.google.com ↗
                      </a>
                      . Paste it below to enable Gemini Vision, or leave it blank to use the built-in free local OCR engine with zero setup!
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => handleSaveGeminiKey(e.target.value)}
                        placeholder="Paste AI Studio Key (AIzaSy...)"
                        className="flex-1 bg-stone-900 border border-stone-750 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                      {geminiApiKey && (
                        <button
                          type="button"
                          onClick={() => handleSaveGeminiKey('')}
                          className="px-2.5 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-white rounded-xl text-xs font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* TAB 1: PHOTO UPLOAD & CAMERA */}
              {activeTab === 'PHOTO' && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Dropzone / Preview */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition relative overflow-hidden group ${
                      selectedImage
                        ? 'border-amber-500/60 bg-amber-500/5'
                        : 'border-stone-800 hover:border-amber-500/50 bg-stone-950/60 hover:bg-stone-950'
                    }`}
                  >
                    {selectedImage ? (
                      <div className="space-y-4">
                        <div className="relative max-h-64 mx-auto rounded-2xl overflow-hidden border border-stone-800 shadow-xl inline-block">
                          <img
                            src={selectedImage}
                            alt="Uploaded Menu"
                            className="max-h-64 object-contain mx-auto"
                          />
                          {isScanning && (
                            <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                              <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                              <p className="text-xs font-black text-amber-400 px-4 py-1.5 bg-stone-900 rounded-full border border-amber-500/30">
                                {scanStep}
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-stone-400">
                          Click to choose a different photo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                          <Upload className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">
                            Upload or drag & drop photo of your menu card
                          </p>
                          <p className="text-xs text-stone-500 mt-1">
                            Supports JPG, PNG, WEBP from phone camera or gallery
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Snap Button */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>Take Photo with Camera</span>
                    </button>

                    <button
                      type="button"
                      disabled={!selectedImage || isScanning}
                      onClick={() => handleStartScan({ imageBase64: selectedImage || undefined })}
                      className="flex-1 py-3 px-6 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Scan & Extract Dishes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: PRE-CONFIGURED SAMPLE MENU CARDS */}
              {activeTab === 'PRESET' && (
                <div className="space-y-4">
                  <div className="text-center max-w-md mx-auto">
                    <h3 className="text-sm font-bold text-white">
                      Don&apos;t have a printed menu photo ready?
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      Pick a realistic physical menu card preset to see the AI detector and web photo fetcher in action right now:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {SAMPLE_MENU_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => handleStartScan({ presetId: preset.id })}
                        className="p-4 bg-stone-950/80 hover:bg-stone-950 border border-stone-800 hover:border-amber-500/60 rounded-3xl cursor-pointer transition group flex flex-col justify-between shadow-xl"
                      >
                        <div className="space-y-3">
                          <div className="relative h-28 rounded-2xl overflow-hidden border border-stone-800">
                            <img
                              src={preset.coverImage}
                              alt={preset.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
                            <span className="absolute bottom-2 left-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-stone-950">
                              {preset.items.length} Dishes
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition">
                              {preset.title}
                            </h4>
                            <p className="text-[11px] text-stone-400 mt-0.5">{preset.cuisine}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs font-bold text-amber-400">
                          <span>Scan This Card</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PASTE TEXT */}
              {activeTab === 'TEXT' && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Paste Menu Lines / Text / WhatsApp Message
                    </label>
                    <textarea
                      rows={6}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder={`Example:
STARTERS
Garlic Bread with Cheese - 180
Crispy Chicken Wings - 260

MAINS
Woodfired Margherita Pizza - 350
Spaghetti Aglio e Olio - 320`}
                      className="w-full p-3.5 bg-stone-950 border border-stone-800 rounded-2xl text-xs text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!rawText.trim() || isScanning}
                    onClick={() => handleStartScan({ text: rawText })}
                    className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Parsing Dishes & Finding Photos...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Parse Text & Fetch Dish Photos</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {statusMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center gap-2 max-w-xl mx-auto">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* STAGE 2: REVIEW & BULK IMPORT DETECTED DISHES */
            <div className="space-y-4">
              {/* Review Bar Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-stone-950 border border-stone-800 rounded-2xl">
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Review Detected Dishes</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">
                      {selectedCount} of {detectedItems.length} selected
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Click any field to edit. Click &quot;Change Photo&quot; to pick from alternative web food photos.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = detectedItems.every((i) => i.selected !== false);
                      setDetectedItems((prev) =>
                        prev.map((it) => ({ ...it, selected: !allSelected }))
                      );
                    }}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold rounded-xl transition"
                  >
                    Toggle All
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsReviewing(false)}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Scan Another Photo</span>
                  </button>
                </div>
              </div>

              {/* Items Review Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-w-0 overflow-hidden">
                {detectedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition flex flex-col justify-between gap-2.5 shadow-lg min-w-0 overflow-hidden ${
                      item.selected !== false
                        ? 'bg-stone-950/90 border-stone-800'
                        : 'bg-stone-950/40 border-stone-900 opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                      {/* Selection Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item.id)}
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                          item.selected !== false
                            ? 'bg-amber-500 text-stone-950'
                            : 'border border-stone-700 bg-stone-900 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      </button>

                      {/* Photo Thumbnail + Change Photo Pill */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border border-stone-800 shrink-0 bg-stone-900 group">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoPicker(item)}
                          className="absolute inset-0 bg-stone-950/80 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-[9px] font-black text-amber-400 gap-0.5 p-1 text-center"
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>Change</span>
                        </button>
                      </div>

                      {/* Details Edit */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Title & Price */}
                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                            className="flex-1 min-w-0 font-black text-xs text-white bg-transparent border-b border-stone-800 focus:border-amber-500 focus:outline-none py-0.5 truncate"
                          />
                          <div className="flex items-center gap-1 font-mono text-xs font-black text-amber-400 bg-stone-900 px-2 py-0.5 rounded-lg border border-stone-800 shrink-0">
                            <span className="text-amber-500 font-bold">{restaurant.currency || '₹'}</span>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                handleUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                              }
                              className="w-12 sm:w-14 bg-transparent text-amber-400 text-right focus:outline-none font-bold"
                            />
                          </div>
                        </div>

                        {/* Category & Veg Toggle */}
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                            className="text-[10px] font-bold text-stone-300 bg-stone-900 px-2 py-0.5 rounded-md border border-stone-800 focus:outline-none flex-1 sm:flex-initial min-w-0"
                            placeholder="Category"
                          />

                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { is_veg: !item.is_veg })}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider transition shrink-0 ${
                              item.is_veg
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {item.is_veg ? '🥬 Veg' : '🍗 Non-Veg'}
                          </button>
                        </div>

                        {/* Description */}
                        <textarea
                          rows={1}
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                          className="w-full text-[10px] sm:text-[11px] text-stone-400 bg-transparent border-b border-stone-850 focus:border-amber-500 focus:outline-none py-0.5 truncate"
                          placeholder="Short description..."
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-stone-600 hover:text-rose-400 p-1 shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-stone-800 bg-stone-900/95 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold rounded-xl transition"
          >
            Cancel
          </button>

          {isReviewing && (
            <button
              type="button"
              disabled={isImporting || selectedCount === 0}
              onClick={handleImportAll}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing {selectedCount} Dishes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Import All ({selectedCount}) Dishes into Menu</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Submodal: Pick Alternative Web Photo */}
      {photoPickerItem && (
        <div className="fixed inset-0 z-60 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Choose Online Food Photo</h3>
                <p className="text-xs text-stone-400">for &quot;{photoPickerItem.name}&quot;</p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoPickerItem(null)}
                className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Search Query */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customPhotoQuery}
                onChange={(e) => setCustomPhotoQuery(e.target.value)}
                placeholder="Search food photo keyword..."
                className="flex-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleSearchCustomPhoto}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-750 text-white rounded-xl text-xs font-bold"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Photo Grid Options */}
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
              {photoOptions.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectPhoto(opt.url)}
                  className="relative h-24 rounded-2xl overflow-hidden border border-stone-800 hover:border-amber-500 cursor-pointer group shadow"
                >
                  <img src={opt.thumbnail} alt={opt.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Check className="w-5 h-5 text-amber-400 stroke-[3]" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setPhotoPickerItem(null)}
                className="px-4 py-2 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
