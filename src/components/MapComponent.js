import React, { useRef, useEffect } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const MapComponent = ({ origin, destination, routeCoordinates, matches = [] }) => {
    const mapRef = useRef(null);

    useEffect(() => {
        if (mapRef.current && (origin || destination || routeCoordinates.length > 0)) {
            // Fit to coordinates
            const coords = [];
            if (origin) coords.push(origin);
            if (destination) coords.push(destination);
            if (routeCoordinates) coords.push(...routeCoordinates);

            if (coords.length > 0) {
                mapRef.current.fitToCoordinates(coords, {
                    edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, // Increased bottom padding for sheet
                    animated: true,
                });
            }
        }
    }, [origin, destination, routeCoordinates]);

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {origin && <Marker coordinate={origin} title="Origin" pinColor="black" />}
                {destination && <Marker coordinate={destination} title="Destination" pinColor="black" />}

                {routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeWidth={4}
                        strokeColor="#000000" // Black route
                    />
                )}

                {matches.map((match, index) => (
                    match.routeCoordinates && (
                        <Polyline
                            key={`match-${index}`}
                            coordinates={match.routeCoordinates}
                            strokeWidth={3}
                            strokeColor="#276EF1" // Uber Blue for matches
                            lineDashPattern={[5, 5]}
                        />
                    )
                ))}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default MapComponent;
