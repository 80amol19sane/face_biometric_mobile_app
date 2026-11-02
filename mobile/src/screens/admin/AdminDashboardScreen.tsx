import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function AdminDashboardScreen() {
    const [username, setUsername] = useState('');
    const [serverUrl, setServerUrl] = useState('');

    useEffect(() => {
        loadAdminInfo();
    }, []);

    const loadAdminInfo = async () => {
        const user = await SecureStore.getItemAsync('admin_username');
        const url = await SecureStore.getItemAsync('server_url');
        setUsername(user || '');
        setServerUrl(url || '');
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('admin_session');
                        await SecureStore.deleteItemAsync('admin_username');
                        router.replace('/admin/login');
                    }
                }
            ]
        );
    };

    const menuItems = [
        {
            title: 'Server Configuration',
            description: 'Configure server URL and API credentials',
            icon: '⚙️',
            route: '/admin/config'
        },
        {
            title: 'Device Registration',
            description: 'Register this device with the server',
            icon: '📱',
            route: '/admin/device'
        },
        {
            title: 'Employee Enrollment',
            description: 'Register employee face and PIN',
            icon: '👤',
            route: '/admin/enroll'
        }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Admin Panel</Text>
                <Text style={styles.subtitle}>Logged in as {username}</Text>
                <Text style={styles.server}>{serverUrl}</Text>
            </View>

            <ScrollView style={styles.content}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={() => router.push(item.route as any)}
                    >
                        <Text style={styles.menuIcon}>{item.icon}</Text>
                        <View style={styles.menuText}>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Text style={styles.menuDescription}>{item.description}</Text>
                        </View>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/')}
                >
                    <Text style={styles.backButtonText}>Back to App</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
    server: {
        fontSize: 12,
        color: '#fff',
        opacity: 0.7,
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    menuItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    menuIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    menuText: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    menuDescription: {
        fontSize: 13,
        color: '#666',
    },
    menuArrow: {
        fontSize: 24,
        color: '#ccc',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        padding: 12,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 14,
    },
});
