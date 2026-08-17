<?php

namespace App\Support;

class Geo
{
    private const EARTH_RADIUS_METERS = 6371000;

    /** Great-circle distance between two lat/lng points, in meters. */
    public static function distanceMeters(float $lat1, float $lng1, float $lat2, float $lng2): int
    {
        $phi1 = deg2rad($lat1);
        $phi2 = deg2rad($lat2);
        $deltaPhi = deg2rad($lat2 - $lat1);
        $deltaLambda = deg2rad($lng2 - $lng1);

        $a = sin($deltaPhi / 2) ** 2 + cos($phi1) * cos($phi2) * sin($deltaLambda / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return (int) round(self::EARTH_RADIUS_METERS * $c);
    }
}
