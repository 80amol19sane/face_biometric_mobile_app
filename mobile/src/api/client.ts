import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your actual Frappe server URL (e.g., local IP for dev)
// export const BASE_URL = 'https://pms.techbird.in'; // Deprecated: Now fetched dynamically

const client = axios.create({
    // baseURL: BASE_URL, // Set dynamically
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Expect': '',
    },
});

// Add a request interceptor to include the device token if available
client.interceptors.request.use(
    async (config) => {
        // Fetch Server URL
        const serverUrl = await SecureStore.getItemAsync('server_url');
        if (serverUrl) {
            config.baseURL = serverUrl;
        } else {
            // Fallback or error usage
            // console.warn("Server URL not configured");
        }

        const token = await SecureStore.getItemAsync('device_token');
        if (token) {
            config.headers['X-Device-Token'] = token;
        }

        // Add API Key/Secret if available
        const apiKey = await SecureStore.getItemAsync('api_key');
        const apiSecret = await SecureStore.getItemAsync('api_secret');
        if (apiKey && apiSecret) {
            config.headers['Authorization'] = `token ${apiKey}:${apiSecret}`;
        }

        // Explicitly remove Expect header to prevent 417 errors
        if (config.headers['Expect']) {
            delete config.headers['Expect'];
        }
        // Also try to set it to undefined to be sure
        // @ts-ignore
        config.headers['Expect'] = undefined;

        console.log('API Request:', {
            url: (config.baseURL || '') + (config.url || ''),
            method: config.method,
            headers: config.headers,
            data: config.data
        });

        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

client.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.data);
        return response;
    },
    (error) => {
        console.error('API Response Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        return Promise.reject(error);
    }
);

export default client;
