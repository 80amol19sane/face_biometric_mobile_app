import * as Crypto from 'expo-crypto';
import { DeviceKey } from '../../modules/device-key';
import type { KioskConfig } from '../api/kiosk';
import { base64ToBytes } from '../lib/base64';
import { bytesToBase64, embeddingBytes, embeddingFromBytes } from '../lib/embedding';
import { offlinePayload, sha256Hex, sha256Text } from '../lib/signing';
import { KIOSK_ALIAS } from '../kiosk/registry';
import { queueBlock, stampNow, type QueueBlock } from './anchor';
import { lastContact } from './contact';
import { ScanQueue, type QueuedScan } from './queue';
import { encryptedStorage } from './storage';

export const scanQueue = new ScanQueue(encryptedStorage);

/** Why a scan could not be saved, in words for the person at the kiosk. */
export class ScanRefused extends Error {}

const BLOCK_MESSAGES: Record<QueueBlock, string> = {
  disabled: 'Offline attendance is not turned on for this kiosk.',
  never_connected: 'This kiosk has not been online yet, so it cannot date a scan.',
  too_long: 'This kiosk has been offline for too long. Please connect it to the internet.',
};

/**
 * Saves a face scan for later: signs it with the kiosk key and adds it to the encrypted queue. The
 * phone never works out who the person is; the server does that when the scan is sent.
 * Returns the time the person will see on the screen, and the scan's id so they can add their employee ID.
 */
export async function recordOffline(device: string, embedding: Float32Array, config: KioskConfig): Promise<{ at: Date; localId: string }> {
  const contact = await lastContact();
  const wallMs = Date.now();
  const elapsedMs = DeviceKey.elapsedRealtimeMs();
  const bootCount = DeviceKey.bootCount();
  const block = queueBlock(contact?.anchor ?? null, config.offline_enabled, config.offline_max_hours, elapsedMs, bootCount, wallMs);
  if (block || !contact) throw new ScanRefused(BLOCK_MESSAGES[block ?? 'never_connected']);
  if (await scanQueue.isFull()) throw new ScanRefused('This kiosk has too many scans waiting. Please connect it to the internet.');
  if (await scanQueue.seenRecently(embedding, (scan) => embeddingFromBytes(base64ToBytes(scan.embedding)), wallMs)) {
    throw new ScanRefused('You were already recorded a moment ago.');
  }

  const bytes = embeddingBytes(embedding);
  const stamp = stampNow(contact.anchor, elapsedMs, bootCount, wallMs);
  const fields = { localId: Crypto.randomUUID(), prevHash: await scanQueue.head(), ...stamp };
  const payload = offlinePayload(device, fields, await sha256Hex(bytes));
  const scan: QueuedScan = {
    ...fields,
    embedding: bytesToBase64(bytes),
    signature: DeviceKey.sign(KIOSK_ALIAS, payload),
    hash: await sha256Text(payload),
  };
  await scanQueue.add(scan);
  return { at: new Date(stamp.anchoredMs), localId: scan.localId };
}

/** The person typed who they are. It only helps HR if the server is unsure; the server never trusts it. */
export const claimEmployee = (localId: string, employee: string) => scanQueue.claim(localId, employee.trim());
