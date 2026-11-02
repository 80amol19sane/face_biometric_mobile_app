import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface AttendanceButtonProps {
    onPress: () => void;
    isLoading?: boolean;
}

export default function AttendanceButton({ onPress, isLoading }: AttendanceButtonProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={onPress}
                activeOpacity={0.7}
                disabled={isLoading}
            >
                <View style={styles.innerCircle}>
                    <Text style={styles.label}>
                        {isLoading ? 'Processing...' : 'Mark Attendance'}
                    </Text>
                    {!isLoading && <Text style={styles.subIcon}>👆</Text>}
                </View>
            </TouchableOpacity>
        </View>
    );
}

const { width } = Dimensions.get('window');
const BUTTON_SIZE = width * 0.6; // Responsive size

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    button: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: '#E3F2FD', // Light blue outer ring
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#007AFF",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    innerCircle: {
        width: BUTTON_SIZE - 40,
        height: BUTTON_SIZE - 40,
        borderRadius: (BUTTON_SIZE - 40) / 2,
        backgroundColor: '#007AFF', // Primary blue
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    label: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subIcon: {
        fontSize: 32,
        marginTop: 10,
    }
});
