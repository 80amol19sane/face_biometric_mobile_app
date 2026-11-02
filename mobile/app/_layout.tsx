import { Stack } from 'expo-router';
import { useEffect } from 'react';
import Tts from 'react-native-tts';

export default function RootLayout() {
    useEffect(() => {
        const initTts = async () => {
            try {
                // Initialize
                await Tts.getInitStatus();
                Tts.setDefaultLanguage('en-US');
                Tts.setDefaultRate(0.5);
                Tts.setDefaultPitch(1.0);
                // Optional: Check available voices
                // const voices = await Tts.voices();
                // console.log("Voices:", voices);
            } catch (e) {
                console.log("TTS Error:", e);
            }
        };
        initTts();
    }, []);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="server-config" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="camera" />
            <Stack.Screen name="admin/login" />
            <Stack.Screen name="admin/enrollment" />
            <Stack.Screen name="admin/settings" />
        </Stack>
    );
}
