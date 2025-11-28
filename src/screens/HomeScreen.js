import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions, Platform, KeyboardAvoidingView } from 'react-native';
import * as Location from 'expo-location';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getDirections } from '../services/directions';
import { checkMatch } from '../services/matching';
import MapComponent from '../components/MapComponent';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [role, setRole] = useState('rider'); // 'rider' or 'driver'
    const [originText, setOriginText] = useState('');
    const [destText, setDestText] = useState('');
    const [originCoords, setOriginCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    const [route, setRoute] = useState(null);
    const [myTripId, setMyTripId] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setOriginCoords({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
            setOriginText("Current Location");
        })();
    }, []);

    // Listen for matches
    useEffect(() => {
        if (!myTripId || !route) return;

        const q = query(collection(db, "trips"), where("role", "==", role === 'rider' ? 'driver' : 'rider'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const newMatches = [];
            querySnapshot.forEach((doc) => {
                const otherTrip = doc.data();
                otherTrip.id = doc.id;

                if (otherTrip.id === myTripId) return;

                const matchResult = checkMatch(
                    { ...route, role, datetime: new Date().toISOString() },
                    otherTrip
                );

                if (matchResult.isMatch) {
                    newMatches.push({ ...otherTrip, ...matchResult });
                }
            });
            setMatches(newMatches);
        });

        return () => unsubscribe();
    }, [myTripId, route, role]);

    const handleGetRoute = async () => {
        if (!originText || !destText) return;
        setLoading(true);
        try {
            let start = originCoords;
            if (originText !== "Current Location") {
                const geocodedOrigin = await Location.geocodeAsync(originText);
                if (geocodedOrigin.length > 0) {
                    start = { latitude: geocodedOrigin[0].latitude, longitude: geocodedOrigin[0].longitude };
                    setOriginCoords(start);
                }
            }

            const geocodedDest = await Location.geocodeAsync(destText);
            let end = null;
            if (geocodedDest.length > 0) {
                end = { latitude: geocodedDest[0].latitude, longitude: geocodedDest[0].longitude };
                setDestCoords(end);
            }

            if (start && end) {
                const directions = await getDirections(start, end);
                if (directions) {
                    setRoute(directions);
                } else {
                    Alert.alert("Error", "Could not find route");
                }
            } else {
                Alert.alert("Error", "Could not geocode locations");
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTrip = async () => {
        if (!route) {
            Alert.alert("Please get route first");
            return;
        }
        setLoading(true);
        try {
            const tripData = {
                role,
                origin: originCoords,
                destination: destCoords,
                encodedPolyline: route.encodedPolyline,
                datetime: new Date().toISOString(),
                status: 'active'
            };
            const docRef = await addDoc(collection(db, "trips"), tripData);
            setMyTripId(docRef.id);
            Alert.alert("Success", "Trip created! Waiting for matches...");
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to create trip");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <MapComponent
                origin={originCoords}
                destination={destCoords}
                routeCoordinates={route ? route.routeCoordinates : []}
                matches={matches}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.bottomSheetWrapper}
            >
                <ScrollView style={styles.bottomSheet} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View style={styles.dragHandle} />

                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleButton, role === 'rider' && styles.activeToggle]}
                            onPress={() => setRole('rider')}
                        >
                            <Text style={[styles.toggleText, role === 'rider' && styles.activeToggleText]}>Rider</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, role === 'driver' && styles.activeToggle]}
                            onPress={() => setRole('driver')}
                        >
                            <Text style={[styles.toggleText, role === 'driver' && styles.activeToggleText]}>Driver</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <View style={[styles.dot, { backgroundColor: 'black' }]} />
                            <TextInput
                                style={styles.input}
                                placeholder="Where from?"
                                value={originText}
                                onChangeText={setOriginText}
                                placeholderTextColor="#666"
                            />
                        </View>
                        <View style={styles.connectorLine} />
                        <View style={styles.inputWrapper}>
                            <View style={[styles.square, { backgroundColor: 'black' }]} />
                            <TextInput
                                style={styles.input}
                                placeholder="Where to?"
                                value={destText}
                                onChangeText={setDestText}
                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.primaryButton, (!originText || !destText) && styles.disabledButton]}
                            onPress={handleGetRoute}
                            disabled={loading || !originText || !destText}
                        >
                            <Text style={styles.primaryButtonText}>{loading ? "Loading..." : "Preview Route"}</Text>
                        </TouchableOpacity>

                        {route && !myTripId && (
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleCreateTrip}
                                disabled={loading}
                            >
                                <Text style={styles.secondaryButtonText}>Confirm Trip</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {matches.length > 0 && (
                        <View style={styles.matchesSection}>
                            <Text style={styles.sectionTitle}>Available Rides</Text>
                            {matches.map((match) => (
                                <View key={match.id} style={styles.matchCard}>
                                    <View>
                                        <Text style={styles.matchRole}>{match.role === 'driver' ? 'Driver' : 'Rider'}</Text>
                                        <Text style={styles.matchInfo}>{(match.overlap * 100).toFixed(0)}% Route Match</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.chatButton}
                                        onPress={() => navigation.navigate('Chat', { tripId: match.id, myId: myTripId })}
                                    >
                                        <Text style={styles.chatButtonText}>Chat</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    bottomSheetWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: height * 0.6,
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f3f3f3',
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeToggle: {
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontWeight: '600',
        color: '#666',
    },
    activeToggleText: {
        color: 'black',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        paddingHorizontal: 15,
        height: 50,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: 'black',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    square: {
        width: 8,
        height: 8,
    },
    connectorLine: {
        width: 2,
        height: 10,
        backgroundColor: '#ddd',
        marginLeft: 18, // Align with dot/square center
        marginVertical: 2,
    },
    actionButtons: {
        gap: 10,
    },
    primaryButton: {
        backgroundColor: 'black',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#276EF1', // Uber Blue
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    matchesSection: {
        marginTop: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    matchCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    matchRole: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
    },
    matchInfo: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    chatButton: {
        backgroundColor: '#eee',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    chatButtonText: {
        fontWeight: '600',
        color: 'black',
    },
});

export default HomeScreen;
