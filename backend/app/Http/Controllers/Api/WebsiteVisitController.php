<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WebsiteVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WebsiteVisitController extends Controller
{
    public function store(Request $request)
    {
        $ua = strtolower($request->userAgent() ?? '');
        if (preg_match('/bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|headless|lighthouse/i', $ua)) {
            return response()->json(['success' => true]);
        }

        $data = $request->validate([
            'visitor_id' => 'required|uuid',
            'referrer' => 'nullable|string|max:500',
            'path' => 'nullable|string|max:255',
            'utm_source' => 'nullable|string|max:100',
        ]);

        $referrer = $data['referrer'] ?? null;
        $utm = $data['utm_source'] ?? null;
        $ip = $request->ip();
        $geo = $this->lookupGeo($ip);

        WebsiteVisit::create([
            'visitor_id' => $data['visitor_id'],
            'source' => $this->classifySource($referrer, $utm),
            'referrer' => $referrer ? Str::limit($referrer, 500, '') : null,
            'path' => $data['path'] ?? '/',
            'utm_source' => $utm,
            'ip' => $ip,
            'latitude' => $geo['latitude'],
            'longitude' => $geo['longitude'],
            'city' => $geo['city'],
            'ip_hash' => $ip ? hash('sha256', $ip.config('app.key')) : null,
        ]);

        return response()->json(['success' => true], 201);
    }

    private function classifySource(?string $referrer, ?string $utm): string
    {
        $hint = strtolower(trim((string) $utm));
        if ($hint !== '') {
            if (str_contains($hint, 'google') || str_contains($hint, 'bing') || $hint === 'search') {
                return 'search';
            }
            if (str_contains($hint, 'instagram') || str_contains($hint, 'facebook') || str_contains($hint, 'whatsapp')
                || str_contains($hint, 'twitter') || $hint === 'social') {
                return 'social';
            }

            return 'referral';
        }

        if (! $referrer) {
            return 'direct';
        }

        $host = strtolower((string) parse_url($referrer, PHP_URL_HOST));
        if ($host === '') {
            return 'direct';
        }

        if (str_contains($host, 'google.') || str_contains($host, 'bing.') || str_contains($host, 'yahoo.')
            || str_contains($host, 'duckduckgo.') || str_contains($host, 'baidu.')) {
            return 'search';
        }

        if (str_contains($host, 'instagram.') || str_contains($host, 'facebook.') || str_contains($host, 'fb.')
            || str_contains($host, 'whatsapp.') || str_contains($host, 't.co') || str_contains($host, 'twitter.')
            || str_contains($host, 'x.com') || str_contains($host, 'youtube.') || str_contains($host, 'linkedin.')) {
            return 'social';
        }

        $appHost = strtolower((string) parse_url((string) config('app.url'), PHP_URL_HOST));
        if ($appHost !== '' && ($host === $appHost || str_ends_with($host, '.'.$appHost))) {
            return 'direct';
        }

        return 'referral';
    }

    /** City-level coordinates from the visitor IP. Skips private/local addresses. */
    private function lookupGeo(?string $ip): array
    {
        $empty = ['latitude' => null, 'longitude' => null, 'city' => null];
        if (! $ip || ! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return $empty;
        }

        try {
            $json = Http::timeout(2)
                ->get('http://ip-api.com/json/'.$ip, ['fields' => 'status,lat,lon,city,country'])
                ->json();
        } catch (\Throwable) {
            return $empty;
        }

        if (! is_array($json) || ($json['status'] ?? '') !== 'success') {
            return $empty;
        }

        $city = trim(implode(', ', array_filter([
            $json['city'] ?? null,
            $json['country'] ?? null,
        ])));

        return [
            'latitude' => isset($json['lat']) ? (float) $json['lat'] : null,
            'longitude' => isset($json['lon']) ? (float) $json['lon'] : null,
            'city' => $city !== '' ? Str::limit($city, 120, '') : null,
        ];
    }
}
