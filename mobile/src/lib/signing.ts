import * as Crypto from 'expo-crypto';
import { DeviceKey } from '../../modules/device-key';
import { bytesToHex } from './embedding';

/** Must match PAYLOAD_VERSION in face_biometric/core/device_signature.py. */
const PAYLOAD_VERSION = 'fb1';

export type LogType = 'IN' | 'OUT';

export interface SigningInput {
  nonce: string;
  logType: LogType;
  latitude: number | null;
  longitude: number | null;
  embeddingDigest: string;
}

/** Six decimals, applied to both the signed text and the number sent, so both sides see one value. */
export function roundCoordinate(value: number | null): number | null {
  return value === null ? null : Math.round(value * 1e6) / 1e6;
}

function coordinate(value: number | null): string {
  return value === null ? '' : value.toFixed(6);
}

/** The exact text the phone signs; mirrors signing_payload() on the server. */
export function signingPayload(input: SigningInput): string {
  return [
    PAYLOAD_VERSION,
    input.nonce,
    input.logType,
    coordinate(input.latitude),
    coordinate(input.longitude),
    input.embeddingDigest,
  ].join('|');
}

export async function embeddingDigest(embeddingBytes: Uint8Array): Promise<string> {
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, embeddingBytes);
  return bytesToHex(new Uint8Array(digest));
}

export function signCheckin(keyAlias: string, input: SigningInput): string {
  return DeviceKey.sign(keyAlias, signingPayload(input));
}
