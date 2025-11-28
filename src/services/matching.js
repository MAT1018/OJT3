import polyline from '@mapbox/polyline';

const MATCH_THRESHOLD_KM = 1.0; // 1 km tolerance for point matching
const TIME_WINDOW_MINUTES = 15;
const OVERLAP_THRESHOLD = 0.6; // 60% overlap required

const toRad = (value) => (value * Math.PI) / 180;

const getDistance = (pt1, pt2) => {
    const R = 6371; // km
    const dLat = toRad(pt2.latitude - pt1.latitude);
    const dLon = toRad(pt2.longitude - pt1.longitude);
    const lat1 = toRad(pt1.latitude);
    const lat2 = toRad(pt2.latitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const isPointNearPath = (point, pathPoints) => {
    // Simple check: is point within threshold of ANY point in path?
    // For better accuracy, we should project to segments, but this is MVP.
    for (let p of pathPoints) {
        if (getDistance(point, p) <= MATCH_THRESHOLD_KM) return true;
    }
    return false;
};

export const calculateOverlap = (routeA, routeB) => {
    // routeA and routeB are arrays of {latitude, longitude}
    // We check what fraction of routeA is close to routeB
    if (!routeA || !routeA.length) return 0;

    let matchedPoints = 0;
    // Sample points to avoid O(N*M) if paths are dense. 
    // But for MVP let's just iterate all or every 5th point.
    const step = Math.max(1, Math.floor(routeA.length / 20)); // Check ~20 points
    let totalChecks = 0;

    for (let i = 0; i < routeA.length; i += step) {
        totalChecks++;
        if (isPointNearPath(routeA[i], routeB)) {
            matchedPoints++;
        }
    }

    return matchedPoints / totalChecks;
};

export const checkMatch = (myTrip, otherTrip) => {
    // 1. Time Window
    const timeA = new Date(myTrip.datetime).getTime();
    const timeB = new Date(otherTrip.datetime).getTime();
    const diffMins = Math.abs(timeA - timeB) / 60000;

    if (diffMins > TIME_WINDOW_MINUTES) {
        return { isMatch: false, reason: 'Time mismatch' };
    }

    // 2. Decode polylines if strings
    const routeA = typeof myTrip.encodedPolyline === 'string'
        ? polyline.decode(myTrip.encodedPolyline).map(p => ({ latitude: p[0], longitude: p[1] }))
        : myTrip.routeCoordinates;

    const routeB = typeof otherTrip.encodedPolyline === 'string'
        ? polyline.decode(otherTrip.encodedPolyline).map(p => ({ latitude: p[0], longitude: p[1] }))
        : otherTrip.routeCoordinates;

    // 3. Overlap
    // If I am Rider, my route should be covered by Driver (otherTrip).
    // If I am Driver, my route should cover Rider (otherTrip).
    // Let's just check overlap of the smaller route against the larger one, or just check both.
    // Usually we match Rider request to Driver offer.

    let overlap = 0;
    if (myTrip.role === 'rider' && otherTrip.role === 'driver') {
        overlap = calculateOverlap(routeA, routeB);
    } else if (myTrip.role === 'driver' && otherTrip.role === 'rider') {
        overlap = calculateOverlap(routeB, routeA);
    } else {
        // same role, no match
        return { isMatch: false, reason: 'Same role' };
    }

    if (overlap >= OVERLAP_THRESHOLD) {
        return { isMatch: true, overlap };
    }

    return { isMatch: false, reason: 'Insufficient overlap', overlap };
};
