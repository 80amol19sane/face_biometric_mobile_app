import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { DeviceKey } from '../../modules/device-key';
import { registerDevice, type MyStatus } from '../api/faceBiometric';

/** One key per login, so two employees sharing a phone never share (or collide on) a key. */
export const keyAlias = (user: string) => `fb_${user.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
const deviceKey = (user: string) => `device_${keyAlias(user)}`;

/**
 * The server-side Biometric Device that belongs to this phone's key for this user. Registers one
 * (with a fresh key) when there is none, or when HR has revoked the old one.
 */
export async function ensureDevice(user: string, status: MyStatus): Promise<string> {
  const alias = keyAlias(user);
  const stored = await SecureStore.getItemAsync(deviceKey(user));
  const stillActive = stored && DeviceKey.hasKey(alias) && status.devices.some((d) => d.name === stored);
  if (stillActive) return stored;

  const publicKey = DeviceKey.createKey(alias);
  const { device } = await registerDevice(publicKey, Device.modelName ?? 'Android phone');
  await SecureStore.setItemAsync(deviceKey(user), device);
  return device;
}

export async function storedDevice(user: string): Promise<string | null> {
  return SecureStore.getItemAsync(deviceKey(user));
}

export function isKeyHardwareBacked(user: string): boolean {
  const alias = keyAlias(user);
  return DeviceKey.hasKey(alias) && DeviceKey.isHardwareBacked(alias);
}
