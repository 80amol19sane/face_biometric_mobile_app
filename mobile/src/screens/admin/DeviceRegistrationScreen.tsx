import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';

export default function DeviceRegistrationScreen() {
    const [deviceId, setDeviceId] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [site, setSite] = useState('');
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);

    useEffect(() => {
        loadDeviceInfo();
    }, []);

    const loadDeviceInfo = async () => {
        // Check if already registered
        const existingDeviceId = await SecureStore.getItemAsync('device_id');
        if (existingDeviceId) {
            setDeviceId(existingDeviceId);
            setRegistered(true);
        } else {
            // Generate device ID from device info
            const androidId = Application.getAndroidId();
            setDeviceId(androidId || `device_${Date.now()}`);
        }

        const savedSite = await SecureStore.getItemAsync('site');
        if (savedSite) setSite(savedSite);
    };

    const registerDevice = async () => {
        if (!deviceId || !deviceName || !site) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            const serverUrl = await SecureStore.getItemAsync('server_url');

            const response = await fetch(`${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.device.register_device`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    device_id: deviceId,
                    site: site,
                    device_name: deviceName,
                    device_type: 'Mobile'
                })
            });

            const json = await response.json();

            if (json.message && json.message.success) {
                // Store device info
                await SecureStore.setItemAsync('device_id', deviceId);
                await SecureStore.setItemAsync('site', site);
                await SecureStore.setItemAsync('device_name', deviceName);

                setRegistered(true);
                Alert.alert("Success", "Device registered successfully", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                Alert.alert("Failed", json.message?.message || "Registration failed");
            }

        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Network request failed");
        } finally {
            setLoading(false);
        }
    };

    const unregisterDevice = () => {
        Alert.alert(
            "Unregister Device",
            "Are you sure you want to unregister this device?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Unregister",
                    style: "destructive",
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('device_id');
                        await SecureStore.deleteItemAsync('site');
                        await SecureStore.deleteItemAsync('device_name');
                        setRegistered(false);
                        Alert.alert("Success", "Device unregistered");
                    }
                }
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>Device Registration</Text>
                    <Text style={styles.subtitle}>Register this device with the server</Text>
                </View>

                <View style={styles.form}>
                    {registered && (
                        <View style={styles.statusCard}>
                            <Text style={styles.statusIcon}>✓</Text>
                            <Text style={styles.statusText}>Device Registered</Text>
                        </View>
                    )}

                    <Text style={styles.label}>Device ID *</Text>
                    <TextInput
                        style={[styles.input, registered && styles.inputDisabled]}
                        value={deviceId}
                        onChangeText={setDeviceId}
                        placeholder="Auto-generated device ID"
                        editable={!registered}
                    />

                    <Text style={styles.label}>Device Name *</Text>
                    <TextInput
                        style={[styles.input, registered && styles.inputDisabled]}
                        value={deviceName}
                        onChangeText={setDeviceName}
                        placeholder="e.g., Reception Tablet"
                        editable={!registered}
                    />

                    <Text style={styles.label}>Site *</Text>
                    <TextInput
                        style={[styles.input, registered && styles.inputDisabled]}
                        value={site}
                        onChangeText={setSite}
                        placeholder="e.g., Main Office"
                        editable={!registered}
                    />

                    {!registered ? (
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={registerDevice}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Register Device</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.unregisterButton}
                            onPress={unregisterDevice}
                        >
                            <Text style={styles.unregisterButtonText}>Unregister Device</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
    form: {
        padding: 20,
    },
    statusCard: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusIcon: {
        fontSize: 24,
        color: '#fff',
        marginRight: 12,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputDisabled: {
        backgroundColor: '#f0f0f0',
        color: '#999',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    unregisterButton: {
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    unregisterButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 12,
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 14,
    },
});
