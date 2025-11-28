import polyline from '@mapbox/polyline';

const GOOGLE_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

export const getDirections = async (startLoc, destinationLoc) => {
    try {
        const origin = `${startLoc.latitude},${startLoc.longitude}`;
        const dest = `${destinationLoc.latitude},${destinationLoc.longitude}`;
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${GOOGLE_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.routes.length) {
            const points = polyline.decode(data.routes[0].overview_polyline.points);
            const routeCoordinates = points.map(point => ({
                latitude: point[0],
                longitude: point[1]
            }));
            return {
                routeCoordinates,
                encodedPolyline: data.routes[0].overview_polyline.points,
                distance: data.routes[0].legs[0].distance.text,
                duration: data.routes[0].legs[0].duration.text
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching directions:", error);
        return null;
    }
};
