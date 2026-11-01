<?php
declare(strict_types=1);

namespace PlateUp;

use DateTimeImmutable;

/** One static method per API endpoint. Each one starts by identifying the logged-in user. */
final class Handlers
{
    private const CATEGORIES = [
        'Produce', 'Proteins', 'Dairy & Eggs', 'Grains & Bakery',
        'Spices & Condiments', 'Canned & Pantry', 'Beverages', 'Snacks',
    ];
    private const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

    private static function today(): string
    {
        return (new DateTimeImmutable('today'))->format('Y-m-d');
    }

    /** Stops one account from making unlimited (billed) AI calls. Limit comes from AI_DAILY_LIMIT in .env. */
    private static function aiGuard(int $userId): void
    {
        $limit = max(1, (int) Env::get('AI_DAILY_LIMIT', '60'));
        $db    = Db::pdo();
        $day   = self::today();

        $db->prepare('INSERT INTO ai_usage (user_id, day, calls) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE calls = calls + 1')
           ->execute([$userId, $day]);
        $stmt = $db->prepare('SELECT calls FROM ai_usage WHERE user_id = ? AND day = ?');
        $stmt->execute([$userId, $day]);
        if ((int) $stmt->fetchColumn() > $limit) {
            throw new ApiException(429, "You've reached today's limit of $limit AI requests. Try again tomorrow.");
        }
    }

    // ---------- health / auth ----------

    public static function health(): never
    {
        Response::json([
            'ok'           => true,
            'ai_connected' => Env::get('GEMINI_API_KEY') !== '',
            'model'        => Env::get('GEMINI_MODEL', 'gemini-3.8-flash'),
        ]);
    }

    public static function register(): never
    {
        Response::json(Auth::register(Request::json()), 201);
    }

    public static function login(): never
    {
        Response::json(Auth::login(Request::json()));
    }

    // ---------- profile ----------

    public static function getProfile(): never
    {
        Response::json(['user' => Auth::publicUser(Auth::requireUser())]);
    }

    public static function updateProfile(): never
    {
        $user = Auth::requireUser();
        $in   = Request::json();

        $name = array_key_exists('name', $in) ? Validate::text($in, 'name', 100) : $user['name'];
        $goal = array_key_exists('daily_calorie_goal', $in)
            ? (int) Validate::number($in, 'daily_calorie_goal', 500, 10000)
            : (int) $user['daily_calorie_goal'];
        $diet = array_key_exists('dietary_preference', $in)
            ? Validate::text($in, 'dietary_preference', 50)
            : $user['dietary_preference'];
        $allergies = array_key_exists('allergies', $in)
            ? Validate::text($in, 'allergies', 255, false)
            : $user['allergies'];

        Db::pdo()->prepare('UPDATE users SET name = ?, daily_calorie_goal = ?, dietary_preference = ?, allergies = ? WHERE id = ?')
            ->execute([$name, $goal, $diet, $allergies, $user['id']]);

        $user = array_merge($user, [
            'name' => $name, 'daily_calorie_goal' => $goal,
            'dietary_preference' => $diet, 'allergies' => $allergies,
        ]);
        Response::json(['user' => Auth::publicUser($user)]);
    }

    // ---------- pantry ----------

    public static function listPantry(): never
    {
        $user = Auth::requireUser();
        $stmt = Db::pdo()->prepare(
            'SELECT id, name, category, quantity, estimated_calories, expiry_date
               FROM pantry_items WHERE user_id = ?
              ORDER BY expiry_date IS NULL, expiry_date ASC, id DESC'
        );
        $stmt->execute([$user['id']]);

        $today = new DateTimeImmutable('today');
        $items = array_map(static function (array $r) use ($today): array {
            $daysLeft = null;
            if ($r['expiry_date'] !== null) {
                $daysLeft = (int) $today->diff(new DateTimeImmutable($r['expiry_date']))->format('%r%a');
            }
            return [
                'id'                 => (int) $r['id'],
                'name'               => $r['name'],
                'category'           => $r['category'],
                'quantity'           => $r['quantity'],
                'estimated_calories' => $r['estimated_calories'] === null ? null : (int) $r['estimated_calories'],
                'expiry_date'        => $r['expiry_date'],
                'days_left'          => $daysLeft,
            ];
        }, $stmt->fetchAll());

        Response::json(['items' => $items]);
    }

    public static function addPantry(): never
    {
        $user = Auth::requireUser();
        $in   = Request::json();

        $name     = Validate::text($in, 'name', 120);
        $category = Validate::oneOf($in, 'category', self::CATEGORIES, 'Produce');
        $quantity = Validate::text($in, 'quantity', 50, false, '1 item');
        $calories = Validate::number($in, 'estimated_calories', 0, 5000, false);
        $days     = Validate::number($in, 'expiry_days', 0, 365, false);
        $expiry   = $days === null ? null : (new DateTimeImmutable('today'))->modify('+' . (int) $days . ' days')->format('Y-m-d');

        $db = Db::pdo();
        $db->prepare('INSERT INTO pantry_items (user_id, name, category, quantity, estimated_calories, expiry_date) VALUES (?, ?, ?, ?, ?, ?)')
           ->execute([$user['id'], $name, $category, $quantity, $calories === null ? null : (int) $calories, $expiry]);

        Response::json(['ok' => true, 'id' => (int) $db->lastInsertId()], 201);
    }

    public static function deletePantry(int $id): never
    {
        $user = Auth::requireUser();
        $stmt = Db::pdo()->prepare('DELETE FROM pantry_items WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
        if ($stmt->rowCount() === 0) {
            throw new ApiException(404, 'Pantry item not found.');
        }
        Response::json(['ok' => true]);
    }

    // ---------- meals ----------

    public static function listMeals(): never
    {
        $user = Auth::requireUser();
        $date = Validate::date(Request::query('date', self::today()));

        $stmt = Db::pdo()->prepare(
            'SELECT id, name, meal_type, calories, protein_g, carbs_g, fat_g, eaten_on
               FROM meals WHERE user_id = ? AND eaten_on = ? ORDER BY id DESC'
        );
        $stmt->execute([$user['id'], $date]);

        $total = 0;
        $items = array_map(static function (array $r) use (&$total): array {
            $total += (int) $r['calories'];
            return [
                'id'        => (int) $r['id'],
                'name'      => $r['name'],
                'meal_type' => $r['meal_type'],
                'calories'  => (int) $r['calories'],
                'protein_g' => (float) $r['protein_g'],
                'carbs_g'   => (float) $r['carbs_g'],
                'fat_g'     => (float) $r['fat_g'],
                'eaten_on'  => $r['eaten_on'],
            ];
        }, $stmt->fetchAll());

        Response::json([
            'items'          => $items,
            'total_calories' => $total,
            'goal'           => (int) $user['daily_calorie_goal'],
            'date'           => $date,
        ]);
    }

    public static function addMeal(): never
    {
        $user = Auth::requireUser();
        $in   = Request::json();

        $name     = Validate::text($in, 'name', 160);
        $type     = Validate::oneOf($in, 'meal_type', self::MEAL_TYPES, 'Dinner');
        $calories = (int) Validate::number($in, 'calories', 0, 10000);
        $protein  = Validate::number($in, 'protein_g', 0, 1000, false, 0.0);
        $carbs    = Validate::number($in, 'carbs_g', 0, 1000, false, 0.0);
        $fat      = Validate::number($in, 'fat_g', 0, 1000, false, 0.0);
        $date     = Validate::date(isset($in['eaten_on']) && is_string($in['eaten_on']) ? $in['eaten_on'] : self::today(), 'eaten_on');

        $db = Db::pdo();
        $db->prepare('INSERT INTO meals (user_id, name, meal_type, calories, protein_g, carbs_g, fat_g, eaten_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
           ->execute([$user['id'], $name, $type, $calories, $protein, $carbs, $fat, $date]);

        Response::json(['ok' => true, 'id' => (int) $db->lastInsertId()], 201);
    }

    public static function deleteMeal(int $id): never
    {
        $user = Auth::requireUser();
        $stmt = Db::pdo()->prepare('DELETE FROM meals WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
        if ($stmt->rowCount() === 0) {
            throw new ApiException(404, 'Meal not found.');
        }
        Response::json(['ok' => true]);
    }

    // ---------- AI Chatbot ----------

    public static function chatHistory(): never
    {
        $user = Auth::requireUser();
        Response::json(['items' => self::recentMessages((int) $user['id'], 50)]);
    }

    public static function clearChat(): never
    {
        $user = Auth::requireUser();
        Db::pdo()->prepare('DELETE FROM chat_messages WHERE user_id = ?')->execute([$user['id']]);
        Response::json(['ok' => true]);
    }

    public static function chat(): never
    {
        $user    = Auth::requireUser();
        $message = Validate::text(Request::json(), 'message', 2000);
        $db      = Db::pdo();
        self::aiGuard((int) $user['id']);

        // Context the AI Chatbot should know about this user.
        $pantry = $db->prepare('SELECT name FROM pantry_items WHERE user_id = ? ORDER BY id DESC LIMIT 40');
        $pantry->execute([$user['id']]);
        $pantryNames = implode(', ', array_column($pantry->fetchAll(), 'name')) ?: 'nothing recorded yet';

        $eaten = $db->prepare('SELECT COALESCE(SUM(calories), 0) AS kcal FROM meals WHERE user_id = ? AND eaten_on = ?');
        $eaten->execute([$user['id'], self::today()]);
        $kcal = (int) $eaten->fetch()['kcal'];
        $goal = (int) $user['daily_calorie_goal'];

        $system = "You are the AI Chatbot inside PlateUP, a recipe finder and meal planner app.\n"
            . "Help with cooking steps, ingredient substitutions, calorie estimates and reducing food waste.\n"
            . "The user's pantry: {$pantryNames}.\n"
            . "Diet preference: {$user['dietary_preference']}. Allergies: " . ($user['allergies'] !== '' ? $user['allergies'] : 'none') . ".\n"
            . "Calories eaten today: {$kcal} of a {$goal} kcal goal.\n"
            . "Calorie numbers are estimates, so say so. Never give medical advice. Keep answers short, warm and practical.";

        // Conversation so far, then the new message. Gemini wants the first turn to be from the user.
        $contents = [];
        foreach (self::recentMessages((int) $user['id'], 20) as $m) {
            $contents[] = ['role' => $m['role'] === 'assistant' ? 'model' : 'user', 'parts' => [['text' => $m['content']]]];
        }
        while ($contents !== [] && $contents[0]['role'] !== 'user') {
            array_shift($contents);
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

        $reply = trim(Gemini::generate($contents, $system));

        $save = $db->prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)');
        $save->execute([$user['id'], 'user', $message]);
        $save->execute([$user['id'], 'assistant', $reply]);

        Response::json(['reply' => $reply]);
    }

    /** @return array<int, array{role: string, content: string}> oldest first */
    private static function recentMessages(int $userId, int $limit): array
    {
        $stmt = Db::pdo()->prepare(
            'SELECT role, content FROM (
                 SELECT id, role, content FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ' . (int) $limit . '
             ) recent ORDER BY id ASC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    // ---------- recipes ----------

    public static function recommendRecipes(): never
    {
        $user = Auth::requireUser();
        $in   = Request::json();
        $target = (int) Validate::number($in, 'calorie_target', 100, 2000, false, 500.0);

        // Use the ingredients sent by the app (for example from a photo scan), otherwise the saved pantry.
        $names = [];
        if (isset($in['ingredients']) && is_array($in['ingredients'])) {
            foreach (array_slice($in['ingredients'], 0, 30) as $n) {
                if (is_string($n) && trim($n) !== '') {
                    $names[] = mb_substr(trim($n), 0, 120);
                }
            }
        }
        if ($names === []) {
            $stmt = Db::pdo()->prepare('SELECT name FROM pantry_items WHERE user_id = ? ORDER BY expiry_date IS NULL, expiry_date ASC LIMIT 40');
            $stmt->execute([$user['id']]);
            $names = array_column($stmt->fetchAll(), 'name');
        }
        if ($names === []) {
            throw new ApiException(400, 'Scan or add some ingredients first.');
        }
        self::aiGuard((int) $user['id']);

        $system = 'You are the recipe engine of PlateUP. Reply with JSON only.';
        $prompt = 'Ingredients at home (soonest to expire first): ' . implode(', ', $names) . ".\n"
            . "Diet: {$user['dietary_preference']}. Allergies to avoid: " . ($user['allergies'] !== '' ? $user['allergies'] : 'none') . ".\n"
            . "Target about {$target} kcal per serving.\n"
            . "Suggest 3 practical recipes that use as many of these ingredients as possible.\n"
            . 'Return exactly: {"recipes":[{"title":"","description":"","prep_time_minutes":0,"cook_time_minutes":0,'
            . '"difficulty":"Easy","servings":1,"calories_per_serving":0,"matched_ingredients":[""],'
            . '"missing_ingredients":[""],"instructions":[""]}]}';

        $text = Gemini::generate([['role' => 'user', 'parts' => [['text' => $prompt]]]], $system, true, 0.6);
        $text = trim(preg_replace('/^```(?:json)?|```$/m', '', trim($text)) ?? '');
        $data = json_decode($text, true);
        if (!is_array($data) || !isset($data['recipes']) || !is_array($data['recipes'])) {
            throw new ApiException(502, 'The AI returned recipes in an unexpected format. Please try again.');
        }

        $recipes = [];
        foreach (array_slice($data['recipes'], 0, 5) as $r) {
            if (!is_array($r) || empty($r['title'])) {
                continue;
            }
            $recipes[] = [
                'title'                => (string) $r['title'],
                'description'          => (string) ($r['description'] ?? ''),
                'prep_time_minutes'    => (int) ($r['prep_time_minutes'] ?? 0),
                'cook_time_minutes'    => (int) ($r['cook_time_minutes'] ?? 0),
                'difficulty'           => (string) ($r['difficulty'] ?? 'Easy'),
                'servings'             => max(1, (int) ($r['servings'] ?? 1)),
                'calories_per_serving' => (int) ($r['calories_per_serving'] ?? 0),
                'matched_ingredients'  => array_values(array_map('strval', (array) ($r['matched_ingredients'] ?? []))),
                'missing_ingredients'  => array_values(array_map('strval', (array) ($r['missing_ingredients'] ?? []))),
                'instructions'         => array_values(array_map('strval', (array) ($r['instructions'] ?? []))),
            ];
        }
        Response::json(['recipes' => $recipes]);
    }

    // ---------- photo scan ----------

    public static function scan(): never
    {
        $user = Auth::requireUser();
        $in   = Request::json();

        $b64 = $in['image_base64'] ?? null;
        if (!is_string($b64) || $b64 === '') {
            throw new ApiException(422, "'image_base64' is required.");
        }
        $b64 = preg_replace('#^data:image/[a-z+.-]+;base64,#i', '', trim($b64)) ?? '';
        if (strlen($b64) > 7_000_000) {
            throw new ApiException(413, 'That photo is too large. Try a smaller one.');
        }
        $bytes = base64_decode($b64, true);
        $info  = $bytes === false ? false : @getimagesizefromstring($bytes);
        if ($bytes === false || $info === false) {
            throw new ApiException(422, 'That file is not a valid photo.');
        }
        $mime = $info['mime'] ?? '';
        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            throw new ApiException(422, 'Use a JPEG, PNG or WebP photo.');
        }
        self::aiGuard((int) $user['id']);

        $categories = implode(', ', self::CATEGORIES);
        $system = 'You are the food recognition engine of PlateUP. Reply with JSON only. '
            . 'List only food and drink you can actually see. Never guess items that are hidden. '
            . 'Calories are rough estimates. Health notes are general nutrition facts, not medical advice.';
        $prompt = "Look at this photo.\n"
            . "The user's diet: {$user['dietary_preference']}. Allergies: " . ($user['allergies'] !== '' ? $user['allergies'] : 'none') . ".\n"
            . "For each distinct food or ingredient return: name, category (one of: {$categories}), "
            . "quantity (the amount visible, e.g. \"3 pieces\"), estimated_calories (integer kcal for the amount shown), "
            . "calories_basis (short, e.g. \"for the amount shown\"), health_benefits (2 to 3 short strings), "
            . "health_concerns (0 to 3 short strings, such as high sodium, sugar or saturated fat, or a warning if it matches the user's allergies), "
            . "storage_tip (one short sentence) and expiry_days (typical days it stays fresh when stored well, integer or null).\n"
            . "Also return summary (one sentence) and dishes: up to 3 dishes the user can cook that are built from the ingredients you listed, "
            . "best match first. Each dish has: title, why (one short sentence), estimated_calories (per serving), prep_time_minutes, "
            . "uses (names copied exactly from your ingredients list; use as many of them as makes sense), "
            . "extra_needed (0 to 4 common items that are NOT in the photo, such as oil or salt), "
            . "health_note (one short sentence) and steps (3 to 5 short steps). "
            . "Never suggest a dish that contains the user's allergens.\n"
            . 'If no food is visible, return an empty ingredients list and an empty dishes list and say so in the summary.' . "\n"
            . 'Return exactly: {"summary":"","ingredients":[{"name":"","category":"","quantity":"","estimated_calories":0,'
            . '"calories_basis":"","health_benefits":[""],"health_concerns":[""],"storage_tip":"","expiry_days":0}],'
            . '"dishes":[{"title":"","why":"","estimated_calories":0,"prep_time_minutes":0,"uses":[""],"extra_needed":[""],'
            . '"health_note":"","steps":[""]}]}';

        $contents = [[
            'role'  => 'user',
            'parts' => [
                ['text' => $prompt],
                ['inlineData' => ['mimeType' => $mime, 'data' => base64_encode($bytes)]],
            ],
        ]];

        $text = Gemini::generate($contents, $system, true, 0.3);
        $text = trim(preg_replace('/^```(?:json)?|```$/m', '', trim($text)) ?? '');
        $data = json_decode($text, true);
        if (!is_array($data)) {
            throw new ApiException(502, 'The AI returned a result in an unexpected format. Please try again.');
        }

        $strings = static fn($v, int $max): array => array_slice(
            array_values(array_filter(array_map(static fn($x) => mb_substr(trim((string) $x), 0, 160), is_array($v) ? $v : []))),
            0,
            $max
        );

        $ingredients = [];
        $total = 0;
        foreach (array_slice((array) ($data['ingredients'] ?? []), 0, 20) as $i) {
            if (!is_array($i) || trim((string) ($i['name'] ?? '')) === '') {
                continue;
            }
            $kcal = max(0, min(5000, (int) ($i['estimated_calories'] ?? 0)));
            $days = isset($i['expiry_days']) && is_numeric($i['expiry_days']) ? max(0, min(365, (int) $i['expiry_days'])) : null;
            $cat  = in_array($i['category'] ?? '', self::CATEGORIES, true) ? $i['category'] : 'Produce';
            $total += $kcal;
            $ingredients[] = [
                'name'               => mb_substr(trim((string) $i['name']), 0, 120),
                'category'           => $cat,
                'quantity'           => mb_substr(trim((string) ($i['quantity'] ?? '1 item')) ?: '1 item', 0, 50),
                'estimated_calories' => $kcal,
                'calories_basis'     => mb_substr(trim((string) ($i['calories_basis'] ?? 'for the amount shown')), 0, 80),
                'health_benefits'    => $strings($i['health_benefits'] ?? [], 3),
                'health_concerns'    => $strings($i['health_concerns'] ?? [], 3),
                'storage_tip'        => mb_substr(trim((string) ($i['storage_tip'] ?? '')), 0, 200),
                'expiry_days'        => $days,
            ];
        }

        // Keep only dishes that really use ingredients from the photo, drop any that mention an allergen,
        // and rank them by how much of the photo they use. The model's own claims are checked here.
        $scannedNames = array_map(static fn(array $i): string => mb_strtolower($i['name']), $ingredients);
        $allergens = array_values(array_filter(array_map(
            static fn(string $a): string => mb_strtolower(trim($a)),
            explode(',', (string) $user['allergies'])
        )));

        $dishes = [];
        foreach (array_slice((array) ($data['dishes'] ?? []), 0, 5) as $d) {
            if (!is_array($d) || trim((string) ($d['title'] ?? '')) === '') {
                continue;
            }
            $uses = [];
            foreach ($strings($d['uses'] ?? [], 20) as $u) {
                $pos = array_search(mb_strtolower($u), $scannedNames, true);
                if ($pos !== false && !in_array($ingredients[$pos]['name'], $uses, true)) {
                    $uses[] = $ingredients[$pos]['name'];
                }
            }
            if ($uses === []) {
                continue;
            }
            $extra = $strings($d['extra_needed'] ?? [], 4);
            $title = mb_substr(trim((string) $d['title']), 0, 120);

            $haystack = mb_strtolower($title . ' ' . implode(' ', $uses) . ' ' . implode(' ', $extra));
            foreach ($allergens as $allergen) {
                if ($allergen !== '' && str_contains($haystack, $allergen)) {
                    continue 2;
                }
            }

            $dishes[] = [
                'title'              => $title,
                'why'                => mb_substr(trim((string) ($d['why'] ?? '')), 0, 200),
                'estimated_calories' => max(0, min(5000, (int) ($d['estimated_calories'] ?? 0))),
                'prep_time_minutes'  => max(0, min(600, (int) ($d['prep_time_minutes'] ?? 0))),
                'uses'               => $uses,
                'extra_needed'       => $extra,
                'health_note'        => mb_substr(trim((string) ($d['health_note'] ?? '')), 0, 200),
                'steps'              => $strings($d['steps'] ?? [], 6),
                'match_percent'      => (int) round(100 * count($uses) / max(1, count($ingredients))),
            ];
        }
        usort($dishes, static fn(array $x, array $y): int =>
            [$y['match_percent'], count($x['extra_needed'])] <=> [$x['match_percent'], count($y['extra_needed'])]);

        Response::json([
            'summary'        => mb_substr(trim((string) ($data['summary'] ?? '')), 0, 300),
            'ingredients'    => $ingredients,
            'total_calories' => $total, // recomputed here from the items; the model's own total is ignored
            'dishes'         => $dishes,
        ]);
    }
}
