import { bytesToBase64, embeddingBytes } from '../lib/embedding';
import { base64ToBytes } from '../lib/base64';
import type { ShiftStanding } from '../lib/shift';
import { sha256Hex, signKiosk, type KioskAction, type LogType } from '../lib/signing';
import { KIOSK_ALIAS } from '../kiosk/registry';
import { rememberContact } from '../offline/contact';
import { callMethod } from './http';

const API = 'face_biometric.api.kiosk';

/** What HR configured, sent with every challenge so changes reach the kiosk without a new app. */
export interface KioskConfig {
  require_liveness: boolean;
  pin_enabled: boolean;
  pin_min_length: number;
  pin_max_length: number;
  return_seconds: number;
  location: string | null;
  label: string | null;
  offline_enabled: boolean;
  offline_max_hours: number;
}

export interface KioskPunch {
  name: string;
  time: string;
  log_type: LogType;
  method: 'Face' | 'PIN';
  employee: string;
  employee_name: string;
  department: string | null;
  designation: string | null;
  shift: ShiftStanding | null;
}

interface Challenge {
  nonce: string;
  expires_in: number;
  server_time_ms: number;
  config: KioskConfig;
}

/** Short, so a slow or dead connection moves the kiosk to offline mode instead of keeping people waiting. */
const KIOSK_TIMEOUT_MS = 8_000;

/** Every answer also refreshes the offline clock anchor and the cached settings. */
export async function challenge(device: string): Promise<Challenge> {
  const answer = await callMethod<Challenge>(`${API}.get_challenge`, { device }, 'POST', { guest: true, timeoutMs: KIOSK_TIMEOUT_MS });
  await rememberContact(answer.server_time_ms, answer.config);
  return answer;
}

export async function fetchConfig(device: string): Promise<KioskConfig> {
  return (await challenge(device)).config;
}

/** Signs `digest` for `action` with a fresh nonce and sends the request as a guest. */
async function signedCall<T>(device: string, action: KioskAction, method: string, digest: string, args: Record<string, unknown>) {
  const { nonce } = await challenge(device);
  const signature = signKiosk(KIOSK_ALIAS, action, device, nonce, digest);
  return callMethod<T>(`${API}.${method}`, { device, nonce, ...args, signature }, 'POST', { guest: true });
}

const utf8 = (text: string) => new TextEncoder().encode(text) as Uint8Array<ArrayBuffer>;

export async function identify(device: string, embedding: Float32Array): Promise<KioskPunch> {
  const bytes = embeddingBytes(embedding);
  return signedCall(device, 'identify', 'identify', await sha256Hex(bytes), { embedding: bytesToBase64(bytes) });
}

/** The name behind an employee id, so a person can confirm it is them before typing a PIN. */
export async function lookUp(device: string, employee: string): Promise<{ employee: string; employee_name: string }> {
  return signedCall(device, 'lookup', 'look_up', await sha256Hex(utf8(employee)), { employee });
}

export async function pinCheckIn(device: string, employee: string, pin: string, photoBase64: string): Promise<KioskPunch> {
  const photo = base64ToBytes(photoBase64);
  const joined = new Uint8Array(utf8(employee).length + 1 + photo.length) as Uint8Array<ArrayBuffer>;
  joined.set(utf8(employee), 0);
  joined.set([0x7c], utf8(employee).length); // "|"
  joined.set(photo, utf8(employee).length + 1);
  return signedCall(device, 'pin', 'pin_check_in', await sha256Hex(joined), { employee, pin, photo: photoBase64 });
}
