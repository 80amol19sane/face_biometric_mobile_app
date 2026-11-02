import client from './client';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { getServerUrl } from '../utils/serverConfig';

export interface DeviceRegistrationResponse {
    device_token: string;
    device_id: string;
    message: string;
}

// Fetch available Biometric Locations
export const getBiometricLocations = async (): Promise<{ name: string, location_name: string }[]> => {
    const serverUrl = await getServerUrl();
    if (!serverUrl) {
        console.error('Server URL not configured');
        return [];
    }

    const url = `${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.device.management.get_biometric_locations`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'AttendanceMobile/1.0'
            }
        });
        const json = await response.json();
        if (json.message && json.message.success) {
            return json.message.locations;
        }
        return [];
    } catch (e) {
        console.error('Failed to fetch biometric locations', e);
        return [];
    }
}

export const registerDevice = async (
    site: string,
    deviceName: string,
    deviceType: string = 'Mobile',
    manualToken?: string
): Promise<DeviceRegistrationResponse> => {
    const serverUrl = await getServerUrl();
    if (!serverUrl) {
        throw new Error('Server URL not configured');
    }

    // Get a unique ID for the device
    let deviceId = Platform.OS === 'android' ? Application.getAndroidId() : await Application.getIosIdForVendorAsync();

    // Fallback if ID is null (e.g. some emulators)
    if (!deviceId) {
        deviceId = 'unknown-device-' + Date.now();
    }

    const url = `${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.device.management.register_device`;

    console.log('Registering with ID:', deviceId);

    const body: any = {
        device_id: deviceId,
        device_name: deviceName,
        site: site,
        device_type: deviceType,
    };

    if (manualToken) {
        body.device_token = manualToken;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'AttendanceMobile/1.0', // Custom UA to avoid blocks
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(body)
    });

    const responseText = await response.text();
    console.log('Raw Server Response:', response.status, responseText);

    if (!response.ok) {
        throw new Error(`Server Error (${response.status}): ${responseText || response.statusText}`);
    }

    try {
        const json = JSON.parse(responseText);
        if (json.message) {
            return {
                ...json.message,
                device_id: deviceId
            };
        }
        return {
            ...json,
            device_id: deviceId
        };
    } catch (e) {
        throw new Error('Invalid JSON response: ' + responseText);
    }
};

export const getDeviceStatus = async (deviceId: string) => {
    const serverUrl = await getServerUrl();
    if (!serverUrl) {
        console.error('Server URL not configured');
        return null;
    }

    const url = `${serverUrl}/api/method/attendance_biometric.attendance_biometric.api.device.management.get_device_status?device_id=${deviceId}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'AttendanceMobile/1.0'
            }
        });
        const json = await response.json();
        if (json.message && json.message.success) {
            return json.message;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null; // Return null on error
    }
}
