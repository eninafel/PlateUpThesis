/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AndroidEmulator } from './components/AndroidEmulator';
import { AndroidEmulatorHome } from './components/AndroidEmulatorHome';
import { HomeDiscover } from './components/HomeDiscover';
import { AiChatbotScreen } from './components/AiChatbotScreen';
import { RecipeRecommendations } from './components/RecipeRecommendations';
import { PantryManager } from './components/PantryManager';
import { MealHistoryView } from './components/MealHistoryView';
import { ScanIngredientsModal } from './components/ScanIngredientsModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminConsole } from './components/AdminConsole';
import { ConfettiEffect } from './components/ConfettiEffect';
import { WasteTracker } from './components/WasteTracker';
import { MealEntry, PantryItem, Recipe, UserProfile } from './types';
import {
  INITIAL_USER_PROFILE,
  INITIAL_MEALS,
  INITIAL_PANTRY,
  INITIAL_RECIPES,
  SAMPLE_SCAN_PRESETS,
} from './data/mockData';
import { Camera, Utensils, MessageSquare, BookOpen, Clock, Refrigerator } from 'lucide-react';

// Local-time YYYY-MM-DD (toISOString would shift the date for users east/west of UTC)
const todayISO = (): string => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export default function App() {
  // Real Android Emulator State
  const [isScreenOn, setIsScreenOn] = useState<boolean>(true);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [isAppOpen, setIsAppOpen] = useState<boolean>(false);
  const [isAppLaunching, setIsAppLaunching] = useState<boolean>(false);

  // In-app tab: 'home' | 'aichatbot' | 'recipes' | 'pantry' | 'history'
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

  // Role: User (Default) vs Coder / Admin (Restricted access for thesis defense)
  const [isAdminRole, setIsAdminRole] = useState<boolean>(false);
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState<boolean>(false);

  // Time for status bar
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  // Strict empty starting state: 0 pantry, 0 recipes, 0 meals, 0 calories
  const [meals, setMeals] = useState<MealEntry[]>(() => {
    const saved = localStorage.getItem('plateup_empty_meals_v3');
    return saved ? JSON.parse(saved) : INITIAL_MEALS;
  });

  const [pantry, setPantry] = useState<PantryItem[]>(() => {
    const saved = localStorage.getItem('plateup_empty_pantry_v3');
    return saved ? JSON.parse(saved) : INITIAL_PANTRY;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('plateup_empty_recipes_v3');
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('plateup_empty_profile_v3');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  // Modal states
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [activePresetScan, setActivePresetScan] = useState<typeof SAMPLE_SCAN_PRESETS[0] | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Feedback & toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('plateup_empty_meals_v3', JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem('plateup_empty_pantry_v3', JSON.stringify(pantry));
  }, [pantry]);

  useEffect(() => {
    localStorage.setItem('plateup_empty_recipes_v3', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('plateup_empty_profile_v3', JSON.stringify(userProfile));
  }, [userProfile]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Launch PlateUP with Android Splash Screen animation
  const handleLaunchPlateUp = (targetTab: string = 'home') => {
    setIsAppLaunching(true);
    setTimeout(() => {
      setIsAppLaunching(false);
      setIsAppOpen(true);
      setActiveTab(targetTab);
    }, 450);
  };

  // Add items from camera scan to kitchen inventory and run algorithm
  const handleAddItemsToPantry = async (
    newItems: Omit<PantryItem, 'id' | 'addedDate'>[]
  ) => {
    const formatted: PantryItem[] = newItems.map((item, idx) => ({
      ...item,
      id: `p-${Date.now()}-${idx}`,
      addedDate: selectedDate,
      expiryDays: item.expiryDays || 7,
    }));

    const updated = [...formatted, ...pantry];
    setPantry(updated);
    setShowConfetti(true);
    triggerToast(`Added ${formatted.length} ingredient(s) with calorie counts!`);

    await executeRecipeAlgorithm(updated);
  };

  const handleDeletePantryItem = (id: string) => {
    const remaining = pantry.filter((item) => item.id !== id);
    setPantry(remaining);
    triggerToast('Item removed');
    if (remaining.length > 0) {
      executeRecipeAlgorithm(remaining);
    } else {
      setRecipes([]);
    }
  };

  // Execute recipe matching algorithm on available ingredients
  const executeRecipeAlgorithm = async (items: PantryItem[]) => {
    if (items.length === 0) {
      setRecipes([]);
      return;
    }

    setIsLoadingRecipes(true);
    try {
      const response = await fetch('/api/recommend-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pantryIngredients: items.map((p) => p.name),
          dietaryPreference: userProfile.dietaryPreferences[0] || 'Balanced',
          calorieTarget: 500,
          mealType: 'Dinner',
          excludeAllergies: userProfile.allergies,
        }),
      });

      const data = await response.json();
      if (data.success && data.recipes && data.recipes.length > 0) {
        setRecipes(data.recipes);
        triggerToast(
          data.demo
            ? 'Sample recipes shown (add GEMINI_API_KEY for real AI recipes)'
            : 'Matched recipes based on your ingredients!'
        );
      } else if (data.error) {
        triggerToast('Recipe AI error: ' + data.error);
      }
    } catch {
      triggerToast("Couldn't reach the server. Is `npm run dev` running?");
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // Cook recipe action: Records meal and adds its calories to history
  const handleCookRecipe = (recipe: Recipe) => {
    const newMeal: MealEntry = {
      id: `m-${Date.now()}`,
      date: selectedDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mealType: 'Dinner',
      name: recipe.title,
      portion: `1 serving`,
      calories: recipe.caloriesPerServing,
      protein: recipe.macros.protein,
      carbs: recipe.macros.carbs,
      fat: recipe.macros.fat,
      fiber: recipe.macros.fiber,
      imageUrl: recipe.imageUrl,
      healthPerks: recipe.healthPerks,
      source: 'cooked_recipe',
    };

    setMeals((prev) => [newMeal, ...prev]);
    setShowConfetti(true);
    triggerToast(`Cooked ${recipe.title}! +${recipe.caloriesPerServing} kcal added to today's log`);
    setActiveTab('history');
  };

  const handleDeleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    triggerToast('Meal removed');
  };

  const handleResetDemoData = () => {
    setMeals(INITIAL_MEALS);
    setPantry(INITIAL_PANTRY);
    setRecipes(INITIAL_RECIPES);
    setUserProfile(INITIAL_USER_PROFILE);
    localStorage.removeItem('plateup_empty_meals_v3');
    localStorage.removeItem('plateup_empty_pantry_v3');
    localStorage.removeItem('plateup_empty_recipes_v3');
    triggerToast('Reset to 0 ingredients and 0 meals.');
  };

  return (
    <>
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* REAL ANDROID MOBILE EMULATOR */}
      <AndroidEmulator
        isScreenOn={isScreenOn}
        onTogglePower={() => setIsScreenOn(!isScreenOn)}
        isUnlocked={isUnlocked}
        onUnlock={() => setIsUnlocked(true)}
        isAppOpen={isAppOpen}
        onLaunchApp={() => handleLaunchPlateUp('home')}
        onHomePress={() => setIsAppOpen(false)}
        onBackPress={() => {
          if (isAppOpen) {
            if (activeTab !== 'home') setActiveTab('home');
            else setIsAppOpen(false);
          }
        }}
        isAdminRole={isAdminRole}
        onToggleAdminRole={() => {
          const next = !isAdminRole;
          setIsAdminRole(next);
          triggerToast(`Role: ${next ? 'Coder / Admin' : 'Student (User)'}`);
        }}
        onOpenAdminConsole={() => setIsAdminConsoleOpen(true)}
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 backdrop-blur animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ANDROID SPLASH SCREEN TRANSITION */}
        {isAppLaunching && (
          <div className="flex-1 bg-stone-950 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-stone-950 flex items-center justify-center text-3xl shadow-2xl mb-3">
              <Utensils size={34} strokeWidth={2.4} />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">PlateUP</h2>
            <span className="text-[10px] font-mono text-emerald-400 mt-1">Starting PlateUP...</span>
          </div>
        )}

        {/* 1. REAL ANDROID OS LAUNCHER (When PlateUP is not open) */}
        {!isAppOpen && !isAppLaunching && (
          <AndroidEmulatorHome
            onLaunchPlateUp={() => handleLaunchPlateUp('home')}
            onLaunchCamera={() => {
              handleLaunchPlateUp('home');
              setIsScanModalOpen(true);
            }}
            onOpenSettings={() => setIsProfileModalOpen(true)}
            onOpenAdminConsole={() => setIsAdminConsoleOpen(true)}
            isAdminRole={isAdminRole}
            currentTime={currentTime}
          />
        )}

        {/* 2. INSIDE THE PLATEUP APPLICATION */}
        {isAppOpen && !isAppLaunching && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-900">
            {/* Main Scrollable Viewport */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col scrollbar-thin scrollbar-thumb-neutral-800">
              {/* Tab 1: Scanner / Home */}
              {activeTab === 'home' && (
                <HomeDiscover
                  pantryItems={pantry}
                  meals={meals}
                  recipes={recipes}
                  userProfile={userProfile}
                  selectedDate={selectedDate}
                  onOpenScan={() => {
                    setActivePresetScan(null);
                    setIsScanModalOpen(true);
                  }}
                  onOpenRecipes={() => setActiveTab('recipes')}
                  onOpenAiChatbot={() => setActiveTab('aichatbot')}
                  onSelectRecipe={() => setActiveTab('recipes')}
                  onOpenProfile={() => setIsProfileModalOpen(true)}
                  onSelectPresetScan={(preset) => {
                    setActivePresetScan(preset);
                    setIsScanModalOpen(true);
                  }}
                  onCookRecipe={handleCookRecipe}
                />
              )}

              {/* Tab 2: INSIDE PLATEUP AI CHATBOT (Direct dedicated Chatbot Screen!) */}
              {activeTab === 'aichatbot' && (
                <AiChatbotScreen
                  pantryItems={pantry}
                  todayMeals={meals.filter((m) => m.date === selectedDate)}
                  userProfile={userProfile}
                />
              )}

              {/* Tab 3: Recipes */}
              {activeTab === 'recipes' && (
                <RecipeRecommendations
                  recipes={recipes}
                  pantryItems={pantry}
                  onCookRecipe={handleCookRecipe}
                  onRefreshRecipes={async () => {
                    await executeRecipeAlgorithm(pantry);
                  }}
                  isLoadingRecipes={isLoadingRecipes}
                />
              )}

              {/* Tab 4: Kitchen / Pantry */}
              {activeTab === 'pantry' && (
                <>
                <WasteTracker
                  pantryItems={pantry}
                  meals={meals}
                  onFindRecipes={() => {
                    setActiveTab('recipes');
                    executeRecipeAlgorithm(pantry);
                  }}
                />
                <PantryManager
                  pantryItems={pantry}
                  onAddItem={(item) => handleAddItemsToPantry([item])}
                  onDeleteItem={handleDeletePantryItem}
                  onOpenScan={() => {
                    setActivePresetScan(null);
                    setIsScanModalOpen(true);
                  }}
                  onFindRecipes={() => {
                    setActiveTab('recipes');
                    executeRecipeAlgorithm(pantry);
                  }}
                />
                </>
              )}

              {/* Tab 5: Meal History */}
              {activeTab === 'history' && (
                <MealHistoryView
                  meals={meals}
                  userProfile={userProfile}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onDeleteMeal={handleDeleteMeal}
                  onOpenRecipes={() => setActiveTab('recipes')}
                />
              )}
            </div>

            {/* In-App Bottom Navigation Bar (With Direct AI Chatbot Tab!) */}
            <nav className="w-full bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 px-1 pt-1.5 pb-2 flex items-center justify-around z-30 select-none shrink-0 shadow-lg">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'home'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className={`p-1 rounded-xl ${activeTab === 'home' ? 'bg-emerald-500/15' : ''}`}>
                  <Utensils size={18} />
                </div>
                <span className="text-[10px] mt-0.5">Home</span>
              </button>

              {/* AI CHATBOT TAB (Directly inside PlateUP!) */}
              <button
                onClick={() => setActiveTab('aichatbot')}
                className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'aichatbot'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className={`p-1 rounded-xl ${activeTab === 'aichatbot' ? 'bg-emerald-500/15' : ''}`}>
                  <MessageSquare size={18} />
                </div>
                <span className="text-[10px] mt-0.5 font-bold">AI Chat</span>
              </button>

              {/* Center Camera Scan */}
              <button
                onClick={() => {
                  setActivePresetScan(null);
                  setIsScanModalOpen(true);
                }}
                className="flex flex-col items-center justify-center -mt-4 mx-1 cursor-pointer group"
                title="Camera Scanner"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-stone-950 flex items-center justify-center shadow-lg group-hover:scale-105 active:scale-95 transition-transform border-2 border-stone-900">
                  <Camera size={21} strokeWidth={2.3} />
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 mt-0.5">Scan</span>
              </button>

              <button
                onClick={() => setActiveTab('recipes')}
                className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'recipes'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className={`p-1 rounded-xl ${activeTab === 'recipes' ? 'bg-emerald-500/15' : ''}`}>
                  <BookOpen size={18} />
                </div>
                <span className="text-[10px] mt-0.5">Recipes</span>
              </button>

              <button
                onClick={() => setActiveTab('pantry')}
                className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'pantry'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className={`p-1 rounded-xl ${activeTab === 'pantry' ? 'bg-emerald-500/15' : ''}`}>
                  <Refrigerator size={18} />
                </div>
                <span className="text-[10px] mt-0.5">Pantry</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className={`p-1 rounded-xl ${activeTab === 'history' ? 'bg-emerald-500/15' : ''}`}>
                  <Clock size={18} />
                </div>
                <span className="text-[10px] mt-0.5">History</span>
              </button>
            </nav>
          </div>
        )}
      </AndroidEmulator>

      {/* Camera Ingredient Scanner Modal */}
      <ScanIngredientsModal
        isOpen={isScanModalOpen}
        onClose={() => {
          setIsScanModalOpen(false);
          setActivePresetScan(null);
        }}
        initialPreset={activePresetScan}
        onAddSelectedToPantry={handleAddItemsToPantry}
        onFindRecipesWithIngredients={async () => {
          setActiveTab('recipes');
          await executeRecipeAlgorithm(pantry);
        }}
      />

      {/* User Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={(updated) => {
          setUserProfile(updated);
          triggerToast('Profile updated');
        }}
        onResetDemoData={handleResetDemoData}
      />

      {/* Admin / Coder Console (MySQL Database & PHP REST API) */}
      {isAdminRole && isAdminConsoleOpen && (
        <AdminConsole
          pantryItems={pantry}
          meals={meals}
          recipes={recipes}
          userProfile={userProfile}
          onClose={() => setIsAdminConsoleOpen(false)}
        />
      )}
    </>
  );
}
