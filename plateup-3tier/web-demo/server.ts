import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Gemini model used by every AI endpoint (AI Chatbot, scanner, recipes, meal analysis).
// Override with GEMINI_MODEL in .env if Google retires or renames it.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

app.use(express.json({ limit: '20mb' }));

// Server-side Gemini client
// Ignore empty values and the placeholder from .env.example.
const rawKey = (process.env.GEMINI_API_KEY || '').trim();
const apiKey = rawKey && !rawKey.startsWith('MY_') ? rawKey : '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/** Lets the app show whether AI Chatbot is really connected to Gemini. */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, aiConnected: !!ai, model: GEMINI_MODEL });
});

/**
 * 1. SCAN INGREDIENTS / FOOD ITEMS / RECEIPTS
 */
app.post('/api/scan-ingredients', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', scanType = 'fridge', textHint } = req.body;

    if (!imageBase64 && !textHint) {
      return res.status(400).json({ error: 'Image base64 data or text hint is required.' });
    }

    if (!ai) {
      // Mock fallback if API key is not present
      return res.json({
        success: true,
        demo: true,
        summary: 'Demo Scan (no GEMINI_API_KEY set, so these are sample items, not your photo): Detected common fresh pantry ingredients.',
        detectedIngredients: [
          {
            id: 'item-1',
            name: 'Fresh Chicken Breast',
            category: 'Proteins',
            quantity: '500g',
            confidence: 0.96,
            estimatedCalories: 165,
            healthPerks: 'Lean protein source, low in saturated fat',
            storageTip: 'Keep refrigerated at 4°C, use within 2 days',
          },
          {
            id: 'item-2',
            name: 'Eggs',
            category: 'Dairy & Eggs',
            quantity: '6 pcs',
            confidence: 0.94,
            estimatedCalories: 72,
            healthPerks: 'Rich in choline, vitamin B12, and high biological value protein',
            storageTip: 'Store in middle refrigerator shelf in original carton',
          },
          {
            id: 'item-3',
            name: 'Baby Spinach',
            category: 'Produce',
            quantity: '1 bag (200g)',
            confidence: 0.91,
            estimatedCalories: 23,
            healthPerks: 'High in iron, folate, and vitamins A & K',
            storageTip: 'Keep dry with paper towel in crisper drawer',
          },
          {
            id: 'item-4',
            name: 'Garlic Bulbs',
            category: 'Produce',
            quantity: '1 head',
            confidence: 0.95,
            estimatedCalories: 14,
            healthPerks: 'Contains allicin for immune and cardiovascular support',
            storageTip: 'Store in cool, dark, well-ventilated dry place',
          },
          {
            id: 'item-5',
            name: 'Greek Yogurt',
            category: 'Dairy & Eggs',
            quantity: '300g',
            confidence: 0.88,
            estimatedCalories: 100,
            healthPerks: 'Probiotics for gut health and concentrated whey-free protein',
            storageTip: 'Keep sealed tightly in coldest part of fridge',
          },
        ],
      });
    }

    const cleanBase64 = imageBase64 ? imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '') : '';

    let promptText = `You are PlateUP's ingredient recognition engine.
Analyze this food ingredients image (refrigerator, pantry, kitchen counter, or ingredients group).
${textHint ? `Additional user hint: "${textHint}".` : ''}

Identify all discernible food ingredients, produce, items, or raw ingredients.
For each item provide:
1. "name": clear standard culinary ingredient name (e.g., "Eggs", "Spinach", "Chicken Breast", "Tomatoes", "Garlic")
2. "category": one of ["Produce", "Proteins", "Dairy & Eggs", "Grains & Bakery", "Spices & Condiments", "Canned & Pantry"]
3. "quantity": estimated observed quantity with units (e.g., "6 pcs", "250g", "1 head", "2 pieces")
4. "confidence": number between 0.6 and 0.99 indicating visual certainty
5. "estimatedCalories": estimated calories per standard serving or whole detected amount (integer kcal)
6. "healthPerks": short benefit (e.g., "High in protein", "Rich in iron")
7. "storageTip": short tip to prevent food spoilage

Respond in strict JSON format.`;

    const contents: any[] = [];
    if (cleanBase64) {
      contents.push({
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          { text: promptText },
        ],
      });
    } else {
      contents.push(promptText);
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents[0],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Short summary of detected food items and quality.' },
            detectedIngredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  estimatedCalories: { type: Type.INTEGER },
                  healthPerks: { type: Type.STRING },
                  storageTip: { type: Type.STRING },
                },
                required: ['name', 'category', 'quantity', 'confidence', 'estimatedCalories'],
              },
            },
          },
          required: ['summary', 'detectedIngredients'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const detectedIngredientsWithIds = (parsed.detectedIngredients || []).map((item: any, idx: number) => ({
      ...item,
      id: `item-${Date.now()}-${idx}`,
    }));

    res.json({
      success: true,
      summary: parsed.summary || 'Ingredients recognized successfully.',
      detectedIngredients: detectedIngredientsWithIds,
    });
  } catch (err: any) {
    console.error('Error in /api/scan-ingredients:', err);
    res.status(500).json({
      error: 'Failed to recognize ingredients: ' + (err.message || 'Unknown error'),
      fallback: true,
    });
  }
});

/**
 * 2. RECOMMEND RECIPES BASED ON PANTRY & CALORIE TARGET
 */
app.post('/api/recommend-recipes', async (req: Request, res: Response) => {
  try {
    const {
      pantryIngredients = [],
      dietaryPreference = 'Balanced',
      calorieTarget = 500,
      mealType = 'Dinner',
      excludeAllergies = [],
    } = req.body;

    const ingredientsList = pantryIngredients.map((i: any) => (typeof i === 'string' ? i : i.name)).join(', ');

    if (!ai) {
      // High-quality fallback recipes
      return res.json({
        success: true,
        demo: true,
        recipes: [
          {
            id: 'rec-1',
            title: 'Garlic Lemon Pan-Seared Chicken & Spinach',
            description: 'Juicy tender chicken cutlets with wilted garlic spinach and lemon zest.',
            prepTimeMinutes: 10,
            cookTimeMinutes: 15,
            difficulty: 'Easy',
            servings: 2,
            caloriesPerServing: 340,
            macros: { protein: 38, carbs: 6, fat: 12, fiber: 3 },
            matchedIngredients: ['Chicken Breast', 'Garlic', 'Spinach'],
            missingIngredients: ['Olive Oil', 'Lemon Juice'],
            substitutions: [
              { original: 'Olive Oil', substitute: 'Any cooking oil or butter', reason: 'Pan lubrication' },
            ],
            instructions: [
              'Season chicken breast with salt, black pepper, and minced garlic.',
              'Heat 1 tsp oil in skillet over medium-high heat. Sear chicken 5-6 mins per side until golden.',
              'Add baby spinach directly to the pan with a splash of water and let wilt for 90 seconds.',
              'Drizzle fresh lemon juice over top and serve immediately.',
            ],
            healthPerks: ['High Lean Protein', 'Low Carbohydrate', 'Rich in Iron'],
            healthRisksOrNotes: 'Low sodium if seasoned moderately. Ideal for lean muscle building.',
          },
          {
            id: 'rec-2',
            title: 'Mediterranean Herb Omelet with Greek Yogurt Crema',
            description: 'Fluffy protein-packed eggs with garden greens and a creamy dollop of seasoned yogurt.',
            prepTimeMinutes: 5,
            cookTimeMinutes: 8,
            difficulty: 'Easy',
            servings: 1,
            caloriesPerServing: 280,
            macros: { protein: 22, carbs: 5, fat: 16, fiber: 2 },
            matchedIngredients: ['Eggs', 'Spinach', 'Greek Yogurt'],
            missingIngredients: ['Black Pepper', 'Oregano'],
            substitutions: [
              { original: 'Greek Yogurt', substitute: 'Cottage cheese or light cream cheese', reason: 'Adds creamy tang' },
            ],
            instructions: [
              'Whisk 2 whole eggs with salt and pepper in a small bowl.',
              'Sauté spinach in a non-stick pan for 1 minute until soft.',
              'Pour whisked eggs into the pan, swirling gently over medium-low heat.',
              'Fold into a crescent omelet. Top with 2 tablespoons of Greek yogurt seasoned with herbs.',
            ],
            healthPerks: ['Brain-healthy Choline', 'High Bioavailable Protein', 'Fast 10-Minute Meal'],
            healthRisksOrNotes: 'Naturally gluten-free and keto-friendly.',
          },
          {
            id: 'rec-3',
            title: 'Savory Chicken & Egg Fried Cauliflower Bowl',
            description: 'A comforting, hearty stir-fry bowl that cuts empty carbs and maximizes satiety.',
            prepTimeMinutes: 12,
            cookTimeMinutes: 12,
            difficulty: 'Medium',
            servings: 2,
            caloriesPerServing: 390,
            macros: { protein: 42, carbs: 12, fat: 14, fiber: 5 },
            matchedIngredients: ['Chicken Breast', 'Eggs', 'Garlic'],
            missingIngredients: ['Soy Sauce', 'Sesame Oil', 'Green Onion'],
            substitutions: [
              { original: 'Soy Sauce', substitute: 'Salt + pinch of vinegar', reason: 'Savory seasoning' },
            ],
            instructions: [
              'Dice chicken into bite-sized cubes. Stir fry with minced garlic in skillet until cooked through.',
              'Push chicken to the side, crack in eggs and scramble gently.',
              'Toss with greens and light soy sauce over high heat for 2 minutes.',
              'Garnish and serve piping hot.',
            ],
            healthPerks: ['High Satiety Index', 'Balanced Macros', 'Prevents Food Waste'],
            healthRisksOrNotes: 'Rich in dietary fiber and micronutrients.',
          },
        ],
      });
    }

    const promptText = `You are PlateUP's AI Recipe Recommendation Engine.
The user wants ${mealType} recipes prioritizing ingredients they already have at home to minimize food waste.
User's available pantry ingredients: [${ingredientsList || 'Chicken, Eggs, Rice, Garlic, Onions, Spinach'}].
Target calorie budget: approximately ${calorieTarget} kcal per serving.
Dietary preference: ${dietaryPreference}.
${excludeAllergies.length ? `Allergies / Exclusions: ${excludeAllergies.join(', ')}.` : ''}

Generate 3 diverse, practical, delicious recipes that maximize the use of the user's available ingredients.
For each recipe:
- State which available ingredients are matched
- Highlight missing ingredients clearly
- Suggest practical ingredient substitutions (e.g., using olive oil instead of butter, Greek yogurt instead of sour cream)
- Provide exact estimated calories per serving, macro breakdown (protein, carbs, fat, fiber in grams)
- Provide concise, numbered step-by-step instructions
- List health perks and any health warnings/considerations (e.g. sodium or cholesterol notes)

Output strict JSON.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  prepTimeMinutes: { type: Type.INTEGER },
                  cookTimeMinutes: { type: Type.INTEGER },
                  difficulty: { type: Type.STRING },
                  servings: { type: Type.INTEGER },
                  caloriesPerServing: { type: Type.INTEGER },
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                    },
                    required: ['protein', 'carbs', 'fat', 'fiber'],
                  },
                  matchedIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  missingIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  substitutions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        original: { type: Type.STRING },
                        substitute: { type: Type.STRING },
                        reason: { type: Type.STRING },
                      },
                      required: ['original', 'substitute', 'reason'],
                    },
                  },
                  instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  healthPerks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  healthRisksOrNotes: { type: Type.STRING },
                },
                required: [
                  'title',
                  'description',
                  'prepTimeMinutes',
                  'cookTimeMinutes',
                  'difficulty',
                  'servings',
                  'caloriesPerServing',
                  'macros',
                  'matchedIngredients',
                  'missingIngredients',
                  'instructions',
                  'healthPerks',
                ],
              },
            },
          },
          required: ['recipes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const recipesWithIds = (parsed.recipes || []).map((r: any, idx: number) => ({
      ...r,
      id: `rec-${Date.now()}-${idx}`,
    }));

    res.json({
      success: true,
      recipes: recipesWithIds,
    });
  } catch (err: any) {
    console.error('Error in /api/recommend-recipes:', err);
    res.status(500).json({ error: 'Failed to generate recipes: ' + err.message });
  }
});

/**
 * 3. AI CHATBOT (PlateUP AI Chatbot & Nutrition Assistant)
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages = [], currentPantry = [], todaySummary = {}, userGoal = 2000 } = req.body;

    const pantryNames = currentPantry.map((p: any) => (typeof p === 'string' ? p : p.name)).join(', ');

    const systemInstruction = `You are PlateUP's intelligent cooking and nutritional assistant (AI Chatbot).
PlateUP is a mobile system designed to help users track their meals, monitor calorie intake, reduce household food waste, and prepare delicious meals using existing kitchen ingredients.

User's current pantry contains: [${pantryNames || 'Eggs, Chicken, Garlic, Spinach, Rice, Olive Oil, Bread, Oats'}].
Today's calorie summary:
- Consumed: ${todaySummary.consumed || 0} kcal / Daily Goal: ${userGoal} kcal
- Remaining: ${Math.max(0, userGoal - (todaySummary.consumed || 0))} kcal
- Today's meals logged: ${todaySummary.mealCount || 0} meals.

Your capabilities:
1. Answer questions about recipe steps, cooking techniques, and timing.
2. Recommend smart ingredient substitutions when an ingredient is missing or to reduce calorie intake.
3. Calculate or estimate nutritional and calorie counts for any food or dish requested.
4. Give actionable health benefits and advise on balanced macronutrient distribution.
5. Offer encouragement and friendly, clear, concise culinary tips.

Format your responses cleanly with markdown bullet points or steps when useful. Keep replies focused, warm, and practical.`;

    if (!ai) {
      // No API key: say so honestly instead of pretending to be the AI.
      return res.json({
        offline: true,
        reply:
          "⚠️ AI Chatbot is offline because no GEMINI_API_KEY is set on the server.\n\nAdd your key to the .env file (see .env.example), restart with `npm run dev`, and I'll answer for real.",
      });
    }

    // Convert chat history for Gemini
    // Gemini expects the conversation to start with a user turn, so drop the
    // app's local welcome message (and any other leading assistant turns).
    const firstUserIdx = messages.findIndex((m: any) => m.role === 'user');
    const formattedContents = (firstUserIdx === -1 ? [] : messages.slice(firstUserIdx))
      .filter((m: any) => typeof m.content === 'string' && m.content.trim())
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    if (formattedContents.length === 0) {
      return res.status(400).json({ reply: 'Please send a message first.', error: 'No user message' });
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || "I'm here to help you cook and track your nutrition!",
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({
      reply: "I couldn't reach Gemini just now. Check your API key / model name in .env and try again.",
      error: err.message,
    });
  }
});

/**
 * 4. ANALYZE MEAL FOR CALORIE INTAKE TRACKER
 */
app.post('/api/analyze-meal', async (req: Request, res: Response) => {
  try {
    const { mealText, imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!mealText && !imageBase64) {
      return res.status(400).json({ error: 'Meal text description or image is required.' });
    }

    if (!ai) {
      return res.json({
        success: true,
        demo: true,
        meal: {
          name: mealText || 'Healthy Balanced Plate',
          portion: '1 standard serving',
          calories: 420,
          protein: 32,
          carbs: 45,
          fat: 12,
          fiber: 6,
          sodium: 380,
          mealType: 'Lunch',
          healthPerks: ['Rich in complex carbs & lean protein', 'High satiety factor'],
          dietaryTags: ['High Protein', 'Balanced'],
        },
      });
    }

    const cleanBase64 = imageBase64 ? imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '') : '';

    const promptText = `Analyze this food / meal for PlateUP calorie and nutrition tracking.
Meal description: "${mealText || 'Observed meal in the image'}".

Calculate estimated calories and macro nutrients accurately based on USDA food nutrition databases.
Output strict JSON with:
- "name": recognizable dish title
- "portion": estimated portion size (e.g. "200g", "1 medium bowl", "2 slices")
- "calories": integer total kcal
- "protein": number in grams
- "carbs": number in grams
- "fat": number in grams
- "fiber": number in grams
- "sodium": integer in mg
- "mealType": suggested meal slot from ["Breakfast", "Lunch", "Dinner", "Snack"]
- "healthPerks": array of short health benefit strings (e.g. "High in Potassium", "Supports Muscle Recovery")
- "dietaryTags": array from ["High Protein", "Low Carb", "Vegetarian", "Vegan", "Heart Healthy", "Gluten Free"]`;

    const contents: any[] = [];
    if (cleanBase64) {
      contents.push({
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          { text: promptText },
        ],
      });
    } else {
      contents.push(promptText);
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents[0],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            portion: { type: Type.STRING },
            calories: { type: Type.INTEGER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER },
            sodium: { type: Type.INTEGER },
            mealType: { type: Type.STRING },
            healthPerks: { type: Type.ARRAY, items: { type: Type.STRING } },
            dietaryTags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['name', 'portion', 'calories', 'protein', 'carbs', 'fat', 'mealType'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      meal: parsed,
    });
  } catch (err: any) {
    console.error('Error in /api/analyze-meal:', err);
    res.status(500).json({ error: 'Failed to analyze meal: ' + err.message });
  }
});

// Mount Vite or serve static dist in production
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PlateUP server running at http://0.0.0.0:${PORT}`);
});
