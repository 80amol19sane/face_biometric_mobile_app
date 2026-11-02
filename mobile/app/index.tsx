import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import DashboardHeader from '../src/components/DashboardHeader';
import AttendanceButton from '../src/components/AttendanceButton';
import { getDeviceStatus } from '../src/api/device';
import { isServerConfigured } from '../src/utils/serverConfig';

// Add global error handler
if (__DEV__) {
    console.log('Development mode - errors will be logged');
} else {
    // Production error handler
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('GLOBAL ERROR:', error);
        console.error('IS FATAL:', isFatal);
        console.error('STACK:', error.stack);
        if (originalHandler) {
            originalHandler(error, isFatal);
        }
    });
}

export default function Index() {
    const [isChecking, setIsChecking] = useState(true);
    const [deviceData, setDeviceData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkAuthAndLoadData();
    }, []);

    const checkAuthAndLoadData = async () => {
        try {
            console.log('Starting initialization...');
            setIsChecking(true);

            // First check if server is configured
            console.log('Checking server configuration...');
            const serverConfigured = await isServerConfigured();
            console.log('Server configured:', serverConfigured);

            if (!serverConfigured) {
                console.log('Server not configured, redirecting...');
                setIsChecking(false);
                router.replace('/server-config');
                return;
            }

            // Then check device registration
            console.log('Checking device registration...');
            const token = await SecureStore.getItemAsync('device_token');
            const deviceId = await SecureStore.getItemAsync('device_id');
            console.log('Token exists:', !!token, 'DeviceId exists:', !!deviceId);

            if (!token || !deviceId) {
                console.log('Device not registered, redirecting...');
                setIsChecking(false);
                router.replace('/auth');
                return;
            }

            // Fetch latest status from API
            console.log('Fetching device status...');
            setIsChecking(false);
            setLoading(true);

            try {
                const status = await getDeviceStatus(deviceId);
                console.log('Device status received:', status);

                if (status && status.success && status.device) {
                    setDeviceData({
                        deviceName: status.device.device_name,
                        siteName: status.device.site_name || status.device.site
                    });
                } else {
                    // Fallback or error state
                    setDeviceData({
                        deviceName: 'Unknown Device',
                        siteName: 'Unknown Site'
                    });
                }
            } catch (err) {
                console.error("Failed to fetch status", err);
                setDeviceData({
                    deviceName: 'Offline Device',
                    siteName: 'Offline Site'
                });
            } finally {
                setLoading(false);
            }
        } catch (e: any) {
            console.error('Initialization error:', e);
            console.error('Error stack:', e.stack);
            setError(e.message || 'Unknown error');
            setIsChecking(false);
            // Default to server config screen on any error
            try {
                router.replace('/server-config');
            } catch (routerError: any) {
                console.error('Router error:', routerError);
                // If router fails, just show error state
                setDeviceData({
                    deviceName: 'Error',
                    siteName: e.message || 'Please restart app'
                });
            }
        }
    };

    const handleMarkAttendance = () => {
        router.push('/camera');
    };

    const handleLogout = async () => {
        Alert.alert(
            "Reset Device Only for testing",
            "Are you sure you want to reset registration?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('device_token');
                        await SecureStore.deleteItemAsync('device_id');
                        router.replace('/auth');
                    }
                }
            ]
        );
    };

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.replace('/server-config')}>
                    <Text style={styles.buttonText}>Go to Setup</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isChecking) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <DashboardHeader
                deviceName={deviceData?.deviceName || "Device"}
                siteName={deviceData?.siteName || "Site"}
                isOnline={true}
                onAdminPress={() => router.push('/admin/login')}
            />

            <View style={styles.content}>
                <AttendanceButton onPress={handleMarkAttendance} />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Reset Device (Dev)</Text>
                </TouchableOpacity>
                <Text style={styles.version}>v1.0.0</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    version: {
        color: '#999',
        fontSize: 12,
        marginTop: 10,
    },
    logoutBtn: {
        padding: 10,
    },
    logoutText: {
        color: '#D93025',
        fontSize: 14,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    errorText: {
        color: '#D93025',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
