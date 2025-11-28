// Mocking polyline
const polyline = {
    decode: () => []
};

// Mocking matching.js content manually since I can't import ES modules easily in node without setup
const MATCH_THRESHOLD_KM = 1.0;
const TIME_WINDOW_MINUTES = 15;
const OVERLAP_THRESHOLD = 0.6;

const toRad = (value) => (value * Math.PI) / 180;

const getDistance = (pt1, pt2) => {
    const R = 6371;
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
    for (let p of pathPoints) {
        if (getDistance(point, p) <= MATCH_THRESHOLD_KM) return true;
    }
    return false;
};

const calculateOverlap = (routeA, routeB) => {
    if (!routeA || !routeA.length) return 0;
    let matchedPoints = 0;
    const step = Math.max(1, Math.floor(routeA.length / 20));
    let totalChecks = 0;

    for (let i = 0; i < routeA.length; i += step) {
        totalChecks++;
        if (isPointNearPath(routeA[i], routeB)) {
            matchedPoints++;
        }
    }
    return matchedPoints / totalChecks;
};

const checkMatch = (myTrip, otherTrip) => {
    const timeA = new Date(myTrip.datetime).getTime();
    const timeB = new Date(otherTrip.datetime).getTime();
    const diffMins = Math.abs(timeA - timeB) / 60000;

    if (diffMins > TIME_WINDOW_MINUTES) {
        return { isMatch: false, reason: 'Time mismatch' };
    }

    const routeA = myTrip.routeCoordinates;
    const routeB = otherTrip.routeCoordinates;

    let overlap = 0;
    if (myTrip.role === 'rider' && otherTrip.role === 'driver') {
        overlap = calculateOverlap(routeA, routeB);
    } else if (myTrip.role === 'driver' && otherTrip.role === 'rider') {
        overlap = calculateOverlap(routeB, routeA);
    } else {
        return { isMatch: false, reason: 'Same role' };
    }

    if (overlap >= OVERLAP_THRESHOLD) {
        return { isMatch: true, overlap };
    }

    return { isMatch: false, reason: 'Insufficient overlap', overlap };
};

// Tests
console.log("Running manual tests...");

const routeA = [
    { latitude: 37.7749, longitude: -122.4194 },
    { latitude: 37.7849, longitude: -122.4094 },
    { latitude: 37.7949, longitude: -122.3994 }
];

const routeB = [
    { latitude: 37.7750, longitude: -122.4195 },
    { latitude: 37.7850, longitude: -122.4095 },
    { latitude: 37.7950, longitude: -122.3995 }
];

const routeC = [
    { latitude: 34.0522, longitude: -118.2437 },
    { latitude: 34.0622, longitude: -118.2337 }
];

// Test 1: Overlap
const score = calculateOverlap(routeA, routeB);
console.log(`Test 1 (Overlap): ${score > 0.8 ? 'PASS' : 'FAIL'} (${score})`);

// Test 2: No Overlap
const score2 = calculateOverlap(routeA, routeC);
console.log(`Test 2 (No Overlap): ${score2 < 0.1 ? 'PASS' : 'FAIL'} (${score2})`);

// Test 3: Time Match
const tripA = { datetime: '2023-10-27T10:00:00Z', routeCoordinates: routeA, role: 'rider' };
const tripB = { datetime: '2023-10-27T10:10:00Z', routeCoordinates: routeB, role: 'driver' };
const match1 = checkMatch(tripA, tripB);
console.log(`Test 3 (Time Match): ${match1.isMatch ? 'PASS' : 'FAIL'}`);

// Test 4: Time Mismatch
const tripC = { datetime: '2023-10-27T11:00:00Z', routeCoordinates: routeB, role: 'driver' };
const match2 = checkMatch(tripA, tripC);
console.log(`Test 4 (Time Mismatch): ${!match2.isMatch ? 'PASS' : 'FAIL'} (${match2.reason})`);

console.log("Done.");
