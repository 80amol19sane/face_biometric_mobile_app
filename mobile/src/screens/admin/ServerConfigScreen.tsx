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

export default function ServerConfigScreen() {
    const [serverUrl, setServerUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const url = await SecureStore.getItemAsync('server_url');
        const key = await SecureStore.getItemAsync('api_key');
        const secret = await SecureStore.getItemAsync('api_secret');

        if (url) setServerUrl(url);
        if (key) setApiKey(key);
        if (secret) setApiSecret(secret);
    };

    const testConnection = async () => {
        if (!serverUrl) {
            Alert.alert("Error", "Please enter server URL");
            return;
        }

        setTesting(true);
        try {
            const response = await fetch(`${serverUrl}/api/method/ping`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                Alert.alert("Success", "Server connection successful!");
            } else {
                Alert.alert("Failed", "Could not connect to server");
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Network request failed. Check URL.");
        } finally {
            setTesting(false);
        }
    };

    const saveConfig = async () => {
        if (!serverUrl) {
            Alert.alert("Error", "Server URL is required");
            return;
        }

        setLoading(true);
        try {
            await SecureStore.setItemAsync('server_url', serverUrl);
            if (apiKey) await SecureStore.setItemAsync('api_key', apiKey);
            if (apiSecret) await SecureStore.setItemAsync('api_secret', apiSecret);

            Alert.alert("Success", "Configuration saved successfully", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to save configuration");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>Server Configuration</Text>
                    <Text style={styles.subtitle}>Configure connection to Frappe server</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Server URL *</Text>
                    <TextInput
                        style={styles.input}
                        value={serverUrl}
                        onChangeText={setServerUrl}
                        placeholder="https://your-server.com"
                        autoCapitalize="none"
                        keyboardType="url"
                    />

                    <Text style={styles.label}>API Key (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={apiKey}
                        onChangeText={setApiKey}
                        placeholder="Enter API key"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>API Secret (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={apiSecret}
                        onChangeText={setApiSecret}
                        placeholder="Enter API secret"
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.testButton, testing && styles.buttonDisabled]}
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
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={saveConfig}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Save Configuration</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Cancel</Text>
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
    testButton: {
        borderWidth: 1,
        borderColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    testButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        borderColor: '#ccc',
    },
    buttonText: {
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
