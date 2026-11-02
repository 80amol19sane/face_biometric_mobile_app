import React, { useState, useRef } from 'react';
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
    TouchableWithoutFeedback,
    Keyboard,
    Image,
    Dimensions
} from 'react-native';
import * as Speech from 'expo-speech';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { router } from 'expo-router';

export default function PINAuthScreen() {
    const [employeeId, setEmployeeId] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'camera'>('input');
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [employeePrefix, setEmployeePrefix] = useState<string>('HR-EMP-'); // Default fallback

    // Fetch config from backend
    React.useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const serverUrl = await SecureStore.getItemAsync('server_url');
            if (!serverUrl) return;

            const response = await fetch(`${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.pin_auth.get_auth_config`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            const json = await response.json();
            if (json.message && json.message.employee_series) {
                setEmployeePrefix(json.message.employee_series);
            }
        } catch (e) {
            console.log("Failed to fetch auth config", e);
            // Keep default
        }
    };

    const handleNext = async () => {
        if (!employeeId || !pin) {
            Alert.alert("Error", "Please enter both Employee ID and PIN");
            return;
        }

        // Validate basic format if needed, but since we are forcing numeric, user can only type numbers
        if (pin.length < 4) {
            Alert.alert("Error", "PIN must be at least 4 digits");
            return;
        }

        // Check Permissions
        if (!cameraPermission || !cameraPermission.granted) {
            const permission = await requestCameraPermission();
            if (!permission.granted) {
                Alert.alert("Permission", "Camera permission is required for attendance.");
                return;
            }
        }

        Keyboard.dismiss();
        setStep('camera');
    };

    const handleVerify = async () => {
        if (!cameraRef.current) {
            Alert.alert("Error", "Camera not ready");
            return;
        }

        setLoading(true);
        try {
            // Take Picture
            console.log("Taking picture...");
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.3,
                base64: true,
                exif: false
            });

            if (!photo || !photo.base64) {
                throw new Error("Failed to capture image");
            }
            console.log("Picture taken, size:", photo.base64.length);

            const deviceId = await SecureStore.getItemAsync('device_id');
            if (!deviceId) throw new Error("Device ID missing");

            let latitude = null;
            let longitude = null;
            try {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
                    latitude = location.coords.latitude;
                    longitude = location.coords.longitude;
                }
            } catch (e) {
                console.log("Location error", e);
            }

            const fullEmployeeId = employeePrefix + employeeId;
            console.log("Sending request for:", fullEmployeeId);

            const serverUrl = await SecureStore.getItemAsync('server_url');
            if (!serverUrl) {
                Alert.alert("Configuration Error", "Server URL not set.");
                setLoading(false);
                return;
            }

            const response = await fetch(`${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.pin_auth.verify_pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    device_id: deviceId,
                    employee: fullEmployeeId,
                    pin: pin,
                    latitude: latitude,
                    longitude: longitude,
                    image: photo.base64
                })
            });

            console.log("Response status:", response.status);
            const json = await response.json();

            if (json.message && json.message.success) {
                const message = json.message.message || "Attendance Marked!";
                try {
                    Speech.stop(); // Stop any previous speech
                    Speech.speak(message, {
                        language: 'en',
                        pitch: 1.0,
                        rate: 1.0
                    });
                } catch (speechErr) {
                    console.log("Speech error:", speechErr);
                }

                // Delay Alert slightly to allow audio to start (Syncing Audio & Text)
                setTimeout(() => {
                    Alert.alert("Success", message, [
                        { text: "OK", onPress: () => router.replace('/') }
                    ]);
                }, 1000); // Increased to 1s
            } else {
                Alert.alert("Failed", json.message?.message || "Invalid Credentials");
                setPin(''); // Clear PIN on failure
                setStep('input'); // Go back to input
            }

        } catch (e) {
            console.error("Verify Error:", e);
            Alert.alert("Error", `Request failed: ${e instanceof Error ? e.message : String(e)}`);
            setStep('input');
        } finally {
            setLoading(false);
        }
    };

    const renderInputStep = () => (
        <View style={styles.card}>
            <Text style={styles.title}>Employee Login</Text>
            <Text style={styles.subtitle}>Enter your credentials</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Employee ID</Text>
                <View style={styles.prefixInputContainer}>
                    <Text style={styles.prefixText}>{employeePrefix}</Text>
                    <TextInput
                        style={styles.inputWithPrefix}
                        placeholder="00001"
                        value={employeeId}
                        onChangeText={setEmployeeId}
                        keyboardType="numeric"
                        maxLength={10}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>PIN</Text>
                <TextInput
                    style={styles.input}
                    placeholder="****"
                    value={pin}
                    onChangeText={setPin}
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={6}
                />
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleNext}
            >
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );

    const renderCameraStep = () => (
        <View style={styles.cameraContainer}>
            <CameraView style={styles.camera} facing="front" ref={cameraRef}>
                <View style={styles.overlay}>
                    <Text style={styles.cameraInstruction}>Position face to verify</Text>
                    <View style={styles.faceGuide} />
                </View>
            </CameraView>

            <View style={styles.cameraControls}>
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Verify & Check-In</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('input')} disabled={loading}>
                    <Text style={[styles.cancelText, { color: '#fff' }]}>Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                {step === 'input' ? renderInputStep() : renderCameraStep()}
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
    },
    // Input Step Styles
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 30,
        margin: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
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
        marginBottom: 30,
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
        backgroundColor: '#F0F2F5',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    prefixInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        paddingHorizontal: 15,
    },
    prefixText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
        marginRight: 5,
    },
    inputWithPrefix: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    cancelText: {
        color: '#666',
        fontSize: 16,
    },
    // Camera Step Styles
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    cameraInstruction: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 20,
        fontWeight: '600',
        position: 'absolute',
        top: 60,
    },
    faceGuide: {
        width: 200,
        height: 250,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 100,
        borderStyle: 'dashed',
    },
    cameraControls: {
        padding: 20,
        backgroundColor: '#000',
        paddingBottom: 40,
    },
});
