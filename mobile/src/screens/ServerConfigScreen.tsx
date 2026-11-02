import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function ServerConfigScreen() {
    const [serverUrl, setServerUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);

    const validateUrl = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
        } catch {
            return false;
        }
    };

    const testConnection = async () => {
        if (!serverUrl) {
            Alert.alert('Error', 'Please enter a server URL');
            return;
        }

        if (!validateUrl(serverUrl)) {
            Alert.alert('Invalid URL', 'Please enter a valid URL (e.g., https://example.com)');
            return;
        }

        setTesting(true);
        try {
            // Remove trailing slash
            const cleanUrl = serverUrl.replace(/\/$/, '');

            // Test connection by fetching biometric locations
            const response = await fetch(`${cleanUrl}/api/method/attendance_biometric.attendance_biometric.api.device.management.get_biometric_locations`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'AttendanceMobile/1.0',
                    ...(apiKey && apiSecret ? { 'Authorization': `token ${apiKey}:${apiSecret}` } : {})
                }
            });

            if (response.ok) {
                Alert.alert('Success', 'Connection successful! Server is reachable.');
            } else {
                Alert.alert('Connection Failed', `Server returned status ${response.status}`);
            }
        } catch (error: any) {
            Alert.alert('Connection Failed', error.message || 'Could not reach server');
        } finally {
            setTesting(false);
        }
    };

    const saveConfiguration = async () => {
        if (!serverUrl) {
            Alert.alert('Error', 'Please enter a server URL');
            return;
        }

        if (!validateUrl(serverUrl)) {
            Alert.alert('Invalid URL', 'Please enter a valid URL (e.g., https://example.com)');
            return;
        }

        setSaving(true);
        try {
            // Remove trailing slash and save
            const cleanUrl = serverUrl.replace(/\/$/, '');
            await SecureStore.setItemAsync('server_url', cleanUrl);

            if (apiKey) await SecureStore.setItemAsync('api_key', apiKey);
            if (apiSecret) await SecureStore.setItemAsync('api_secret', apiSecret);

            Alert.alert('Success', 'Server configuration saved!', [
                { text: 'OK', onPress: () => router.replace('/auth') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to save configuration: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Server Configuration</Text>
                    <Text style={styles.subtitle}>
                        Configure your Frappe server URL to get started
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Server URL</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://your-server.com"
                            value={serverUrl}
                            onChangeText={setServerUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                        />
                        <Text style={styles.hint}>
                            Enter the full URL of your Frappe server (including https://)
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>API Key (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter API Key"
                            value={apiKey}
                            onChangeText={setApiKey}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>API Secret (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter API Secret"
                            value={apiSecret}
                            onChangeText={setApiSecret}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry={true}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, styles.testButton, testing && styles.buttonDisabled]}
                        onPress={testConnection}
                        disabled={testing}
                    >
                        {testing ? (
                            <ActivityIndicator color="#007AFF" />
                        ) : (
                            <Text style={styles.testButtonText}>Test Connection</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, saving && styles.buttonDisabled]}
                        onPress={saveConfiguration}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Save & Continue</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.exampleBox}>
                        <Text style={styles.exampleTitle}>Example URLs:</Text>
                        <Text style={styles.exampleText}>• https://erp.mycompany.com</Text>
                        <Text style={styles.exampleText}>• https://pms.techbird.in</Text>
                    </View>
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
    testButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    testButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    exampleBox: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    exampleTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    exampleText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
});
