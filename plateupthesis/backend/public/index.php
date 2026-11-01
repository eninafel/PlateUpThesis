<?php
declare(strict_types=1);

/**
 * PlateUP REST API: single entry point.
 * Run locally:  php -S 0.0.0.0:8000 -t public public/index.php
 */

require __DIR__ . '/../src/Env.php';
require __DIR__ . '/../src/Http.php';
require __DIR__ . '/../src/Db.php';
require __DIR__ . '/../src/Auth.php';
require __DIR__ . '/../src/Gemini.php';
require __DIR__ . '/../src/Handlers.php';

use PlateUp\ApiException;
use PlateUp\Env;
use PlateUp\Handlers;
use PlateUp\Request;
use PlateUp\Response;

Env::load(__DIR__ . '/../.env');
date_default_timezone_set(Env::get('APP_TIMEZONE', 'Asia/Manila'));

// Never print PHP errors into the JSON the phone reads; they go to the server log instead.
ini_set('display_errors', '0');

if (Request::method() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// [HTTP method, path pattern, handler]. {id} matches a number.
$routes = [
    ['GET',    '/api/health',          fn() => Handlers::health()],
    ['POST',   '/api/auth/register',   fn() => Handlers::register()],
    ['POST',   '/api/auth/login',      fn() => Handlers::login()],

    ['GET',    '/api/profile',         fn() => Handlers::getProfile()],
    ['PUT',    '/api/profile',         fn() => Handlers::updateProfile()],

    ['GET',    '/api/pantry',          fn() => Handlers::listPantry()],
    ['POST',   '/api/pantry',          fn() => Handlers::addPantry()],
    ['DELETE', '/api/pantry/{id}',     fn(int $id) => Handlers::deletePantry($id)],

    ['GET',    '/api/meals',           fn() => Handlers::listMeals()],
    ['POST',   '/api/meals',           fn() => Handlers::addMeal()],
    ['DELETE', '/api/meals/{id}',      fn(int $id) => Handlers::deleteMeal($id)],

    ['GET',    '/api/chat/history',    fn() => Handlers::chatHistory()],
    ['DELETE', '/api/chat/history',    fn() => Handlers::clearChat()],
    ['POST',   '/api/chat',            fn() => Handlers::chat()],

    ['POST',   '/api/scan',            fn() => Handlers::scan()],
    ['POST',   '/api/recipes/recommend', fn() => Handlers::recommendRecipes()],
];

try {
    $method = Request::method();
    $path   = Request::path();
    $pathMatched = false;

    foreach ($routes as [$routeMethod, $pattern, $handler]) {
        $regex = '#^' . str_replace('{id}', '(\d+)', $pattern) . '$#';
        if (preg_match($regex, $path, $m)) {
            $pathMatched = true;
            if ($routeMethod === $method) {
                $handler(...array_map('intval', array_slice($m, 1)));
            }
        }
    }

    throw $pathMatched ? new ApiException(405, 'Method not allowed.') : new ApiException(404, 'Not found.');
} catch (ApiException $e) {
    Response::error($e->status, $e->getMessage());
} catch (Throwable $e) {
    error_log('PlateUP error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    Response::error(500, 'Something went wrong on the server.');
}
