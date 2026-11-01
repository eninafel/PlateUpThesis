<?php
declare(strict_types=1);

namespace PlateUp;

/** An error that should be shown to the app with a specific HTTP status. */
final class ApiException extends \RuntimeException
{
    public function __construct(public readonly int $status, string $message)
    {
        parent::__construct($message);
    }
}

final class Request
{
    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function path(): string
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        return $path === '/' ? '/' : rtrim($path, '/');
    }

    /** Decoded JSON body as an array (empty array when there is no body). */
    public static function json(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new ApiException(400, 'Request body must be valid JSON.');
        }
        return $data;
    }

    public static function query(string $key, ?string $default = null): ?string
    {
        $value = $_GET[$key] ?? $default;
        return is_string($value) ? $value : $default;
    }

    public static function bearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if ($header === '' && function_exists('getallheaders')) {
            foreach (getallheaders() as $name => $value) {
                if (strtolower($name) === 'authorization') {
                    $header = $value;
                }
            }
        }
        if (preg_match('/^Bearer\s+([A-Fa-f0-9]{64})$/', $header, $m)) {
            return $m[1];
        }
        return null;
    }
}

final class Response
{
    public static function json(array $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }

    public static function error(int $status, string $message): never
    {
        self::json(['error' => $message], $status);
    }
}

/** Small input checks so every endpoint validates the same way. */
final class Validate
{
    public static function text(array $in, string $key, int $max, bool $required = true, string $default = ''): string
    {
        $value = $in[$key] ?? null;
        if ($value === null || $value === '') {
            if ($required) {
                throw new ApiException(422, "'$key' is required.");
            }
            return $default;
        }
        if (!is_string($value)) {
            throw new ApiException(422, "'$key' must be text.");
        }
        $value = trim($value);
        if ($required && $value === '') {
            throw new ApiException(422, "'$key' is required.");
        }
        if (mb_strlen($value) > $max) {
            throw new ApiException(422, "'$key' must be at most $max characters.");
        }
        return $value;
    }

    public static function number(array $in, string $key, float $min, float $max, bool $required = true, ?float $default = null): ?float
    {
        $value = $in[$key] ?? null;
        if ($value === null || $value === '') {
            if ($required) {
                throw new ApiException(422, "'$key' is required.");
            }
            return $default;
        }
        if (!is_numeric($value)) {
            throw new ApiException(422, "'$key' must be a number.");
        }
        $value = (float) $value;
        if ($value < $min || $value > $max) {
            throw new ApiException(422, "'$key' must be between $min and $max.");
        }
        return $value;
    }

    public static function oneOf(array $in, string $key, array $allowed, string $default): string
    {
        $value = $in[$key] ?? $default;
        if (!is_string($value) || !in_array($value, $allowed, true)) {
            throw new ApiException(422, "'$key' must be one of: " . implode(', ', $allowed) . '.');
        }
        return $value;
    }

    public static function date(?string $value, string $key = 'date'): string
    {
        $d = $value === null ? false : \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        if (!$d || $d->format('Y-m-d') !== $value) {
            throw new ApiException(422, "'$key' must look like YYYY-MM-DD.");
        }
        return $value;
    }
}
