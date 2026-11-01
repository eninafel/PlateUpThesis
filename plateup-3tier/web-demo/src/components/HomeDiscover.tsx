import React, { useState } from 'react';
import { MealEntry, PantryItem, Recipe, UserProfile } from '../types';
import { Camera, Plus, ChevronRight, Clock, Flame, Utensils, MessageSquare, ArrowRight } from 'lucide-react';
import { SAMPLE_SCAN_PRESETS } from '../data/mockData';

interface HomeDiscoverProps {
  pantryItems: PantryItem[];
  meals: MealEntry[];
  recipes: Recipe[];
  userProfile: UserProfile;
  selectedDate: string;
  onOpenScan: () => void;
  onOpenRecipes: () => void;
  onOpenAiChatbot: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onOpenProfile: () => void;
  onSelectPresetScan: (preset: typeof SAMPLE_SCAN_PRESETS[0]) => void;
  onCookRecipe: (recipe: Recipe) => void;
}

export const HomeDiscover: React.FC<HomeDiscoverProps> = ({
  pantryItems,
  meals,
  recipes,
  userProfile,
  selectedDate,
  onOpenScan,
  onOpenRecipes,
  onOpenAiChatbot,
  onSelectRecipe,
  onOpenProfile,
  onSelectPresetScan,
  onCookRecipe,
}) => {
  const todayMeals = meals.filter((m) => m.date === selectedDate);
  const totalCaloriesToday = todayMeals.reduce((acc, m) => acc + m.calories, 0);

  return (
    <div className="flex-1 p-4 pb-24 space-y-4 text-stone-100 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
            PlateUP Mobile
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Kitchen Dashboard
          </h1>
        </div>

        <button
          onClick={onOpenProfile}
          className="p-1 rounded-full border border-stone-700 hover:border-emerald-500 transition-colors cursor-pointer"
          title="User Account"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
          />
        </button>
      </div>

      {/* 1. CAMERA SCANNING VIEW ON STARTER */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-800 border border-stone-700 p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Camera Scanner
            </span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">Ingredient Detection</span>
        </div>

        <div
          onClick={onOpenScan}
          className="relative rounded-2xl overflow-hidden aspect-16/9 bg-stone-900 border border-dashed border-emerald-500/50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors group"
        >
          <div className="absolute inset-3 border border-stone-700/60 rounded-xl pointer-events-none"></div>

          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Camera size={26} />
          </div>

          <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
            Tap to Open Camera & Scan Food
          </span>
          <span className="text-[10px] text-stone-400 mt-0.5">
            Points at refrigerator or kitchen ingredients
          </span>
        </div>

        <button
          onClick={onOpenScan}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
        >
          <Camera size={15} />
          <span>Scan Ingredients Now</span>
        </button>

        {/* Sample Kitchen Test Photos */}
        <div className="pt-2 border-t border-stone-700/70">
          <span className="text-[10px] font-semibold text-stone-400 block mb-1">
            Or test with sample kitchen photos:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {SAMPLE_SCAN_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onSelectPresetScan(preset)}
                className="flex items-center gap-1.5 p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700/60 text-left transition-colors cursor-pointer"
              >
                <img
                  src={preset.thumbnail}
                  alt={preset.title}
                  className="w-7 h-7 rounded-lg object-cover shrink-0"
                />
                <span className="text-[10px] text-stone-300 font-medium truncate">
                  {preset.title.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. PROMINENT AI CHATBOT CARD RIGHT ON STARTER */}
      <div
        onClick={onOpenAiChatbot}
        className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-stone-800 to-stone-800 border border-emerald-500/30 flex items-center justify-between shadow-lg cursor-pointer hover:border-emerald-500/60 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/30 shrink-0 group-hover:scale-105 transition-transform">
            👨‍🍳
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                PlateUP AI Chatbot
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                Online
              </span>
            </div>
            <p className="text-[11px] text-stone-300 mt-0.5">
              Ask questions on recipes, missing ingredients & calorie estimation
            </p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform">
          <ArrowRight size={15} />
        </div>
      </div>

      {/* 3. SCANNED INGREDIENTS LIST (0 STARTING STATE) */}
      <div className="p-4 rounded-3xl bg-stone-800/70 border border-stone-700 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Scanned Ingredients</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
              {pantryItems.length} items
            </span>
          </div>

          <button
            onClick={onOpenScan}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {pantryItems.length === 0 ? (
          <div className="py-4 text-center border border-dashed border-stone-700/80 rounded-2xl space-y-1">
            <p className="text-xs text-stone-400">0 ingredients in kitchen.</p>
            <p className="text-[10px] text-stone-500">
              Scan food items with the camera above to record ingredients & see their calories.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {pantryItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-800 text-stone-200 text-xs border border-stone-700/60"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="font-medium">{item.name}</span>
                {item.estimatedCalories ? (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    ~{item.estimatedCalories} kcal
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. RECIPE ALGORITHM RESULTS (0 STARTING STATE) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Utensils size={14} className="text-emerald-400" />
              Recommended Dishes ({recipes.length})
            </h3>
          </div>

          {recipes.length > 0 && (
            <button
              onClick={onOpenRecipes}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight size={13} />
            </button>
          )}
        </div>

        {recipes.length === 0 ? (
          <div className="p-5 rounded-2xl bg-stone-800/40 border border-stone-700 text-center space-y-1.5">
            <span className="text-2xl">🍲</span>
            <p className="text-xs font-semibold text-stone-300">0 recipes matched</p>
            <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
              Scan kitchen ingredients with the camera above to trigger recipe suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recipes.slice(0, 3).map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-800 border border-stone-700 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-lg shrink-0">
                      🥘
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                      {recipe.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                      <span className="text-emerald-400 font-mono font-bold flex items-center gap-0.5">
                        <Flame size={10} /> {recipe.caloriesPerServing} kcal
                      </span>
                      <span>•</span>
                      <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCookRecipe(recipe);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-[10px] shrink-0 transition-colors cursor-pointer"
                >
                  Cook & Log
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. TODAY'S CALORIE INTAKE (Starts at 0 kcal) */}
      <div className="p-4 rounded-3xl bg-stone-800 border border-stone-700 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Today's Logged Calories
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-extrabold text-white font-mono">
              {totalCaloriesToday}
            </span>
            <span className="text-xs text-stone-400">kcal</span>
          </div>
          <span className="text-[11px] text-stone-400">
            {todayMeals.length === 0
              ? 'Starts at 0 kcal. Updates once you prepare dishes.'
              : `${todayMeals.length} meal(s) logged today.`}
          </span>
        </div>
      </div>
    </div>
  );
};
