import React from 'react';
import { Leaf, ChefHat, AlertTriangle, CheckCircle2, Refrigerator } from 'lucide-react';
import { MealEntry, PantryItem } from '../types';

interface WasteTrackerProps {
  pantryItems: PantryItem[];
  meals: MealEntry[];
  onFindRecipes: () => void;
}

/** Whole days between a YYYY-MM-DD date and today (never negative). */
const daysSince = (isoDate: string): number => {
  const then = new Date(`${isoDate}T00:00:00`).getTime();
  if (Number.isNaN(then)) return 0;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((today - then) / 86400000));
};

/**
 * Food-waste panel (ported from the old "PlateUP - Waste Tracker" view).
 * Every number is computed from the user's real pantry and meal log.
 * Nothing is hard-coded.
 */
export const WasteTracker: React.FC<WasteTrackerProps> = ({ pantryItems, meals, onFindRecipes }) => {
  const withDaysLeft = pantryItems.map((item) => ({
    item,
    daysLeft: (item.expiryDays ?? 7) - daysSince(item.addedDate),
  }));
  const atRisk = withDaysLeft
    .filter((x) => x.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const cookedCount = meals.filter((m) => m.source === 'cooked_recipe').length;

  return (
    <div className="mx-3.5 mt-3.5 rounded-2xl border border-neutral-800 bg-neutral-800/60 p-3.5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
          <Leaf size={15} />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white">Waste Prevention</h3>
          <p className="text-[10px] text-neutral-400">Use what you have before it spoils</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-2">
          <Refrigerator size={13} className="mx-auto text-emerald-400" />
          <div className="text-base font-bold text-white mt-0.5">{pantryItems.length}</div>
          <div className="text-[9px] text-neutral-400">In kitchen</div>
        </div>
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-2">
          <AlertTriangle size={13} className="mx-auto text-amber-400" />
          <div className="text-base font-bold text-white mt-0.5">{atRisk.length}</div>
          <div className="text-[9px] text-neutral-400">Use soon</div>
        </div>
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-2">
          <ChefHat size={13} className="mx-auto text-emerald-400" />
          <div className="text-base font-bold text-white mt-0.5">{cookedCount}</div>
          <div className="text-[9px] text-neutral-400">Meals cooked</div>
        </div>
      </div>

      {atRisk.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-300">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>
            {pantryItems.length === 0
              ? 'Add ingredients to start tracking freshness.'
              : 'Nothing is close to expiring. Nice work!'}
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {atRisk.map(({ item, daysLeft }) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-amber-500/10 border border-amber-500/25 px-2.5 py-2"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">{item.name}</div>
                <div className="text-[10px] text-amber-300">
                  {daysLeft <= 0 ? 'Use today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`} • {item.quantity}
                </div>
              </div>
              <button
                onClick={onFindRecipes}
                className="shrink-0 text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Find recipes
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
