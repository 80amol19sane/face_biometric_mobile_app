import { requireNativeModule } from 'expo';

interface DeviceKeyNative {
  hasKey(alias: string): boolean;
  createKey(alias: string): string;
  getPublicKey(alias: string): string;
  sign(alias: string, payload: string): string;
  isHardwareBacked(alias: string): boolean;
  deleteKey(alias: string): void;
}

/** Hardware-backed ECDSA P-256 key. Public key is SPKI DER base64; signatures are DER base64. */
export const DeviceKey = requireNativeModule<DeviceKeyNative>('DeviceKey');
