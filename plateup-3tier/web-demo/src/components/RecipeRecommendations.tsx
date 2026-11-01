import React, { useState } from 'react';
import { Recipe, PantryItem } from '../types';
import { Clock, Flame, Check, AlertCircle, RefreshCw, ChevronRight, Utensils, Award } from 'lucide-react';

interface RecipeRecommendationsProps {
  recipes: Recipe[];
  pantryItems: PantryItem[];
  onCookRecipe: (recipe: Recipe) => void;
  onRefreshRecipes: (preference?: string, calorieTarget?: number) => Promise<void>;
  isLoadingRecipes: boolean;
}

export const RecipeRecommendations: React.FC<RecipeRecommendationsProps> = ({
  recipes,
  pantryItems,
  onCookRecipe,
  onRefreshRecipes,
  isLoadingRecipes,
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filters = ['All', 'Quick (<15m)', 'High Protein', 'Vegetarian', 'Simple Ingredients'];

  const filteredRecipes = recipes.filter((r) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Quick (<15m)') return r.prepTimeMinutes + r.cookTimeMinutes <= 15;
    if (activeFilter === 'High Protein') return r.macros.protein >= 25;
    if (activeFilter === 'Vegetarian')
      return !r.matchedIngredients.some((i) => /chicken|beef|pork|salmon|meat|shrimp|fish/i.test(i));
    if (activeFilter === 'Simple Ingredients')
      return r.matchedIngredients.length + r.missingIngredients.length <= 5;
    return true;
  });

  return (
    <div className="flex-1 p-4 pb-24 space-y-4 text-stone-100 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
            PlateUP Kitchen
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Recipe Suggestions
          </h1>
        </div>

        <button
          onClick={() => onRefreshRecipes(activeFilter !== 'All' ? activeFilter : 'Balanced')}
          disabled={isLoadingRecipes}
          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoadingRecipes ? 'animate-spin text-emerald-400' : ''} />
          <span>New Recipes</span>
        </button>
      </div>

      <p className="text-xs text-stone-400 leading-relaxed">
        Dishes recommended using ingredients currently in your kitchen ({pantryItems.length} items available).
      </p>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === f
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-sm'
                : 'bg-stone-800 text-stone-400 hover:text-white border border-stone-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Recipes List */}
      <div className="space-y-3 pt-1">
        {filteredRecipes.length === 0 ? (
          <div className="p-8 rounded-2xl bg-stone-800/50 border border-stone-700 text-center space-y-3">
            <span className="text-3xl">🥘</span>
            <h3 className="text-sm font-bold text-white">No recipes found for this filter</h3>
            <p className="text-xs text-stone-400">
              Try switching filters or tap below to find recipes matching your pantry ingredients.
            </p>
            <button
              onClick={() => onRefreshRecipes('Balanced')}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-stone-950 font-bold text-xs cursor-pointer"
            >
              Find Matching Recipes
            </button>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
            const matchCount = recipe.matchedIngredients.length;

            return (
              <div
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className="group p-4 rounded-3xl bg-stone-800 hover:bg-stone-800 border border-stone-700 hover:border-emerald-500/40 transition-all cursor-pointer space-y-3 shadow-md"
              >
                <div className="flex gap-3.5">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-20 h-20 rounded-2xl object-cover ring-1 ring-stone-700 shrink-0 group-hover:scale-102 transition-transform"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-stone-800 flex items-center justify-center text-2xl shrink-0">
                      🍲
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono">
                        {matchCount} ingredients in pantry
                      </span>

                      {/* Calorie information on scanned & recommended recipes */}
                      <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                        <Flame size={12} /> {recipe.caloriesPerServing} kcal
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {recipe.title}
                    </h3>

                    <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {recipe.description}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {totalTime} mins
                      </span>
                      <span>•</span>
                      <span>{recipe.difficulty}</span>
                      <span>•</span>
                      <span className="font-mono text-stone-300">
                        P:{recipe.macros.protein}g C:{recipe.macros.carbs}g
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-700/70 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-stone-400 truncate max-w-[240px]">
                    <span className="text-emerald-400 font-medium">
                      ✓ {recipe.matchedIngredients.slice(0, 3).join(', ')}
                    </span>
                    {recipe.missingIngredients.length > 0 && (
                      <span className="text-amber-400/90 text-[10px]">
                        (+{recipe.missingIngredients.length} needed)
                      </span>
                    )}
                  </div>

                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5 shrink-0 group-hover:translate-x-1 transition-transform">
                    View <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FULL RECIPE DETAIL MODAL */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-700 p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {selectedRecipe.difficulty} • {selectedRecipe.servings} Servings
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedRecipe.title}</h3>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedRecipe.imageUrl && (
              <img
                src={selectedRecipe.imageUrl}
                alt={selectedRecipe.title}
                className="w-full h-40 rounded-2xl object-cover ring-1 ring-stone-700"
              />
            )}

            <p className="text-xs text-stone-300 leading-relaxed">{selectedRecipe.description}</p>

            {/* Estimated Calories & Nutrition */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-stone-800 border border-stone-700">
                <span className="text-[9px] text-stone-400 block uppercase">Calories</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">
                  {selectedRecipe.caloriesPerServing}
                </span>
                <span className="text-[9px] text-stone-500">kcal</span>
              </div>
              <div className="p-2 rounded-xl bg-stone-800 border border-stone-700">
                <span className="text-[9px] text-stone-400 block uppercase">Protein</span>
                <span className="text-sm font-extrabold text-stone-200 font-mono">
                  {selectedRecipe.macros.protein}g
                </span>
              </div>
              <div className="p-2 rounded-xl bg-stone-800 border border-stone-700">
                <span className="text-[9px] text-stone-400 block uppercase">Carbs</span>
                <span className="text-sm font-extrabold text-stone-200 font-mono">
                  {selectedRecipe.macros.carbs}g
                </span>
              </div>
              <div className="p-2 rounded-xl bg-stone-800 border border-stone-700">
                <span className="text-[9px] text-stone-400 block uppercase">Fat</span>
                <span className="text-sm font-extrabold text-stone-200 font-mono">
                  {selectedRecipe.macros.fat}g
                </span>
              </div>
            </div>

            {/* Ingredients Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Ingredients Check
              </h4>

              <div className="space-y-1.5 text-xs">
                {selectedRecipe.matchedIngredients.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  >
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span className="font-medium">{item}</span>
                    <span className="text-[10px] text-emerald-400/80 ml-auto font-mono">In kitchen</span>
                  </div>
                ))}

                {selectedRecipe.missingIngredients.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300"
                  >
                    <AlertCircle size={14} className="text-amber-400 shrink-0" />
                    <span className="font-medium">{item}</span>
                    <span className="text-[10px] text-amber-400/80 ml-auto font-mono">Missing</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Substitutions */}
            {selectedRecipe.substitutions && selectedRecipe.substitutions.length > 0 && (
              <div className="p-3 rounded-2xl bg-stone-800 border border-stone-700 space-y-1">
                <span className="text-xs font-bold text-emerald-400">
                  Helpful Ingredient Substitutions:
                </span>
                <div className="space-y-1 text-xs">
                  {selectedRecipe.substitutions.map((sub, i) => (
                    <div key={i} className="text-stone-300 text-[11px]">
                      <span className="font-semibold text-white">Instead of {sub.original}:</span>{' '}
                      Use <span className="text-emerald-300 font-medium">{sub.substitute}</span> ({sub.reason}).
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Cooking Instructions
              </h4>
              <ol className="space-y-2 text-xs text-stone-300">
                {selectedRecipe.instructions.map((step, idx) => (
                  <li key={idx} className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-stone-800 text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-stone-700">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Cook and Log Calorie Action */}
            <div className="pt-2 border-t border-stone-800">
              <button
                onClick={() => {
                  onCookRecipe(selectedRecipe);
                  setSelectedRecipe(null);
                }}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <Utensils size={15} />
                <span>Cooked This! Log {selectedRecipe.caloriesPerServing} kcal to Meal History</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
