import { requireNativeModule } from 'expo';

interface DeviceKeyNative {
  hasKey(alias: string): boolean;
  createKey(alias: string): string;
  getPublicKey(alias: string): string;
  sign(alias: string, payload: string): string;
  isHardwareBacked(alias: string): boolean;
  deleteKey(alias: string): void;
  encrypt(plain: string): Promise<string>;
  decrypt(sealed: string): Promise<string>;
  deleteSecret(): void;
  elapsedRealtimeMs(): number;
  bootCount(): number;
}

/**
 * Hardware-backed ECDSA P-256 key (public key is SPKI DER base64; signatures are DER base64), plus an
 * AES-GCM key for the offline queue and the phone's running time and boot count.
 */
export const DeviceKey = requireNativeModule<DeviceKeyNative>('DeviceKey');
