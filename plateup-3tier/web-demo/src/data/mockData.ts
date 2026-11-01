import { MealEntry, PantryItem, Recipe, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Student User',
  email: 'user@plateup.local',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  dailyCalorieGoal: 2000,
  macroGoals: {
    protein: 120,
    carbs: 220,
    fat: 65,
  },
  waterGoalMl: 2000,
  weightKg: 65.0,
  targetWeightKg: 65.0,
  heightCm: 170,
  dietaryPreferences: ['Balanced'],
  allergies: [],
};

// Starts completely EMPTY as requested
export const INITIAL_MEALS: MealEntry[] = [];
export const INITIAL_PANTRY: PantryItem[] = [];
export const INITIAL_RECIPES: Recipe[] = [];

// Sample test photos for camera scanning (purely food/kitchen photos - NO GROCERY RECEIPTS)
export const SAMPLE_SCAN_PRESETS = [
  {
    id: 'fridge-1',
    title: 'Refrigerator Shelf',
    type: 'fridge',
    description: 'Fresh eggs, spinach, bell peppers, chicken cutlets',
    thumbnail: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'kitchen-1',
    title: 'Kitchen Counter Ingredients',
    type: 'kitchen',
    description: 'Tomatoes, garlic cloves, avocados, lemon, parsley',
    thumbnail: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'pantry-1',
    title: 'Pantry Shelf Items',
    type: 'pantry',
    description: 'Pasta, canned tomatoes, olive oil, dried herbs',
    thumbnail: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&auto=format&fit=crop&q=80',
  },
];
