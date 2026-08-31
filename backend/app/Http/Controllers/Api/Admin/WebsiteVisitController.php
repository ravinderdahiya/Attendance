<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebsiteVisit;
use Carbon\Carbon;

class WebsiteVisitController extends Controller
{
    private const TZ = 'Asia/Kolkata';

    public function index()
    {
        $tz = self::TZ;
        $now = now($tz);
        $todayStart = $now->copy()->startOfDay()->utc();
        $weekStart = $now->copy()->startOfWeek()->utc();
        $monthStart = $now->copy()->startOfMonth()->utc();
        $trendStart = $now->copy()->subDays(29)->startOfDay()->utc();

        $stats = [
            'todayViews' => WebsiteVisit::where('created_at', '>=', $todayStart)->count(),
            'todayUnique' => $this->uniqueSince($todayStart),
            'weekViews' => WebsiteVisit::where('created_at', '>=', $weekStart)->count(),
            'weekUnique' => $this->uniqueSince($weekStart),
            'monthViews' => WebsiteVisit::where('created_at', '>=', $monthStart)->count(),
            'monthUnique' => $this->uniqueSince($monthStart),
            'allViews' => WebsiteVisit::count(),
            'allUnique' => (int) WebsiteVisit::selectRaw('COUNT(DISTINCT visitor_id) as c')->value('c'),
        ];

        $trendRows = WebsiteVisit::where('created_at', '>=', $trendStart)
            ->get(['created_at', 'visitor_id']);

        $byDay = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i)->toDateString();
            $byDay[$date] = ['date' => $date, 'views' => 0, 'unique' => 0, 'ids' => []];
        }
        foreach ($trendRows as $row) {
            $date = Carbon::parse($row->created_at)->timezone($tz)->toDateString();
            if (! isset($byDay[$date])) {
                continue;
            }
            $byDay[$date]['views']++;
            $byDay[$date]['ids'][$row->visitor_id] = true;
        }
        $trend = array_values(array_map(function (array $day) {
            return [
                'date' => $day['date'],
                'views' => $day['views'],
                'unique' => count($day['ids']),
            ];
        }, $byDay));

        $sources = WebsiteVisit::query()
            ->selectRaw('source, COUNT(*) as views, COUNT(DISTINCT visitor_id) as unique_visitors')
            ->groupBy('source')
            ->orderByDesc('views')
            ->get()
            ->map(fn ($row) => [
                'source' => $row->source,
                'views' => (int) $row->views,
                'unique_visitors' => (int) $row->unique_visitors,
            ]);

        $visits = WebsiteVisit::query()
            ->latest()
            ->limit(100)
            ->get(['id', 'source', 'referrer', 'path', 'utm_source', 'ip', 'latitude', 'longitude', 'city', 'created_at'])
            ->map(fn (WebsiteVisit $v) => [
                'id' => $v->id,
                'source' => $v->source,
                'referrer' => $this->referrerHost($v->referrer),
                'path' => $v->path,
                'utm_source' => $v->utm_source,
                'ip' => $v->ip,
                'latitude' => $v->latitude,
                'longitude' => $v->longitude,
                'city' => $v->city,
                'visited_at' => Carbon::parse($v->created_at)->timezone($tz)->toIso8601String(),
            ]);

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'trend' => $trend,
            'sources' => $sources,
            'visits' => $visits,
        ]);
    }

    private function uniqueSince(Carbon $since): int
    {
        return (int) WebsiteVisit::where('created_at', '>=', $since)
            ->selectRaw('COUNT(DISTINCT visitor_id) as c')
            ->value('c');
    }

    private function referrerHost(?string $referrer): ?string
    {
        if (! $referrer) {
            return null;
        }

        $host = parse_url($referrer, PHP_URL_HOST);

        return is_string($host) && $host !== '' ? $host : null;
    }
}
