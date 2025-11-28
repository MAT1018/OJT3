import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapComponent = ({ origin, destination, routeCoordinates, matches = [] }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Map View (Web Fallback)</Text>
            <Text>Origin: {origin ? `${origin.latitude}, ${origin.longitude}` : 'Not set'}</Text>
            <Text>Destination: {destination ? `${destination.latitude}, ${destination.longitude}` : 'Not set'}</Text>
            <Text>Route Points: {routeCoordinates?.length || 0}</Text>
            <Text>Matches on map: {matches.length}</Text>
            <View style={styles.placeholder}>
                <Text>Map rendering is optimized for Android/iOS in this MVP.</Text>
                <Text>Please use an Android/iOS emulator or device for the full map experience.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '50%', // Match the height of the native map
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    placeholder: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    }
});

export default MapComponent;
