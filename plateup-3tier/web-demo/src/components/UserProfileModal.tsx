import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Target, Shield, Check, RotateCcw } from 'lucide-react';
import { INITIAL_USER_PROFILE } from '../data/mockData';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onResetDemoData: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onResetDemoData,
}) => {
  const [profile, setProfile] = useState<UserProfile>({ ...userProfile });

  if (!isOpen) return null;

  const dietaryOptions = [
    'High Protein',
    'Balanced',
    'Low Carb',
    'Keto',
    'Vegetarian',
    'Vegan',
    'Low Sugar',
    'Diabetic Friendly',
    'Heart Healthy',
  ];

  const allergyOptions = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Gluten', 'Shellfish', 'Soy'];

  const toggleDietary = (item: string) => {
    setProfile((prev) => {
      const exists = prev.dietaryPreferences.includes(item);
      return {
        ...prev,
        dietaryPreferences: exists
          ? prev.dietaryPreferences.filter((d) => d !== item)
          : [...prev.dietaryPreferences, item],
      };
    });
  };

  const toggleAllergy = (item: string) => {
    setProfile((prev) => {
      const exists = prev.allergies.includes(item);
      return {
        ...prev,
        allergies: exists ? prev.allergies.filter((a) => a !== item) : [...prev.allergies, item],
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-700 p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <User size={18} className="text-emerald-400" />
            <h2 className="text-base font-bold text-white">User Profile & Nutrition Goals</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* User Bio Header */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800 border border-neutral-700">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/50"
            />
            <div className="flex-1">
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-transparent font-bold text-sm text-white focus:outline-none focus:border-b border-emerald-500"
                placeholder="Your Name"
              />
              <span className="text-[11px] text-neutral-400 block">{profile.email}</span>
            </div>
          </div>

          {/* Calorie Goal & Macro Targets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Target size={14} className="text-emerald-400" /> Daily Targets
              </span>
              <span className="text-[10px] text-neutral-400">Customizable</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60">
                <label className="text-[10px] text-neutral-400 block mb-0.5">
                  Daily Calorie Goal (kcal)
                </label>
                <input
                  type="number"
                  min="800"
                  max="6000"
                  step="50"
                  value={profile.dailyCalorieGoal}
                  onChange={(e) =>
                    setProfile({ ...profile, dailyCalorieGoal: Number(e.target.value) })
                  }
                  className="w-full bg-transparent text-sm font-extrabold text-emerald-400 font-mono focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60">
                <label className="text-[10px] text-neutral-400 block mb-0.5">
                  Daily Water Goal (ml)
                </label>
                <input
                  type="number"
                  min="500"
                  max="6000"
                  step="250"
                  value={profile.waterGoalMl}
                  onChange={(e) =>
                    setProfile({ ...profile, waterGoalMl: Number(e.target.value) })
                  }
                  className="w-full bg-transparent text-sm font-extrabold text-sky-400 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Macro Goals */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700">
                <label className="text-[9px] font-bold text-indigo-400 block uppercase">
                  Protein Goal (g)
                </label>
                <input
                  type="number"
                  min="20"
                  value={profile.macroGoals.protein}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      macroGoals: { ...profile.macroGoals, protein: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>

              <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700">
                <label className="text-[9px] font-bold text-amber-400 block uppercase">
                  Carbs Goal (g)
                </label>
                <input
                  type="number"
                  min="20"
                  value={profile.macroGoals.carbs}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      macroGoals: { ...profile.macroGoals, carbs: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>

              <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700">
                <label className="text-[9px] font-bold text-rose-400 block uppercase">
                  Fat Goal (g)
                </label>
                <input
                  type="number"
                  min="10"
                  value={profile.macroGoals.fat}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      macroGoals: { ...profile.macroGoals, fat: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Body Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700/60">
              <label className="text-[10px] text-neutral-400 block">Current Weight</label>
              <div className="flex items-baseline gap-1 mt-0.5">
                <input
                  type="number"
                  step="0.1"
                  value={profile.weightKg}
                  onChange={(e) => setProfile({ ...profile, weightKg: Number(e.target.value) })}
                  className="w-14 bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
                <span className="text-[10px] text-neutral-400">kg</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700/60">
              <label className="text-[10px] text-neutral-400 block">Target Weight</label>
              <div className="flex items-baseline gap-1 mt-0.5">
                <input
                  type="number"
                  step="0.1"
                  value={profile.targetWeightKg}
                  onChange={(e) =>
                    setProfile({ ...profile, targetWeightKg: Number(e.target.value) })
                  }
                  className="w-14 bg-transparent text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                />
                <span className="text-[10px] text-neutral-400">kg</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700/60">
              <label className="text-[10px] text-neutral-400 block">Height</label>
              <div className="flex items-baseline gap-1 mt-0.5">
                <input
                  type="number"
                  value={profile.heightCm}
                  onChange={(e) => setProfile({ ...profile, heightCm: Number(e.target.value) })}
                  className="w-14 bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
                <span className="text-[10px] text-neutral-400">cm</span>
              </div>
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-white block">Dietary Preferences</span>
            <div className="flex flex-wrap gap-1.5">
              {dietaryOptions.map((opt) => {
                const active = profile.dietaryPreferences.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleDietary(opt)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors ${
                      active
                        ? 'bg-emerald-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700/60'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergies / Exclusions */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <Shield size={12} className="text-amber-400" /> Allergies & Exclusions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allergyOptions.map((opt) => {
                const active = profile.allergies.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleAllergy(opt)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors ${
                      active
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700/60'
                    }`}
                  >
                    {active ? `✕ ${opt}` : opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Check size={14} /> Save Profile Settings
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Reset to default PlateUP demo profile and sample data?')) {
                  onResetDemoData();
                  onClose();
                }
              }}
              className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <RotateCcw size={13} /> Reset Demo Meals & Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
