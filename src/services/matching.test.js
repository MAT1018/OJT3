import { calculateOverlap, checkMatch } from './matching';

jest.mock('@mapbox/polyline', () => ({
    decode: jest.fn(),
}));


describe('Matching Logic', () => {
    const routeA = [
        { latitude: 37.7749, longitude: -122.4194 }, // SF
        { latitude: 37.7849, longitude: -122.4094 },
        { latitude: 37.7949, longitude: -122.3994 }
    ];

    const routeB = [
        { latitude: 37.7750, longitude: -122.4195 }, // Very close to SF start
        { latitude: 37.7850, longitude: -122.4095 },
        { latitude: 37.7950, longitude: -122.3995 }
    ];

    const routeC = [
        { latitude: 34.0522, longitude: -118.2437 }, // LA (far away)
        { latitude: 34.0622, longitude: -118.2337 }
    ];

    test('calculateOverlap returns high score for similar routes', () => {
        const score = calculateOverlap(routeA, routeB);
        expect(score).toBeGreaterThan(0.8);
    });

    test('calculateOverlap returns low score for different routes', () => {
        const score = calculateOverlap(routeA, routeC);
        expect(score).toBeLessThan(0.1);
    });

    test('checkMatch validates time window', () => {
        const tripA = {
            datetime: '2023-10-27T10:00:00Z',
            routeCoordinates: routeA,
            role: 'rider'
        };
        const tripB = {
            datetime: '2023-10-27T10:10:00Z', // 10 mins diff
            routeCoordinates: routeB,
            role: 'driver'
        };
        const tripC = {
            datetime: '2023-10-27T11:00:00Z', // 60 mins diff
            routeCoordinates: routeB,
            role: 'driver'
        };

        const match1 = checkMatch(tripA, tripB);
        expect(match1.isMatch).toBe(true);

        const match2 = checkMatch(tripA, tripC);
        expect(match2.isMatch).toBe(false);
        expect(match2.reason).toBe('Time mismatch');
    });

    test('checkMatch validates role mismatch', () => {
        const tripA = {
            datetime: '2023-10-27T10:00:00Z',
            routeCoordinates: routeA,
            role: 'rider'
        };
        const tripB = {
            datetime: '2023-10-27T10:00:00Z',
            routeCoordinates: routeB,
            role: 'rider' // Same role
        };

        const match = checkMatch(tripA, tripB);
        expect(match.isMatch).toBe(false);
        expect(match.reason).toBe('Same role');
    });
});
