import React, { useState } from 'react';
import { Database, Code2, Terminal, Server, ShieldAlert, Play, CheckCircle2 } from 'lucide-react';
import { PantryItem, MealEntry, Recipe, UserProfile } from '../types';

interface AdminConsoleProps {
  pantryItems: PantryItem[];
  meals: MealEntry[];
  recipes: Recipe[];
  userProfile: UserProfile;
  onClose: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  pantryItems,
  meals,
  recipes,
  userProfile,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'php' | 'kotlin' | 'logs'>('sql');
  const [selectedTable, setSelectedTable] = useState<string>('pantry_ingredients');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM pantry_ingredients;');
  const [queryResultMsg, setQueryResultMsg] = useState<string>('');

  const runQuery = () => {
    setQueryResultMsg(`Query executed successfully at ${new Date().toLocaleTimeString()} (Returned ${
      selectedTable === 'pantry_ingredients'
        ? pantryItems.length
        : selectedTable === 'meal_history'
        ? meals.length
        : selectedTable === 'users'
        ? 1
        : recipes.length
    } rows)`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md font-sans">
      <div className="w-full max-w-4xl h-[92vh] rounded-3xl bg-neutral-900 border border-neutral-700 flex flex-col shadow-2xl overflow-hidden text-neutral-200">
        {/* Top Header */}
        <div className="p-4 bg-neutral-800 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Server size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">PlateUP Admin & Coder Console</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  RESTRICTED ACCESS
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Reference design for the thesis (Kotlin / PHP / MySQL). This web demo itself runs on React + Express + Gemini.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/60 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Database size={14} /> MySQL Database View
          </button>
          <button
            onClick={() => setActiveTab('php')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'php'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Server size={14} /> PHP Backend Code
          </button>
          <button
            onClick={() => setActiveTab('kotlin')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'kotlin'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 size={14} /> Kotlin Android Architecture
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'logs'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal size={14} /> API Request Logs
          </button>
        </div>

        {/* Tab 1: SQL Database View */}
        {activeTab === 'sql' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-300">Select Database Table:</span>
              {['pantry_ingredients', 'meal_history', 'users', 'recipe_catalog'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTable(t);
                    setSqlQuery(`SELECT * FROM ${t};`);
                    setQueryResultMsg('');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    selectedTable === t
                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* SQL Query Console */}
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span>mysql&gt; query execution</span>
                <button
                  onClick={runQuery}
                  className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Play size={11} fill="currentColor" /> Run SQL Query
                </button>
              </div>
              <input
                type="text"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full bg-transparent font-mono text-xs text-emerald-300 focus:outline-none"
              />
              {queryResultMsg && (
                <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 pt-1 border-t border-neutral-800">
                  <CheckCircle2 size={12} /> {queryResultMsg}
                </div>
              )}
            </div>

            {/* Live Table Content */}
            <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-950">
              <div className="p-2.5 bg-neutral-800 font-mono text-xs font-bold text-neutral-300 border-b border-neutral-800 flex justify-between">
                <span>Table: `{selectedTable}`</span>
                <span className="text-emerald-400 text-[11px]">
                  Engine: InnoDB • Collation: utf8mb4_unicode_ci
                </span>
              </div>

              {selectedTable === 'pantry_ingredients' && (
                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 text-[11px]">
                      <tr>
                        <th className="p-2">id (VARCHAR)</th>
                        <th className="p-2">ingredient_name (VARCHAR)</th>
                        <th className="p-2">category (ENUM)</th>
                        <th className="p-2">quantity (VARCHAR)</th>
                        <th className="p-2">est_calories (INT)</th>
                        <th className="p-2">created_at (DATE)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-neutral-300">
                      {pantryItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-neutral-500">
                            Table is currently empty (0 rows). Waiting for user camera scan.
                          </td>
                        </tr>
                      ) : (
                        pantryItems.map((item) => (
                          <tr key={item.id} className="hover:bg-neutral-900/50">
                            <td className="p-2 text-neutral-400">{item.id}</td>
                            <td className="p-2 font-bold text-white">{item.name}</td>
                            <td className="p-2 text-emerald-400">{item.category}</td>
                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2 text-amber-400">{item.estimatedCalories || 50}</td>
                            <td className="p-2 text-neutral-500">{item.addedDate}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTable === 'meal_history' && (
                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 text-[11px]">
                      <tr>
                        <th className="p-2">meal_id</th>
                        <th className="p-2">user_id</th>
                        <th className="p-2">recipe_title</th>
                        <th className="p-2">calories (INT)</th>
                        <th className="p-2">protein (FLOAT)</th>
                        <th className="p-2">date_logged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-neutral-300">
                      {meals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-neutral-500">
                            Table is currently empty (0 rows). 0 calories recorded today.
                          </td>
                        </tr>
                      ) : (
                        meals.map((m) => (
                          <tr key={m.id} className="hover:bg-neutral-900/50">
                            <td className="p-2 text-neutral-400">{m.id}</td>
                            <td className="p-2">usr_101</td>
                            <td className="p-2 font-bold text-white">{m.name}</td>
                            <td className="p-2 text-emerald-400">{m.calories}</td>
                            <td className="p-2">{m.protein}g</td>
                            <td className="p-2 text-neutral-500">{m.date} {m.time}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTable === 'users' && (
                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 text-[11px]">
                      <tr>
                        <th className="p-2">id</th>
                        <th className="p-2">username</th>
                        <th className="p-2">role</th>
                        <th className="p-2">daily_calorie_target</th>
                        <th className="p-2">status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-neutral-300">
                      <tr>
                        <td className="p-2">1</td>
                        <td className="p-2 font-bold text-white">{userProfile.name}</td>
                        <td className="p-2 text-sky-400">ROLE_STUDENT_USER</td>
                        <td className="p-2 font-mono text-emerald-400">{userProfile.dailyCalorieGoal} kcal</td>
                        <td className="p-2 text-emerald-400">ACTIVE</td>
                      </tr>
                      <tr>
                        <td className="p-2">2</td>
                        <td className="p-2 font-bold text-amber-400">PlateUP Admin (Coder)</td>
                        <td className="p-2 text-amber-400">ROLE_ADMIN</td>
                        <td className="p-2 font-mono text-neutral-400">N/A</td>
                        <td className="p-2 text-emerald-400">ACTIVE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTable === 'recipe_catalog' && (
                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 text-[11px]">
                      <tr>
                        <th className="p-2">id</th>
                        <th className="p-2">recipe_name</th>
                        <th className="p-2">calories_per_serving</th>
                        <th className="p-2">prep_time</th>
                        <th className="p-2">algorithm_status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-neutral-300">
                      {recipes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-neutral-500">
                            0 recipes generated. Algorithm executes once user scans ingredients.
                          </td>
                        </tr>
                      ) : (
                        recipes.map((r) => (
                          <tr key={r.id} className="hover:bg-neutral-900/50">
                            <td className="p-2 text-neutral-400">{r.id}</td>
                            <td className="p-2 font-bold text-white">{r.title}</td>
                            <td className="p-2 text-emerald-400">{r.caloriesPerServing} kcal</td>
                            <td className="p-2">{r.prepTimeMinutes + r.cookTimeMinutes}m</td>
                            <td className="p-2 text-teal-400">MATCHED</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: PHP Backend Code */}
        {activeTab === 'php' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-emerald-400 font-bold">backend/api/scan_ingredients.php (PHP 8.2 + PDO MySQL)</span>
              <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded">REST API Endpoint</span>
            </div>
            <pre className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-300 overflow-x-auto text-[11px] leading-relaxed">
{`<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Origin: *");

require_once '../config/database.php';
require_once '../models/Ingredient.php';

// Verify authentication token
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->image_base64)) {
    // 1. Process image using computer vision / AI endpoint
    $recognized = processIngredientVision($data->image_base64);
    
    // 2. Query MySQL calorie lookup index
    $query = "SELECT standard_name, category, default_calories 
              FROM ingredient_nutrition_index 
              WHERE standard_name IN (" . implode(',', array_fill(0, count($recognized), '?')) . ")";
              
    $stmt = $db->prepare($query);
    $stmt->execute($recognized);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "detected_items" => $results,
        "algorithm_ready" => true
    ]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No image provided"]);
}
?>`}
            </pre>
          </div>
        )}

        {/* Tab 3: Kotlin Architecture Code */}
        {activeTab === 'kotlin' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-emerald-400 font-bold">app/src/main/java/com/plateup/camera/CameraScanActivity.kt</span>
              <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded">Kotlin Jetpack Compose</span>
            </div>
            <pre className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-300 overflow-x-auto text-[11px] leading-relaxed">
{`package com.plateup.camera

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.plateup.viewmodel.PlateUpViewModel

class CameraScanActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val viewModel: PlateUpViewModel = viewModel()
            IngredientScannerScreen(
                onCaptureImage = { bitmap ->
                    viewModel.scanIngredientsWithPHPBackend(bitmap) { detected ->
                        // Review & verify ingredients checklist
                        viewModel.setRecognizedIngredients(detected)
                    }
                },
                onOpenAssistant = {
                    // Open AI Cooking Chatbot
                }
            )
        }
    }
}`}
            </pre>
          </div>
        )}

        {/* Tab 4: Logs */}
        {activeTab === 'logs' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-xs">
            <div className="text-[11px] text-neutral-400">Real-time PHP API & SQL transaction log stream:</div>
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1 text-[11px]">
              <div className="text-neutral-500">[2026-10-09 22:50:11] [INIT] Android Emulator started (Pixel 8 API 34).</div>
              <div className="text-neutral-500">[2026-10-09 22:50:12] [MYSQL] Connected to plateup_db via PDO socket.</div>
              <div className="text-emerald-400">[2026-10-09 22:50:15] [AUTH] Student User session verified. Role: USER.</div>
              <div className="text-neutral-400">[2026-10-09 22:51:00] [STATE] Initial state empty: 0 items in pantry, 0 logged calories.</div>
              {pantryItems.length > 0 && (
                <div className="text-teal-400">
                  [2026-10-09 22:52:10] [SCAN_API] Detected {pantryItems.length} ingredients. Stored in pantry_ingredients table.
                </div>
              )}
              {meals.length > 0 && (
                <div className="text-amber-400">
                  [2026-10-09 22:53:20] [CALORIE_LOG] Logged meal record. Total calories updated.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
