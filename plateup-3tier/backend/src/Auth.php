<?php
declare(strict_types=1);

namespace PlateUp;

final class Auth
{
    private const TOKEN_DAYS = 30;

    public static function register(array $in): array
    {
        $name  = Validate::text($in, 'name', 100);
        $email = strtolower(Validate::text($in, 'email', 190));
        $pass  = Validate::text($in, 'password', 200);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ApiException(422, 'Please enter a valid email address.');
        }
        if (mb_strlen($pass) < 8) {
            throw new ApiException(422, 'Password must be at least 8 characters.');
        }

        $db = Db::pdo();
        $exists = $db->prepare('SELECT id FROM users WHERE email = ?');
        $exists->execute([$email]);
        if ($exists->fetch()) {
            throw new ApiException(409, 'That email is already registered.');
        }

        $insert = $db->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
        $insert->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT)]);

        return self::sessionFor((int) $db->lastInsertId());
    }

    public static function login(array $in): array
    {
        $email = strtolower(Validate::text($in, 'email', 190));
        $pass  = Validate::text($in, 'password', 200);

        $stmt = Db::pdo()->prepare('SELECT id, password_hash FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();

        // Same message for "no such email" and "wrong password" so emails cannot be probed.
        if (!$row || !password_verify($pass, $row['password_hash'])) {
            throw new ApiException(401, 'Wrong email or password.');
        }
        return self::sessionFor((int) $row['id']);
    }

    /** Returns the logged-in user row, or stops with 401. */
    public static function requireUser(): array
    {
        $token = Request::bearerToken();
        if ($token === null) {
            throw new ApiException(401, 'Please log in.');
        }
        $stmt = Db::pdo()->prepare(
            'SELECT u.id, u.name, u.email, u.daily_calorie_goal, u.dietary_preference, u.allergies
               FROM api_tokens t
               JOIN users u ON u.id = t.user_id
              WHERE t.token_hash = ? AND t.expires_at > NOW()'
        );
        $stmt->execute([hash('sha256', $token)]);
        $user = $stmt->fetch();
        if (!$user) {
            throw new ApiException(401, 'Your session expired. Please log in again.');
        }
        return $user;
    }

    public static function publicUser(array $u): array
    {
        return [
            'id'                 => (int) $u['id'],
            'name'               => $u['name'],
            'email'              => $u['email'],
            'daily_calorie_goal' => (int) $u['daily_calorie_goal'],
            'dietary_preference' => $u['dietary_preference'],
            'allergies'          => $u['allergies'],
        ];
    }

    private static function sessionFor(int $userId): array
    {
        $db    = Db::pdo();
        $token = bin2hex(random_bytes(32));
        $db->prepare('INSERT INTO api_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ' . self::TOKEN_DAYS . ' DAY))')
           ->execute([$userId, hash('sha256', $token)]);

        $stmt = $db->prepare('SELECT id, name, email, daily_calorie_goal, dietary_preference, allergies FROM users WHERE id = ?');
        $stmt->execute([$userId]);

        return ['token' => $token, 'user' => self::publicUser($stmt->fetch())];
    }
}
