import React, { useState } from 'react';
import { MealEntry, UserProfile } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Utensils, Trash2, Flame, Award, BookOpen } from 'lucide-react';

interface MealHistoryViewProps {
  meals: MealEntry[];
  userProfile: UserProfile;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onDeleteMeal: (id: string) => void;
  onOpenRecipes: () => void;
}

export const MealHistoryView: React.FC<MealHistoryViewProps> = ({
  meals,
  userProfile,
  selectedDate,
  onSelectDate,
  onDeleteMeal,
  onOpenRecipes,
}) => {
  const formatDisplayDate = (dStr: string) => {
    try {
      const parts = dStr.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const selectedDayMeals = meals
    .filter((m) => m.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const totalDayCals = selectedDayMeals.reduce((acc, m) => acc + m.calories, 0);

  // Food waste reduction impact from Crueldad et al. Paper
  const mealsCookedFromPantry = meals.filter((m) => m.source === 'cooked_recipe').length;
  const estimatedKgSaved = (mealsCookedFromPantry * 0.35).toFixed(1);

  return (
    <div className="flex-1 p-4 pb-24 space-y-4 text-stone-100 font-sans">
      {/* Title */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
            PlateUP History
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Meal History & Intake
          </h1>
        </div>

        <button
          onClick={onOpenRecipes}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
        >
          <BookOpen size={13} />
          <span>Cook Recipe</span>
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-stone-800 border border-stone-700">
        <button
          onClick={() => {
            const parts = selectedDate.split('-');
            const prev = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) - 1);
            onSelectDate(prev.toISOString().split('T')[0]);
          }}
          className="p-1.5 rounded-lg hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
          title="Previous day"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-emerald-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            {formatDisplayDate(selectedDate)}
          </span>
          {selectedDate === '2026-10-09' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              TODAY
            </span>
          )}
        </div>

        <button
          onClick={() => {
            const parts = selectedDate.split('-');
            const next = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) + 1);
            onSelectDate(next.toISOString().split('T')[0]);
          }}
          className="p-1.5 rounded-lg hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
          title="Next day"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day's Calorie Overview Card */}
      <div className="p-4 rounded-3xl bg-stone-800 border border-stone-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-400">Total Calories Recorded</span>
          <span className="text-xs text-stone-400 font-mono">
            {selectedDayMeals.length} dish{selectedDayMeals.length === 1 ? '' : 'es'}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono">{totalDayCals}</span>
          <span className="text-xs font-semibold text-emerald-400">kcal</span>
        </div>

        <p className="text-[11px] text-stone-400">
          {totalDayCals === 0
            ? 'No meals recorded for this day yet. Calories are added when you cook recommended dishes or scan food items.'
            : `Estimated total from dishes prepared and logged on ${formatDisplayDate(selectedDate)}.`}
        </p>
      </div>

      {/* Food Waste Impact */}
      {mealsCookedFromPantry > 0 && (
        <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Award size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Household Food Rescued</span>
              <span className="text-[11px] text-stone-400">
                ~{estimatedKgSaved} kg ingredients used from pantry
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {mealsCookedFromPantry} meals
          </span>
        </div>
      )}

      {/* Logged Meals List */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Utensils size={14} className="text-emerald-400" />
            Meals on {formatDisplayDate(selectedDate)}
          </h3>
          <span className="text-[11px] text-stone-400 font-mono">
            {selectedDayMeals.length} logged
          </span>
        </div>

        {selectedDayMeals.length === 0 ? (
          <div className="p-8 rounded-2xl bg-stone-800/50 border border-stone-700 text-center space-y-2">
            <span className="text-3xl">🍽️</span>
            <h4 className="text-xs font-bold text-white">0 Meals Recorded</h4>
            <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
              Scan your available pantry ingredients and cook a recommended dish to log calories here.
            </p>
            <button
              onClick={onOpenRecipes}
              className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-colors cursor-pointer"
            >
              Browse Recommended Recipes →
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedDayMeals.map((meal) => (
              <div
                key={meal.id}
                className="p-3.5 rounded-2xl bg-stone-800 border border-stone-700 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {meal.imageUrl ? (
                      <img
                        src={meal.imageUrl}
                        alt={meal.name}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-stone-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-lg shrink-0">
                        🥗
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          {meal.mealType}
                        </span>
                        <span className="text-stone-500">•</span>
                        <span className="text-[10px] font-mono text-stone-400">{meal.time}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-0.5">{meal.name}</h4>
                      <span className="text-[10px] text-stone-400">{meal.portion}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-400 font-mono block">
                      {meal.calories} kcal
                    </span>
                    <button
                      onClick={() => onDeleteMeal(meal.id)}
                      className="text-[10px] text-stone-500 hover:text-rose-400 transition-colors mt-1 p-1 cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {meal.healthPerks && meal.healthPerks.length > 0 && (
                  <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-800">
                    {meal.healthPerks.slice(0, 2).join(' • ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
