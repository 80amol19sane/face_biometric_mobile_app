import { callMethod } from '../api/http';
import { challenge } from '../api/kiosk';
import { batchDigest, signKiosk } from '../lib/signing';
import { KIOSK_ALIAS } from '../kiosk/registry';
import type { LastRun, QueuedScan } from './queue';
import { scanQueue } from './recorder';

interface ScanResult {
  local_id: string | null;
  status: 'Accepted' | 'Duplicate' | 'Held' | 'Rejected';
  reason: string | null;
}

let running: Promise<LastRun | null> | null = null;

/** Send everything waiting, a batch at a time. Safe to call from several places: one run at a time. */
export function syncQueue(device: string): Promise<LastRun | null> {
  running ??= send(device).finally(() => {
    running = null;
  });
  return running;
}

async function send(device: string): Promise<LastRun | null> {
  const total: LastRun = { atMs: Date.now(), accepted: 0, duplicate: 0, held: 0, rejected: 0 };
  let sent = 0;
  for (let batch = await scanQueue.nextBatch(); batch.length > 0; batch = await scanQueue.nextBatch()) {
    const results = await sendBatch(device, batch);
    const settled = results.filter((r): r is ScanResult & { local_id: string } => !!r.local_id);
    if (settled.length === 0) break; // nothing settled: stop rather than resend the same batch forever
    for (const r of settled) total[COUNT[r.status]] += 1;
    sent += settled.length;
    await scanQueue.settle(settled.map((r) => r.local_id), total);
  }
  return sent > 0 ? total : null;
}

const COUNT = { Accepted: 'accepted', Duplicate: 'duplicate', Held: 'held', Rejected: 'rejected' } as const;

async function sendBatch(device: string, batch: QueuedScan[]): Promise<ScanResult[]> {
  const { nonce } = await challenge(device);
  const signature = signKiosk(KIOSK_ALIAS, 'sync', device, nonce, await batchDigest(batch.map((scan) => scan.hash)));
  return callMethod<ScanResult[]>(
    'face_biometric.api.kiosk.sync_offline',
    { device, nonce, records: JSON.stringify(batch.map(toWire)), signature },
    'POST',
    { guest: true },
  );
}

const toWire = (scan: QueuedScan) => ({
  local_id: scan.localId,
  prev_hash: scan.prevHash,
  anchored_ms: scan.anchoredMs,
  wall_ms: scan.wallMs,
  boot_count: scan.bootCount,
  anchor_boot_count: scan.anchorBootCount,
  embedding: scan.embedding,
  signature: scan.signature,
  claimed_employee: scan.claimedEmployee,
});
