import * as SecureStore from 'expo-secure-store';
import { DeviceKey } from '../../modules/device-key';
import { callMethod } from '../api/http';

/** One kiosk key per phone. Employees never have one: they do not sign in here. */
export const KIOSK_ALIAS = 'fb_kiosk';
const DEVICE_KEY = 'kiosk_device';

export const getKioskDevice = () => SecureStore.getItemAsync(DEVICE_KEY);

/** Where the signing key lives: 'none' until this phone is registered as a kiosk. */
export function kioskKeyProtection(): 'hardware' | 'software' | 'none' {
  if (!DeviceKey.hasKey(KIOSK_ALIAS)) return 'none';
  return DeviceKey.isHardwareBacked(KIOSK_ALIAS) ? 'hardware' : 'software';
}

/**
 * Makes this phone a kiosk. An admin is signed in when this runs: the server only trusts the new
 * key because an HR Manager registered it. Re-registering replaces the key.
 */
export async function registerThisPhone(label: string, location: string | null): Promise<string> {
  if (DeviceKey.hasKey(KIOSK_ALIAS)) DeviceKey.deleteKey(KIOSK_ALIAS);
  const publicKey = DeviceKey.createKey(KIOSK_ALIAS);
  try {
    const { device } = await callMethod<{ device: string }>('face_biometric.api.admin.register_kiosk', {
      public_key: publicKey,
      label,
      location,
    });
    await SecureStore.setItemAsync(DEVICE_KEY, device);
    return device;
  } catch (error) {
    DeviceKey.deleteKey(KIOSK_ALIAS);
    throw error;
  }
}

export async function forgetKiosk(): Promise<void> {
  if (DeviceKey.hasKey(KIOSK_ALIAS)) DeviceKey.deleteKey(KIOSK_ALIAS);
  await SecureStore.deleteItemAsync(DEVICE_KEY);
}
