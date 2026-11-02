import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert, Dimensions, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import Tts from 'react-native-tts';

// ... (inside verifyFace function)

// Speak the message immediately using Native TTS (pre-warmed)
Tts.stop();
Tts.speak(message);

// Delay visual success update to sync with audio
// Reduced delay needed as Tts is faster
setTimeout(() => {
    setStatus('success');
    // Auto close after success (extended time to allow reading)
    setTimeout(() => {
        router.replace('/');
    }, 2500);
}, 500); // 500ms usually enough for initialized Tts

type VerificationStatus = 'none' | 'processing' | 'success' | 'failed';

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [status, setStatus] = useState<VerificationStatus>('none');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [resultMessage, setResultMessage] = useState<string>('');
    const cameraRef = useRef<CameraView>(null);

    // ... (rest of the code)

    const verifyFace = async (base64Image: string) => {
        setStatus('processing');
        try {
            const deviceId = await SecureStore.getItemAsync('device_id');
            if (!deviceId) throw new Error("Device ID missing");

            // Capture GPS location
            let latitude = null;
            let longitude = null;

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    latitude = location.coords.latitude;
                    longitude = location.coords.longitude;
                    console.log('Location captured:', latitude, longitude);
                }
            } catch (locError) {
                console.error('Location error:', locError);
                // Continue without location if it fails
            }

            const serverUrl = await SecureStore.getItemAsync('server_url');
            if (!serverUrl) {
                Alert.alert("Configuration Error", "Server URL not set.");
                setStatus('failed');
                return;
            }

            const response = await fetch(`${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.attendance.mark_attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'AttendanceMobile/1.0'
                },
                body: JSON.stringify({
                    device_id: deviceId,
                    image: base64Image,
                    latitude: latitude,
                    longitude: longitude
                })
            });

            const json = await response.json();

            // Check Frappe response structure
            if (json.message && json.message.success) {
                const message = json.message.message || "Attendance Marked!";
                setResultMessage(message);

                // Speak the message immediately using Native TTS (pre-warmed)
                Tts.stop();
                Tts.speak(message);

                // Delay visual success update to sync with audio
                setTimeout(() => {
                    setStatus('success');
                    // Auto close after success (extended time to allow reading)
                    setTimeout(() => {
                        router.replace('/');
                    }, 2500);
                }, 500); // Reduced delay to 500ms as Tts is faster
            } else {
                setStatus('failed');
                setResultMessage(json.message?.message || "Face not recognized.");
            }
        } catch (e) {
            console.error(e);
            setStatus('failed');
            setResultMessage("Network or Server Error");
        }
    };

    const handleRetry = () => {
        setStatus('none');
        setCapturedImage(null);
        setResultMessage('');
    };

    const handleFallback = (method: string) => {
        if (method === 'PIN') {
            router.push('/pin');
        } else {
            Alert.alert(method, `${method} authentication module coming soon!`);
        }
    };

    const handleCapture = async () => {
        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.5,
                base64: true,
                exif: false
            });

            if (photo && photo.base64) {
                setCapturedImage(photo.uri);
                verifyFace(photo.base64);
            } else {
                Alert.alert("Error", "Failed to capture image");
            }
        } catch (e) {
            console.error("Capture failed", e);
            Alert.alert("Error", "Failed to take picture");
        }
    };

    // --- RENDER PREVIEW/RESULT ---
    if (capturedImage) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: capturedImage }} style={styles.previewImage} />

                <View style={styles.resultOverlay}>
                    {status === 'processing' && (
                        <View style={styles.statusBox}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.statusText}>Verifying Face...</Text>
                        </View>
                    )}

                    {status === 'success' && (
                        <View style={[styles.statusBox, styles.successBox]}>
                            <Text style={styles.icon}>✅</Text>
                            <Text style={styles.statusText}>{resultMessage}</Text>
                        </View>
                    )}

                    {status === 'failed' && (
                        <View style={styles.failureContainer}>
                            <View style={[styles.statusBox, styles.errorBox]}>
                                <Text style={styles.icon}>❌</Text>
                                <Text style={styles.statusText}>{resultMessage}</Text>
                            </View>

                            <View style={styles.optionsContainer}>
                                <TouchableOpacity style={styles.optionBtn} onPress={handleRetry}>
                                    <Text style={styles.optionText}>🔄 Retry Photo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.optionBtn} onPress={() => handleFallback('PIN')}>
                                    <Text style={styles.optionText}>🔢 Use PIN</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.optionBtn} onPress={() => handleFallback('Fingerprint')}>
                                    <Text style={styles.optionText}>👆 Use Fingerprint</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    }

    // --- RENDER CAMERA ---
    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} facing="front" ref={cameraRef}>
                <View style={styles.overlay}>
                    <View style={styles.topMask} />
                    <View style={styles.middleRow}>
                        <View style={styles.sideMask} />
                        <View style={styles.cutoutBorder}>
                            {/* Transparent Center */}
                        </View>
                        <View style={styles.sideMask} />
                    </View>
                    <View style={styles.bottomMask}>
                        <Text style={styles.instructionText}>Position your face within the oval</Text>

                        <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
                            <View style={styles.captureBtnInner} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const { width, height } = Dimensions.get('window');
const CUTOUT_WIDTH = width * 0.7;
const CUTOUT_HEIGHT = CUTOUT_WIDTH * 1.3;
const TOP_MASK_HEIGHT = (height - CUTOUT_HEIGHT) / 3;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    permissionBox: { padding: 20, backgroundColor: '#fff', margin: 20, borderRadius: 10, alignItems: 'center' },
    message: { textAlign: 'center', marginBottom: 10, fontSize: 16 },

    camera: { flex: 1 },
    previewImage: { flex: 1, resizeMode: 'cover' },

    // Overlay
    overlay: { flex: 1 },
    topMask: { width: '100%', height: TOP_MASK_HEIGHT, backgroundColor: 'rgba(0,0,0,0.7)' },
    middleRow: { flexDirection: 'row', height: CUTOUT_HEIGHT },
    sideMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
    cutoutBorder: { width: CUTOUT_WIDTH, height: CUTOUT_HEIGHT, borderWidth: 2, borderColor: '#fff', borderRadius: CUTOUT_WIDTH / 2, borderStyle: 'dashed' },
    bottomMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', paddingTop: 40 },

    instructionText: { color: '#fff', fontSize: 18, marginBottom: 30, fontWeight: '600' },
    captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    captureBtnInner: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: '#000', backgroundColor: '#fff' },
    closeBtn: { marginTop: 10, padding: 10 },
    closeText: { color: '#fff', fontSize: 16 },

    // Results
    resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    statusBox: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 10, marginBottom: 20 },
    successBox: { backgroundColor: '#E6F4EA' },
    errorBox: { backgroundColor: '#FCE8E6' },
    statusText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
    icon: { fontSize: 24 },

    failureContainer: { width: '80%', alignItems: 'center' },
    optionsContainer: { width: '100%', gap: 10 },
    optionBtn: { backgroundColor: '#fff', padding: 15, borderRadius: 8, alignItems: 'center', width: '100%', marginBottom: 10 },
    optionText: { fontSize: 16, color: '#333', fontWeight: '600' }
});
