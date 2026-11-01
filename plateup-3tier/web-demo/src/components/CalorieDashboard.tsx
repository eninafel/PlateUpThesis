import React, { useState } from 'react';
import { MealEntry, UserProfile, MealSlot } from '../types';
import { Plus, Sparkles, Flame, Droplets, ChevronRight, Trash2, Camera, Info, Utensils } from 'lucide-react';

interface CalorieDashboardProps {
  meals: MealEntry[];
  userProfile: UserProfile;
  selectedDate: string;
  onOpenLogMeal: (slot?: MealSlot) => void;
  onOpenScan: () => void;
  onOpenRecipes: () => void;
  onOpenProfile: () => void;
  onDeleteMeal: (id: string) => void;
  onWaterAdd: (amount: number) => void;
  currentWaterMl: number;
}

export const CalorieDashboard: React.FC<CalorieDashboardProps> = ({
  meals,
  userProfile,
  selectedDate,
  onOpenLogMeal,
  onOpenScan,
  onOpenRecipes,
  onOpenProfile,
  onDeleteMeal,
  onWaterAdd,
  currentWaterMl,
}) => {
  const [selectedMealForDetails, setSelectedMealForDetails] = useState<MealEntry | null>(null);

  // Filter meals for the selected date
  const todayMeals = meals.filter((m) => m.date === selectedDate);

  const totalCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = todayMeals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = todayMeals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFat = todayMeals.reduce((acc, m) => acc + m.fat, 0);

  const calorieGoal = userProfile.dailyCalorieGoal || 2100;
  const remainingCalories = Math.max(0, calorieGoal - totalCalories);
  const caloriePercent = Math.min(100, Math.round((totalCalories / calorieGoal) * 100));

  // Meals grouped by slot
  const slots: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const mealsBySlot: Record<MealSlot, MealEntry[]> = {
    Breakfast: todayMeals.filter((m) => m.mealType === 'Breakfast'),
    Lunch: todayMeals.filter((m) => m.mealType === 'Lunch'),
    Dinner: todayMeals.filter((m) => m.mealType === 'Dinner'),
    Snack: todayMeals.filter((m) => m.mealType === 'Snack'),
  };

  const slotCalories = (slot: MealSlot) =>
    mealsBySlot[slot].reduce((acc, m) => acc + m.calories, 0);

  // SVG circular gauge math
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (caloriePercent / 100) * circumference;

  return (
    <div className="flex-1 p-4 pb-24 space-y-4 text-neutral-100">
      {/* Top Header with Profile */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
            PlateUP Calorie Tracker
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Hello, {userProfile.name.split(' ')[0]}
            <span className="text-base">🥗</span>
          </h1>
        </div>

        <button
          onClick={onOpenProfile}
          className="relative group p-1 rounded-full border border-neutral-700/80 hover:border-emerald-500 transition-colors"
          title="User Profile & Goals"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/30"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-neutral-900 rounded-full flex items-center justify-center text-[7px] font-bold text-neutral-950">
            ✓
          </div>
        </button>
      </div>

      {/* Hero Calorie Budget Card (Material 3 Surface) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-800/90 via-neutral-800 to-neutral-900 border border-neutral-700 p-5 shadow-xl">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
              <Flame size={14} className="text-amber-400" /> Daily Calorie Budget
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-white tracking-tight">{totalCalories}</span>
              <span className="text-sm font-semibold text-neutral-400">/ {calorieGoal} kcal</span>
            </div>
            <p className="text-xs text-emerald-400 mt-1 font-medium">
              {remainingCalories > 0
                ? `${remainingCalories} kcal remaining today`
                : 'Calorie goal reached for today!'}
            </p>
          </div>

          {/* Circular Progress Gauge */}
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-neutral-700/60"
                strokeWidth="14"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-emerald-400 transition-all duration-700 ease-out"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-white">{caloriePercent}%</span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                Consumed
              </span>
            </div>
          </div>
        </div>

        {/* Macronutrient Bars */}
        <div className="mt-5 grid grid-cols-3 gap-2.5 pt-4 border-t border-neutral-700/70 text-center">
          {/* Protein */}
          <div className="bg-neutral-800/60 rounded-2xl p-2.5 border border-neutral-700/40">
            <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
              <span className="text-indigo-400 font-semibold">Protein</span>
              <span className="text-neutral-400 font-mono text-[10px]">
                {Math.round(totalProtein)}/{userProfile.macroGoals.protein}g
              </span>
            </div>
            <div className="w-full bg-neutral-700/50 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (totalProtein / (userProfile.macroGoals.protein || 1)) * 100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-neutral-800/60 rounded-2xl p-2.5 border border-neutral-700/40">
            <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
              <span className="text-amber-400 font-semibold">Carbs</span>
              <span className="text-neutral-400 font-mono text-[10px]">
                {Math.round(totalCarbs)}/{userProfile.macroGoals.carbs}g
              </span>
            </div>
            <div className="w-full bg-neutral-700/50 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (totalCarbs / (userProfile.macroGoals.carbs || 1)) * 100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Fat */}
          <div className="bg-neutral-800/60 rounded-2xl p-2.5 border border-neutral-700/40">
            <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
              <span className="text-rose-400 font-semibold">Fat</span>
              <span className="text-neutral-400 font-mono text-[10px]">
                {Math.round(totalFat)}/{userProfile.macroGoals.fat}g
              </span>
            </div>
            <div className="w-full bg-neutral-700/50 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (totalFat / (userProfile.macroGoals.fat || 1)) * 100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onOpenLogMeal()}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/50 transition-all hover:border-emerald-500/40 cursor-pointer active:scale-95 group text-center"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Plus size={18} />
          </div>
          <span className="text-[11px] font-semibold text-neutral-200">Log Meal</span>
          <span className="text-[9px] text-neutral-400">Quick Track</span>
        </button>

        <button
          onClick={onOpenScan}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/50 transition-all hover:border-teal-500/40 cursor-pointer active:scale-95 group text-center"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Camera size={18} />
          </div>
          <span className="text-[11px] font-semibold text-neutral-200">Scan Food</span>
          <span className="text-[9px] text-neutral-400">AI Vision</span>
        </button>

        <button
          onClick={onOpenRecipes}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/50 transition-all hover:border-amber-500/40 cursor-pointer active:scale-95 group text-center"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Sparkles size={18} />
          </div>
          <span className="text-[11px] font-semibold text-neutral-200">Recipes</span>
          <span className="text-[9px] text-neutral-400">Pantry-based</span>
        </button>
      </div>

      {/* Water Intake Tracker Widget */}
      <div className="p-3.5 rounded-2xl bg-neutral-800/50 border border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Droplets size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              Hydration
              <span className="text-[10px] text-sky-400 font-mono">
                {currentWaterMl} / {userProfile.waterGoalMl} ml
              </span>
            </div>
            <div className="w-32 bg-neutral-700/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (currentWaterMl / userProfile.waterGoalMl) * 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onWaterAdd(250)}
          className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1 border border-sky-500/30 cursor-pointer active:scale-95 transition-all"
        >
          <Plus size={13} />
          <span>+250ml</span>
        </button>
      </div>

      {/* Meal History / Breakdown Sections (Breakfast, Lunch, Dinner, Snack) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            <Utensils size={15} className="text-emerald-400" />
            Today's Meal Log
          </h2>
          <span className="text-xs text-neutral-400">
            {todayMeals.length} item{todayMeals.length === 1 ? '' : 's'} recorded
          </span>
        </div>

        {slots.map((slot) => {
          const slotList = mealsBySlot[slot];
          const cals = slotCalories(slot);

          return (
            <div
              key={slot}
              className="rounded-2xl bg-neutral-800/60 border border-neutral-700/80 p-3.5 space-y-2.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide">{slot}</span>
                  {cals > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                      {cals} kcal
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onOpenLogMeal(slot)}
                  className="p-1 px-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>

              {slotList.length === 0 ? (
                <div className="py-2.5 px-3 rounded-xl border border-dashed border-neutral-700/60 text-center">
                  <span className="text-xs text-neutral-500">No {slot.toLowerCase()} logged yet</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {slotList.map((meal) => (
                    <div
                      key={meal.id}
                      onClick={() => setSelectedMealForDetails(meal)}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-800/90 border border-neutral-700/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {meal.imageUrl ? (
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-neutral-700 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-neutral-700/60 flex items-center justify-center text-lg shrink-0">
                            🍽️
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate max-w-[170px]">
                            {meal.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                            <span>{meal.portion}</span>
                            <span>•</span>
                            <span className="font-mono text-emerald-400 font-medium">
                              {meal.calories} kcal
                            </span>
                          </div>

                          {/* Mini Macro row */}
                          <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-400 mt-1">
                            <span className="text-indigo-300">P:{meal.protein}g</span>
                            <span className="text-amber-300">C:{meal.carbs}g</span>
                            <span className="text-rose-300">F:{meal.fat}g</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMeal(meal.id);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete meal entry"
                        >
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={14} className="text-neutral-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Meal Detail Modal Popup */}
      {selectedMealForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-700 p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {selectedMealForDetails.mealType} • {selectedMealForDetails.time}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedMealForDetails.name}
                </h3>
                <span className="text-xs text-neutral-400">{selectedMealForDetails.portion}</span>
              </div>
              <button
                onClick={() => setSelectedMealForDetails(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {selectedMealForDetails.imageUrl && (
              <img
                src={selectedMealForDetails.imageUrl}
                alt={selectedMealForDetails.name}
                className="w-full h-36 rounded-2xl object-cover ring-1 ring-neutral-700"
              />
            )}

            {/* Nutrition Breakdown Grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-neutral-800/80 border border-neutral-700/50">
                <span className="text-[10px] text-neutral-400 block">Calories</span>
                <span className="text-sm font-bold text-emerald-400">
                  {selectedMealForDetails.calories}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/80 border border-neutral-700/50">
                <span className="text-[10px] text-neutral-400 block">Protein</span>
                <span className="text-sm font-bold text-indigo-400">
                  {selectedMealForDetails.protein}g
                </span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/80 border border-neutral-700/50">
                <span className="text-[10px] text-neutral-400 block">Carbs</span>
                <span className="text-sm font-bold text-amber-400">
                  {selectedMealForDetails.carbs}g
                </span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-800/80 border border-neutral-700/50">
                <span className="text-[10px] text-neutral-400 block">Fat</span>
                <span className="text-sm font-bold text-rose-400">
                  {selectedMealForDetails.fat}g
                </span>
              </div>
            </div>

            {/* Health Perks from Paper */}
            {selectedMealForDetails.healthPerks && selectedMealForDetails.healthPerks.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="font-semibold text-emerald-300 flex items-center gap-1 mb-1">
                  <Info size={13} /> Health Benefits & Insights:
                </span>
                <ul className="list-disc list-inside text-neutral-300 space-y-0.5 text-[11px]">
                  {selectedMealForDetails.healthPerks.map((perk, i) => (
                    <li key={i}>{perk}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  onDeleteMeal(selectedMealForDetails.id);
                  setSelectedMealForDetails(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-400 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} /> Remove Entry
              </button>
              <button
                onClick={() => setSelectedMealForDetails(null)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
