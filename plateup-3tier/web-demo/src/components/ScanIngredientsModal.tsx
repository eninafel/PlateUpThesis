import React, { useState, useRef } from 'react';
import { PantryItem, IngredientCategory } from '../types';
import { SAMPLE_SCAN_PRESETS } from '../data/mockData';
import { Camera, Upload, CheckSquare, Square, Trash2, Plus, Loader2, ArrowRight, Receipt, AlertCircle, Flame } from 'lucide-react';

interface DetectedItem {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: string;
  confidence: number;
  estimatedCalories: number;
  healthPerks?: string;
  storageTip?: string;
  selected: boolean;
}

interface ScanIngredientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSelectedToPantry: (items: Omit<PantryItem, 'id' | 'addedDate'>[]) => void;
  onFindRecipesWithIngredients: (ingredientNames: string[]) => void;
  initialPreset?: typeof SAMPLE_SCAN_PRESETS[0] | null;
}

export const ScanIngredientsModal: React.FC<ScanIngredientsModalProps> = ({
  isOpen,
  onClose,
  onAddSelectedToPantry,
  onFindRecipesWithIngredients,
  initialPreset,
}) => {
  const [step, setStep] = useState<'capture' | 'review'>('capture');
  const [scanType, setScanType] = useState<'fridge' | 'receipt'>('fridge');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [summaryText, setSummaryText] = useState<string>('');

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (initialPreset && isOpen) {
      handlePresetSelect(initialPreset);
    }
  }, [initialPreset, isOpen]);

  if (!isOpen) return null;

  const startCamera = async () => {
    setIsCameraActive(true);
    setScanError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setScanError('Camera not available on this device. Please upload an image or select a sample.');
      setIsCameraActive(false);
    }
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(dataUrl);

      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);

      analyzeImage(dataUrl, 'image/jpeg');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64 = loadEvent.target?.result as string;
        setImagePreview(base64);
        analyzeImage(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (preset: typeof SAMPLE_SCAN_PRESETS[0]) => {
    setImagePreview(preset.thumbnail);
    analyzeImage(preset.thumbnail, 'image/jpeg', preset.type as any, preset.description);
  };

  const analyzeImage = async (
    base64Data: string,
    mimeType: string,
    forcedScanType?: 'fridge' | 'receipt',
    textHint?: string
  ) => {
    setIsScanning(true);
    setScanError('');
    setStep('capture');

    try {
      const response = await fetch('/api/scan-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
          scanType: forcedScanType || scanType,
          textHint,
        }),
      });

      const data = await response.json();
      if (data.success && data.detectedIngredients) {
        const itemsWithSelection: DetectedItem[] = data.detectedIngredients.map((item: any) => ({
          ...item,
          selected: true,
        }));
        setDetectedItems(itemsWithSelection);
        setSummaryText(data.summary || 'Ingredients recognized.');
        setStep('review');
      } else {
        setScanError(data.error || 'Failed to detect ingredients in this image.');
      }
    } catch (err: any) {
      setScanError('Unable to scan image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    setDetectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const deleteItem = (id: string) => {
    setDetectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddManualItem = () => {
    const newItem: DetectedItem = {
      id: `manual-${Date.now()}`,
      name: 'Fresh Ingredient',
      category: 'Produce',
      quantity: '1 item',
      confidence: 1.0,
      estimatedCalories: 45,
      selected: true,
    };
    setDetectedItems((prev) => [...prev, newItem]);
  };

  const selectedCount = detectedItems.filter((i) => i.selected).length;

  const handleConfirmSaveToPantry = () => {
    const selected = detectedItems.filter((i) => i.selected);
    onAddSelectedToPantry(
      selected.map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        estimatedCalories: item.estimatedCalories,
        confidence: item.confidence,
        healthPerks: item.healthPerks,
        storageTip: item.storageTip,
      }))
    );
    onClose();
  };

  const handleConfirmFindRecipes = () => {
    const selected = detectedItems.filter((i) => i.selected);
    onFindRecipesWithIngredients(selected.map((i) => i.name));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-700 p-5 shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-stone-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Ingredient Recognition
            </span>
            <h2 className="text-base font-bold text-white">
              {step === 'capture' ? 'Scan Kitchen Ingredients' : 'Verify Detected Ingredients & Calories'}
            </h2>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* STEP 1: CAPTURE / UPLOAD / SAMPLES */}
        {step === 'capture' && (
          <div className="space-y-4">
            <div className="flex rounded-2xl bg-stone-800 p-1 border border-stone-700">
              <button
                type="button"
                onClick={() => setScanType('fridge')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanType === 'fridge'
                    ? 'bg-emerald-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Camera size={13} /> Refrigerator & Pantry
              </button>
              <button
                type="button"
                onClick={() => setScanType('receipt')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanType === 'receipt'
                    ? 'bg-emerald-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Receipt size={13} /> Grocery Receipt
              </button>
            </div>

            {/* Live Camera Viewfinder or Upload Area */}
            {isCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-stone-700 aspect-4/3 flex flex-col justify-end">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-4 border border-dashed border-emerald-400/60 rounded-xl pointer-events-none"></div>

                <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 text-xs text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={captureCameraFrame}
                    className="w-12 h-12 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
                    title="Take photo"
                  >
                    <div className="w-5 h-5 rounded-full bg-stone-950"></div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-stone-700 hover:border-emerald-500/60 rounded-2xl p-5 text-center transition-all bg-stone-800/50 relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <Upload size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-white">Upload Food or Receipt Image</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Select a photo of your fridge, pantry shelf, or receipt.
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-stone-800 text-emerald-400 text-[10px] font-semibold border border-stone-700">
                    Browse Photo
                  </span>
                </div>

                <button
                  onClick={startCamera}
                  className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-stone-700 transition-colors cursor-pointer"
                >
                  <Camera size={15} className="text-emerald-400" />
                  <span>Open Camera</span>
                </button>
              </div>
            )}

            {/* Test Sample Photos */}
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <span className="text-[11px] font-semibold text-stone-400 block">
                Or select a test photo:
              </span>

              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_SCAN_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-stone-800 hover:bg-stone-800 border border-stone-700 text-center transition-all hover:border-emerald-500/40 cursor-pointer group"
                  >
                    <img
                      src={preset.thumbnail}
                      alt={preset.title}
                      className="w-full h-14 rounded-lg object-cover ring-1 ring-stone-700 shrink-0"
                    />
                    <span className="text-[10px] font-bold text-white truncate w-full">
                      {preset.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {isScanning && (
              <div className="p-4 rounded-2xl bg-stone-800 border border-emerald-500/30 text-center space-y-2 animate-pulse">
                <Loader2 size={22} className="animate-spin text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">Identifying Ingredients & Calories...</h4>
                <p className="text-[10px] text-stone-400">
                  Processing image to detect items, quantities, and nutritional calories.
                </p>
              </div>
            )}

            {scanError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{scanError}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: REVIEW & VERIFY (From Figure 2, Page 10 of Research Paper) */}
        {step === 'review' && (
          <div className="space-y-3">
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden h-24 border border-stone-700">
                <img src={imagePreview} alt="Scanned item" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent flex items-end p-2.5">
                  <span className="text-xs text-emerald-300 font-semibold">{summaryText}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Detected Food Items ({selectedCount} selected)
                </span>
                <span className="text-[10px] text-stone-400">
                  Calorie estimates calculated from detected ingredients
                </span>
              </div>

              <button
                onClick={handleAddManualItem}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add item
              </button>
            </div>

            {/* Checklist items with estimated calories */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {detectedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItemSelection(item.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    item.selected
                      ? 'bg-stone-800 border-emerald-500/50 text-white'
                      : 'bg-stone-800/60 border-stone-700 text-stone-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className="text-emerald-400 shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItemSelection(item.id);
                      }}
                    >
                      {item.selected ? <CheckSquare size={17} /> : <Square size={17} />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate text-white">{item.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-700 text-stone-300">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                        <span className="text-emerald-400 font-mono font-medium flex items-center gap-0.5">
                          <Flame size={10} /> ~{item.estimatedCalories} kcal
                        </span>
                        <span>•</span>
                        <span className="text-stone-400">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    className="p-1 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <button
                onClick={handleConfirmFindRecipes}
                disabled={selectedCount === 0}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                <span>Discover Recipes with Selected Ingredients</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={handleConfirmSaveToPantry}
                disabled={selectedCount === 0}
                className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-stone-700 disabled:opacity-50 cursor-pointer"
              >
                <span>Save {selectedCount} Items to Kitchen Inventory</span>
              </button>

              <button
                onClick={() => setStep('capture')}
                className="w-full py-1 text-center text-stone-400 hover:text-stone-200 text-[11px] transition-colors cursor-pointer"
              >
                ← Scan another image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
