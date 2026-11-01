import React, { useState } from 'react';
import { MealEntry, MealSlot } from '../types';
import { Sparkles, Camera, Plus, Loader2, Check, AlertCircle } from 'lucide-react';

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: Omit<MealEntry, 'id'>) => void;
  initialSlot?: MealSlot;
  currentDate: string;
}

export const LogMealModal: React.FC<LogMealModalProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  initialSlot = 'Lunch',
  currentDate,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'photo'>('ai');
  const [slot, setSlot] = useState<MealSlot>(initialSlot);
  const [time, setTime] = useState<string>('12:30');

  // AI Description input
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string>('');

  // Manual / parsed fields
  const [mealName, setMealName] = useState<string>('');
  const [portion, setPortion] = useState<string>('1 standard serving');
  const [calories, setCalories] = useState<number>(450);
  const [protein, setProtein] = useState<number>(30);
  const [carbs, setCarbs] = useState<number>(45);
  const [fat, setFat] = useState<number>(15);
  const [fiber, setFiber] = useState<number>(5);
  const [healthPerks, setHealthPerks] = useState<string[]>([]);
  const [dietaryTags, setDietaryTags] = useState<string[]>(['Balanced']);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  if (!isOpen) return null;

  const handleAiAnalyze = async () => {
    if (!aiPrompt.trim()) return;
    setIsAnalyzing(true);
    setAnalysisError('');

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealText: aiPrompt }),
      });

      const data = await response.json();
      if (data.success && data.meal) {
        setMealName(data.meal.name || aiPrompt);
        setPortion(data.meal.portion || '1 serving');
        setCalories(data.meal.calories || 400);
        setProtein(data.meal.protein || 20);
        setCarbs(data.meal.carbs || 40);
        setFat(data.meal.fat || 12);
        setFiber(data.meal.fiber || 4);
        setHealthPerks(data.meal.healthPerks || ['Nutritious balanced meal']);
        setDietaryTags(data.meal.dietaryTags || ['Balanced']);
        if (data.meal.mealType) setSlot(data.meal.mealType as MealSlot);
      } else {
        setAnalysisError(data.error || 'Failed to estimate meal nutrients.');
      }
    } catch (err: any) {
      setAnalysisError('Could not connect to nutrition AI. Setting estimated values.');
      setMealName(aiPrompt);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setPhotoPreview(base64);
        setIsAnalyzing(true);
        setAnalysisError('');

        try {
          const response = await fetch('/api/analyze-meal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
          });
          const data = await response.json();
          if (data.success && data.meal) {
            setMealName(data.meal.name || 'Scanned Meal Plate');
            setPortion(data.meal.portion || '1 serving');
            setCalories(data.meal.calories || 420);
            setProtein(data.meal.protein || 25);
            setCarbs(data.meal.carbs || 40);
            setFat(data.meal.fat || 14);
            setHealthPerks(data.meal.healthPerks || ['Visual meal analysis']);
            if (data.meal.mealType) setSlot(data.meal.mealType as MealSlot);
          }
        } catch {
          setAnalysisError('Unable to analyze image. You can adjust values below.');
          setMealName('Scanned Meal');
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    onSaveMeal({
      date: currentDate,
      time: time || '12:00',
      mealType: slot,
      name: mealName,
      portion,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      fiber: Number(fiber) || 0,
      healthPerks,
      dietaryTags,
      imageUrl: photoPreview || undefined,
      source: photoPreview ? 'scanned_image' : 'manual',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-700 p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Calorie Intake Tracker
            </span>
            <h2 className="text-lg font-bold text-white">Log a Meal</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Input Mode Selector */}
        <div className="flex rounded-2xl bg-neutral-800 p-1 border border-neutral-700">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ai'
                ? 'bg-emerald-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles size={14} /> AI Estimate
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'photo'
                ? 'bg-emerald-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Camera size={14} /> Photo Scan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-emerald-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus size={14} /> Manual Form
          </button>
        </div>

        {/* Tab 1: AI Prompt Input */}
        {activeTab === 'ai' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300 block">
              Describe what you ate or drank:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. 2 fried eggs, 2 bacon strips, whole wheat toast with butter"
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAiAnalyze())}
              />
              <button
                type="button"
                onClick={handleAiAnalyze}
                disabled={isAnalyzing || !aiPrompt.trim()}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Calculate</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-neutral-400">Quick suggestions:</span>
              {[
                'Grilled chicken breast & quinoa bowl',
                '1 cup Greek yogurt with blueberries',
                '2 slices pepperoni pizza & diet cola',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setAiPrompt(sample);
                  }}
                  className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded-lg border border-neutral-700/60"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Photo Scan Upload */}
        {activeTab === 'photo' && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-neutral-700 hover:border-emerald-500/60 rounded-2xl p-4 text-center cursor-pointer transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {photoPreview ? (
                <div className="space-y-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-32 rounded-xl object-cover mx-auto"
                  />
                  <span className="text-xs text-emerald-400 font-medium block">
                    ✓ Photo uploaded! Click to replace
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <Camera size={20} />
                  </div>
                  <span className="text-xs font-semibold text-white block">
                    Take photo or choose meal image
                  </span>
                  <span className="text-[11px] text-neutral-400 block">
                    PlateUP AI will identify dishes & calorie profile
                  </span>
                </div>
              )}
            </div>
            {isAnalyzing && (
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 py-1">
                <Loader2 size={14} className="animate-spin" />
                <span>Analyzing meal with Gemini vision...</span>
              </div>
            )}
          </div>
        )}

        {analysisError && (
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{analysisError}</span>
          </div>
        )}

        {/* Meal Detail Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-neutral-800">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                Meal Category
              </label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value as MealSlot)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
              Food / Meal Name *
            </label>
            <input
              type="text"
              required
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g. Scrambled Eggs with Avocado Toast"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
              Portion Size
            </label>
            <input
              type="text"
              value={portion}
              onChange={(e) => setPortion(e.target.value)}
              placeholder="e.g. 1 bowl (350g) or 2 slices"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </div>

          {/* Calories and Macros Grid */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700">
              <label className="text-[9px] font-bold text-neutral-400 block uppercase">
                Calories
              </label>
              <input
                type="number"
                min="0"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-extrabold text-emerald-400 font-mono focus:outline-none"
              />
              <span className="text-[9px] text-neutral-500">kcal</span>
            </div>

            <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700">
              <label className="text-[9px] font-bold text-indigo-400 block uppercase">
                Protein
              </label>
              <input
                type="number"
                min="0"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-extrabold text-indigo-300 font-mono focus:outline-none"
              />
              <span className="text-[9px] text-neutral-500">grams</span>
            </div>

            <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700">
              <label className="text-[9px] font-bold text-amber-400 block uppercase">
                Carbs
              </label>
              <input
                type="number"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-extrabold text-amber-300 font-mono focus:outline-none"
              />
              <span className="text-[9px] text-neutral-500">grams</span>
            </div>

            <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700">
              <label className="text-[9px] font-bold text-rose-400 block uppercase">
                Fat
              </label>
              <input
                type="number"
                min="0"
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-extrabold text-rose-300 font-mono focus:outline-none"
              />
              <span className="text-[9px] text-neutral-500">grams</span>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Check size={14} /> Add to Today's Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
