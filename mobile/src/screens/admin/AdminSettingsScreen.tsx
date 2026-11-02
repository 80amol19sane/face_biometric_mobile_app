import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function AdminSettingsScreen() {
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);

    React.useEffect(() => {
        loadCurrentConfig();
    }, []);

    const loadCurrentConfig = async () => {
        const url = await SecureStore.getItemAsync('server_url');
        const device = await SecureStore.getItemAsync('device_id');
        setServerUrl(url);
        setDeviceId(device);
    };

    const handleResetServerConfig = () => {
        Alert.alert(
            'Reset Server Configuration',
            'This will clear the server URL. You will need to reconfigure it on next launch.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('server_url');
                        Alert.alert('Success', 'Server configuration reset');
                        loadCurrentConfig();
                    }
                }
            ]
        );
    };

    const handleResetDevice = () => {
        Alert.alert(
            'Reset Device Registration',
            'This will unregister this device. You will need to register again.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('device_token');
                        await SecureStore.deleteItemAsync('device_id');
                        Alert.alert('Success', 'Device registration reset. Redirecting...', [
                            { text: 'OK', onPress: () => router.replace('/') }
                        ]);
                    }
                }
            ]
        );
    };

    const handleResetAll = () => {
        Alert.alert(
            'Reset All Configuration',
            'This will clear ALL settings including server URL and device registration. The app will restart from initial setup.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset All',
                    style: 'destructive',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('server_url');
                        await SecureStore.deleteItemAsync('device_token');
                        await SecureStore.deleteItemAsync('device_id');
                        Alert.alert('Success', 'All configuration reset. Redirecting...', [
                            { text: 'OK', onPress: () => router.replace('/') }
                        ]);
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Settings</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Current Configuration</Text>

                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Server URL:</Text>
                        <Text style={styles.infoValue}>{serverUrl || 'Not configured'}</Text>
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Device ID:</Text>
                        <Text style={styles.infoValue}>{deviceId || 'Not registered'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reset Options</Text>

                    <TouchableOpacity
                        style={[styles.button, styles.warningButton]}
                        onPress={handleResetServerConfig}
                    >
                        <Text style={styles.buttonText}>🔄 Reset Server Configuration</Text>
                        <Text style={styles.buttonHint}>Clear server URL only</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.warningButton]}
                        onPress={handleResetDevice}
                    >
                        <Text style={styles.buttonText}>🔄 Reset Device Registration</Text>
                        <Text style={styles.buttonHint}>Unregister this device</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.dangerButton]}
                        onPress={handleResetAll}
                    >
                        <Text style={styles.buttonText}>⚠️ Reset All Configuration</Text>
                        <Text style={styles.buttonHint}>Clear everything and start fresh</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.version}>Version 1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    backButton: {
        marginBottom: 16,
    },
    backText: {
        fontSize: 16,
        color: '#007AFF',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    button: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    warningButton: {
        backgroundColor: '#FFF3CD',
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    dangerButton: {
        backgroundColor: '#F8D7DA',
        borderWidth: 1,
        borderColor: '#DC3545',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    buttonHint: {
        fontSize: 12,
        color: '#666',
    },
    footer: {
        alignItems: 'center',
        marginTop: 32,
    },
    version: {
        fontSize: 12,
        color: '#999',
    },
});
