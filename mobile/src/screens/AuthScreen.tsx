import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, Modal, FlatList, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { registerDevice, getBiometricLocations } from '../api/device';

export default function AuthScreen() {
    const [site, setSite] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [manualToken, setManualToken] = useState('');
    const [loading, setLoading] = useState(false);

    // Site Selection State
    const [locations, setLocations] = useState<{ name: string, location_name: string }[]>([]);
    const [showSitePicker, setShowSitePicker] = useState(false);
    const [loadingSites, setLoadingSites] = useState(false);

    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = async () => {
        setLoadingSites(true);
        const locs = await getBiometricLocations();
        setLocations(locs);
        setLoadingSites(false);
    };

    const handleRegister = async () => {
        if (!site || !deviceName) {
            Alert.alert('Error', 'Please select a Site and enter Device Name');
            return;
        }

        setLoading(true);
        try {
            // Pass manual token if provided
            const response = await registerDevice(site, deviceName, 'Mobile', manualToken);

            if (response && response.device_token) {
                await SecureStore.setItemAsync('device_token', response.device_token);
                await SecureStore.setItemAsync('device_id', response.device_id);

                Alert.alert('Success', 'Device Registered Successfully!', [
                    { text: 'OK', onPress: () => router.replace('/') }
                ]);
            } else {
                Alert.alert('Registration Failed', 'No token received from server.');
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Registration Error', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Device Registration</Text>
                    <Text style={styles.subtitle}>Register this device to start marking attendance</Text>

                    {/* Site Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Site / Location Name</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setShowSitePicker(true)}
                        >
                            <Text style={[styles.pickerText, !site && styles.placeholderText]}>
                                {site || "Select Site..."}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Device Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Lobby Tablet 1"
                            value={deviceName}
                            onChangeText={setDeviceName}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Manual Token (Optional) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Manual Device Token (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Paste token if already generated"
                            value={manualToken}
                            onChangeText={setManualToken}
                            autoCapitalize="none"
                            secureTextEntry={true}
                        />
                        <Text style={styles.hint}>Leave empty to auto-generate</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Register Device</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Site Picker Modal */}
            <Modal
                visible={showSitePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSitePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Site</Text>
                            <TouchableOpacity onPress={() => setShowSitePicker(false)}>
                                <Text style={styles.closeButton}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingSites ? (
                            <ActivityIndicator size="large" color="#007AFF" style={{ margin: 20 }} />
                        ) : (
                            <FlatList
                                data={locations}
                                keyExtractor={(item) => item.name}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.item}
                                        onPress={() => {
                                            setSite(item.location_name);
                                            setShowSitePicker(false);
                                        }}
                                    >
                                        <Text style={styles.itemText}>{item.location_name}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text>No sites found. Please create one in Backend.</Text>
                                        {/* Fallback manual entry could go here but let's stick to list for now */}
                                    </View>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 32,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f0f2f5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e1e4e8',
    },
    pickerButton: {
        backgroundColor: '#f0f2f5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e1e4e8',
    },
    pickerText: {
        fontSize: 16,
        color: '#333',
    },
    placeholderText: {
        color: '#999',
    },
    hint: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonDisabled: {
        backgroundColor: '#A0C4FF',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemText: {
        fontSize: 16,
        color: '#333',
    }
});
