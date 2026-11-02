import * as SecureStore from 'expo-secure-store';

/**
 * Get the configured server URL from secure storage
 * @returns Server URL or null if not configured
 */
export const getServerUrl = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync('server_url');
    } catch (error) {
        console.error('Failed to get server URL:', error);
        return null;
    }
};

/**
 * Set the server URL in secure storage
 * @param url Server URL to save
 */
export const setServerUrl = async (url: string): Promise<void> => {
    await SecureStore.setItemAsync('server_url', url);
};

/**
 * Check if server URL is configured
 * @returns true if configured, false otherwise
 */
export const isServerConfigured = async (): Promise<boolean> => {
    const url = await getServerUrl();
    return url !== null && url.length > 0;
};

export const getApiKey = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync('api_key');
    } catch {
        return null; // Return null if not set
    }
};

export const setApiKey = async (key: string): Promise<void> => {
    await SecureStore.setItemAsync('api_key', key);
};

export const getApiSecret = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync('api_secret');
    } catch {
        return null;
    }
};

export const setApiSecret = async (secret: string): Promise<void> => {
    await SecureStore.setItemAsync('api_secret', secret);
};
