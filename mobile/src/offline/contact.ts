import * as SecureStore from 'expo-secure-store';
import { DeviceKey } from '../../modules/device-key';
import type { KioskConfig } from '../api/kiosk';
import type { TimeAnchor } from './anchor';

const KEY = 'kiosk_contact';

export interface Contact {
  anchor: TimeAnchor;
  config: KioskConfig;
}

/**
 * Called on every answer from the server: keeps its time with the phone's running time, so offline
 * scans can be dated, and the settings, so the kiosk can start up without a connection.
 */
export async function rememberContact(serverMs: number, config: KioskConfig): Promise<void> {
  const contact: Contact = { anchor: { serverMs, elapsedMs: DeviceKey.elapsedRealtimeMs(), bootCount: DeviceKey.bootCount() }, config };
  await SecureStore.setItemAsync(KEY, JSON.stringify(contact)).catch(() => {});
}

export async function lastContact(): Promise<Contact | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as Contact) : null;
  } catch {
    return null;
  }
}

export const forgetContact = () => SecureStore.deleteItemAsync(KEY).catch(() => {});
