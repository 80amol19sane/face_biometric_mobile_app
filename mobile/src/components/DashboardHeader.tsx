import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface DashboardHeaderProps {
    deviceName: string;
    siteName: string;
    isOnline: boolean;
    onAdminPress?: () => void;
}

export default function DashboardHeader({ deviceName, siteName, isOnline, onAdminPress }: DashboardHeaderProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <View style={styles.leftSection}>
                    <Text style={styles.siteName}>{siteName}</Text>
                    <Text style={styles.deviceName}>{deviceName}</Text>
                </View>
                <View style={styles.rightSection}>
                    <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#E6F4EA' : '#FCE8E6' }]}>
                        <View style={[styles.statusDot, { backgroundColor: isOnline ? '#1E8E3E' : '#D93025' }]} />
                        <Text style={[styles.statusText, { color: isOnline ? '#137333' : '#C5221F' }]}>
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </Text>
                    </View>
                    {onAdminPress && (
                        <TouchableOpacity onPress={onAdminPress} style={styles.adminBtn}>
                            <Text style={styles.adminIcon}>⚙️</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    leftSection: {
        flex: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    adminBtn: {
        backgroundColor: '#007AFF',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminIcon: {
        fontSize: 16,
    },
    siteName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    deviceName: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    timeContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    timeText: {
        fontSize: 48,
        fontWeight: '300',
        color: '#333',
        fontVariant: ['tabular-nums'],
    },
    dateText: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    }
});
