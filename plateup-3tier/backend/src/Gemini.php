<?php
declare(strict_types=1);

namespace PlateUp;

/**
 * Calls Google's Gemini API from the server so the key never reaches the phone.
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 */
final class Gemini
{
    /**
     * @param array<int, array{role: string, parts: array<int, array{text: string}>}> $contents
     * @return string the model's text answer
     */
    public static function generate(array $contents, string $system, bool $json = false, float $temperature = 0.7): string
    {
        $key = Env::get('GEMINI_API_KEY');
        if ($key === '' || str_starts_with($key, 'MY_')) {
            throw new ApiException(503, 'The AI Chatbot is offline: no GEMINI_API_KEY is set on the server.');
        }
        if (!function_exists('curl_init')) {
            throw new ApiException(500, 'The PHP curl extension is required.');
        }

        $model = Env::get('GEMINI_MODEL', 'gemini-3.8-flash');
        $url   = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent';

        $body = [
            'systemInstruction' => ['parts' => [['text' => $system]]],
            'contents'          => $contents,
            'generationConfig'  => ['temperature' => $temperature],
        ];
        if ($json) {
            $body['generationConfig']['responseMimeType'] = 'application/json';
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 45,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'x-goog-api-key: ' . $key],
            CURLOPT_POSTFIELDS     => json_encode($body, JSON_UNESCAPED_UNICODE),
        ]);
        $raw    = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err    = curl_error($ch);
        curl_close($ch);

        if ($raw === false) {
            error_log("Gemini request failed: $err");
            throw new ApiException(502, 'Could not reach the AI service. Check the server\'s internet connection.');
        }
        if ($status !== 200) {
            error_log("Gemini HTTP $status: $raw");
            throw new ApiException(502, "The AI service returned an error ($status). Check GEMINI_API_KEY and GEMINI_MODEL.");
        }

        $data  = json_decode($raw, true);
        $parts = $data['candidates'][0]['content']['parts'] ?? [];
        $text  = '';
        foreach ($parts as $part) {
            $text .= $part['text'] ?? '';
        }
        if (trim($text) === '') {
            throw new ApiException(502, 'The AI service did not return an answer. Please try again.');
        }
        return $text;
    }
}
