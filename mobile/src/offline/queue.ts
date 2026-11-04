import { dot } from '../lib/embedding';
import type { OfflineScanFields } from '../lib/signing';

export const MAX_QUEUED = 300;
export const BATCH_SIZE = 50;
/** Two scans this alike within the window are one person standing there twice. */
export const SAME_FACE = 0.8;
export const REPEAT_WINDOW_MS = 120_000;

/** A scan waiting to be sent: what the server needs, plus its fingerprint for the next scan to quote. */
export interface QueuedScan extends OfflineScanFields {
  embedding: string;
  signature: string;
  hash: string;
  /** An employee ID the person typed after the scan. A hint for HR only; it is not signed. */
  claimedEmployee?: string;
}

export interface LastRun {
  atMs: number;
  accepted: number;
  duplicate: number;
  held: number;
  rejected: number;
}

export interface QueueState {
  /** Hash of the newest scan ever added; the next scan quotes it so a missing one shows up. */
  head: string;
  scans: QueuedScan[];
  lastRun: LastRun | null;
}

export interface QueueStorage {
  load(): Promise<QueueState>;
  save(state: QueueState): Promise<void>;
}

export const emptyState = (): QueueState => ({ head: '', scans: [], lastRun: null });

/**
 * The scans a kiosk saved while it had no connection. Changes run one at a time, so two scans that
 * arrive together cannot both quote the same previous hash.
 */
export class ScanQueue {
  private tail: Promise<unknown> = Promise.resolve();

  constructor(private readonly storage: QueueStorage) {}

  state(): Promise<QueueState> {
    return this.storage.load();
  }

  /** The chain head the next scan must quote. */
  async head(): Promise<string> {
    return (await this.storage.load()).head;
  }

  async isFull(): Promise<boolean> {
    return (await this.storage.load()).scans.length >= MAX_QUEUED;
  }

  /** Is this face one already saved a moment ago? `embedding` is compared as a unit vector. */
  async seenRecently(embedding: Float32Array, decode: (scan: QueuedScan) => Float32Array, nowMs: number): Promise<boolean> {
    const { scans } = await this.storage.load();
    return scans.some((scan) => nowMs - scan.wallMs <= REPEAT_WINDOW_MS && dot(embedding, decode(scan)) >= SAME_FACE);
  }

  add(scan: QueuedScan): Promise<void> {
    return this.change((state) => ({ ...state, head: scan.hash, scans: [...state.scans, scan] }));
  }

  /** Attach the ID the person typed to a scan still waiting. It is not part of the signed record. */
  claim(localId: string, employee: string): Promise<void> {
    return this.change((state) => ({ ...state, scans: state.scans.map((scan) => (scan.localId === localId ? { ...scan, claimedEmployee: employee } : scan)) }));
  }

  /** Drop the scans the server has settled; keep the rest for the next try. */
  settle(localIds: string[], run: LastRun): Promise<void> {
    const done = new Set(localIds);
    return this.change((state) => ({ ...state, scans: state.scans.filter((scan) => !done.has(scan.localId)), lastRun: run }));
  }

  async nextBatch(): Promise<QueuedScan[]> {
    return (await this.storage.load()).scans.slice(0, BATCH_SIZE);
  }

  private change(apply: (state: QueueState) => QueueState): Promise<void> {
    const next = this.tail.then(async () => this.storage.save(apply(await this.storage.load())));
    this.tail = next.catch(() => {});
    return next;
  }
}
