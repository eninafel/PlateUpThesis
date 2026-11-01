import React, { useState } from 'react';
import { PantryItem, IngredientCategory } from '../types';
import { Plus, Trash2, Camera, Sparkles, AlertTriangle, ShieldCheck, Search } from 'lucide-react';

interface PantryManagerProps {
  pantryItems: PantryItem[];
  onAddItem: (item: Omit<PantryItem, 'id' | 'addedDate'>) => void;
  onDeleteItem: (id: string) => void;
  onOpenScan: () => void;
  onFindRecipes: () => void;
}

export const PantryManager: React.FC<PantryManagerProps> = ({
  pantryItems,
  onAddItem,
  onDeleteItem,
  onOpenScan,
  onFindRecipes,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<IngredientCategory>('Produce');
  const [quantity, setQuantity] = useState<string>('1 item');
  const [expiryDays, setExpiryDays] = useState<number>(5);
  const [estimatedCalories, setEstimatedCalories] = useState<number>(60);

  const categories: (string | IngredientCategory)[] = [
    'All',
    'Produce',
    'Proteins',
    'Dairy & Eggs',
    'Grains & Bakery',
    'Spices & Condiments',
    'Canned & Pantry',
  ];

  const filteredItems = pantryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddItem({
      name,
      category,
      quantity,
      expiryDays: Number(expiryDays) || 5,
      estimatedCalories: Number(estimatedCalories) || 50,
      confidence: 1.0,
      storageTip: 'Store properly in designated pantry or refrigerator compartment.',
    });

    setName('');
    setShowAddForm(false);
  };

  // Expiring soon items (<= 3 days)
  const expiringSoonCount = pantryItems.filter((i) => i.expiryDays && i.expiryDays <= 3).length;

  return (
    <div className="flex-1 p-4 pb-24 space-y-4 text-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
            Kitchen & Refrigerator
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            My Pantry ({pantryItems.length})
          </h1>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Food</span>
        </button>
      </div>

      {/* Freshness / Food Waste Alert Banner */}
      {expiringSoonCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-300">
                {expiringSoonCount} item{expiringSoonCount === 1 ? '' : 's'} expiring soon!
              </h4>
              <p className="text-[10px] text-neutral-400">
                Cook them today to reduce food waste and save budget.
              </p>
            </div>
          </div>
          <button
            onClick={onFindRecipes}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
          >
            Cook Now
          </button>
        </div>
      )}

      {/* Quick Scan Action */}
      <div className="flex gap-2">
        <button
          onClick={onOpenScan}
          className="flex-1 py-2.5 rounded-2xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all hover:border-emerald-500/40 cursor-pointer"
        >
          <Camera size={15} className="text-emerald-400" />
          <span>Scan Fridge or Receipt</span>
        </button>
        <button
          onClick={onFindRecipes}
          className="flex-1 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles size={15} className="text-emerald-400" />
          <span>Recommend Recipes</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pantry items..."
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Add Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreateItem}
          className="p-4 rounded-2xl bg-neutral-800 border border-emerald-500/30 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">Manual Add Ingredient</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-neutral-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Romaine Lettuce"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IngredientCategory)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-2 py-1.5 text-xs text-white"
              >
                <option value="Produce">Produce</option>
                <option value="Proteins">Proteins</option>
                <option value="Dairy & Eggs">Dairy & Eggs</option>
                <option value="Grains & Bakery">Grains & Bakery</option>
                <option value="Spices & Condiments">Spices & Condiments</option>
                <option value="Canned & Pantry">Canned & Pantry</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Quantity</label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 2 heads"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-2 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Freshness (Days)</label>
              <input
                type="number"
                min="1"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-2 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Calories (est)</label>
              <input
                type="number"
                min="0"
                value={estimatedCalories}
                onChange={(e) => setEstimatedCalories(Number(e.target.value))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-2 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs"
          >
            Add to Kitchen
          </button>
        </form>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-800/40 border border-neutral-700 text-center space-y-2">
            <span className="text-2xl">🧊</span>
            <p className="text-xs text-neutral-400">No ingredients match your filter.</p>
            <button
              onClick={onOpenScan}
              className="text-xs text-emerald-400 font-bold hover:underline"
            >
              Scan your fridge to populate inventory →
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpiringSoon = item.expiryDays && item.expiryDays <= 3;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-neutral-700 flex items-center justify-center text-lg shrink-0">
                    {item.category === 'Produce'
                      ? '🥦'
                      : item.category === 'Proteins'
                      ? '🍗'
                      : item.category === 'Dairy & Eggs'
                      ? '🥚'
                      : item.category === 'Grains & Bakery'
                      ? '🍞'
                      : '🥫'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate max-w-[170px]">
                        {item.name}
                      </h4>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-700 text-neutral-300">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                      <span className="text-emerald-400 font-mono">
                        ~{item.estimatedCalories || 50} kcal
                      </span>
                      <span>•</span>
                      <span
                        className={`font-medium ${
                          isExpiringSoon ? 'text-amber-400' : 'text-neutral-400'
                        }`}
                      >
                        {item.expiryDays
                          ? `Use within ${item.expiryDays}d`
                          : 'Pantry staple'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
