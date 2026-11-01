export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mealType: MealSlot;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  ingredients?: string[];
  imageUrl?: string;
  healthPerks?: string[];
  dietaryTags?: string[];
  source?: 'manual' | 'scanned_image' | 'cooked_recipe';
}

export type IngredientCategory =
  | 'Produce'
  | 'Proteins'
  | 'Dairy & Eggs'
  | 'Grains & Bakery'
  | 'Spices & Condiments'
  | 'Canned & Pantry'
  | 'Beverages'
  | 'Snacks';

export interface PantryItem {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: string;
  addedDate: string;
  expiryDays?: number;
  estimatedCalories?: number;
  confidence?: number;
  healthPerks?: string;
  storageTip?: string;
}

export interface RecipeSubstitution {
  original: string;
  substitute: string;
  reason: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  servings: number;
  caloriesPerServing: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  matchedIngredients: string[];
  missingIngredients: string[];
  substitutions: RecipeSubstitution[];
  instructions: string[];
  healthPerks: string[];
  healthRisksOrNotes?: string;
  imageUrl?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  dailyCalorieGoal: number;
  macroGoals: {
    protein: number; // in grams
    carbs: number;   // in grams
    fat: number;     // in grams
  };
  waterGoalMl: number;
  weightKg: number;
  targetWeightKg: number;
  heightCm: number;
  dietaryPreferences: string[];
  allergies: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
