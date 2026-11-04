import { l2Normalize } from '../lib/embedding';
import { BATCH_SIZE, emptyState, MAX_QUEUED, REPEAT_WINDOW_MS, ScanQueue, type QueuedScan, type QueueState, type QueueStorage } from './queue';

function memory(): QueueStorage & { saved: QueueState } {
  const box = { saved: emptyState() };
  return {
    get saved() {
      return box.saved;
    },
    load: async () => box.saved,
    save: async (state) => {
      box.saved = state;
    },
  };
}

const scan = (id: string, over: Partial<QueuedScan> = {}): QueuedScan => ({
  localId: id,
  prevHash: '',
  anchoredMs: 1,
  wallMs: 1,
  bootCount: 1,
  anchorBootCount: 1,
  embedding: id,
  signature: 'sig',
  hash: `hash-${id}`,
  ...over,
});

describe('ScanQueue', () => {
  it('keeps the newest hash as the head the next scan quotes', async () => {
    const queue = new ScanQueue(memory());
    expect(await queue.head()).toBe('');
    await queue.add(scan('a'));
    await queue.add(scan('b'));
    expect(await queue.head()).toBe('hash-b');
  });

  it('settles only the scans the server named and keeps the head', async () => {
    const storage = memory();
    const queue = new ScanQueue(storage);
    await queue.add(scan('a'));
    await queue.add(scan('b'));
    await queue.settle(['a'], { atMs: 5, accepted: 1, duplicate: 0, held: 0, rejected: 0 });
    expect((await queue.state()).scans.map((s) => s.localId)).toEqual(['b']);
    expect(await queue.head()).toBe('hash-b');
    expect((await queue.state()).lastRun?.accepted).toBe(1);
  });

  it('sends in order, a batch at a time', async () => {
    const queue = new ScanQueue(memory());
    for (let i = 0; i < BATCH_SIZE + 5; i++) await queue.add(scan(`id-${String(i).padStart(3, '0')}`));
    const batch = await queue.nextBatch();
    expect(batch).toHaveLength(BATCH_SIZE);
    expect(batch[0].localId).toBe('id-000');
  });

  it('does not lose scans added at the same moment', async () => {
    const queue = new ScanQueue(memory());
    await Promise.all(['a', 'b', 'c'].map((id) => queue.add(scan(id))));
    expect((await queue.state()).scans).toHaveLength(3);
  });

  it('reports when it is full', async () => {
    const queue = new ScanQueue(memory());
    expect(await queue.isFull()).toBe(false);
    for (let i = 0; i < MAX_QUEUED; i++) await queue.add(scan(`id-${i}`));
    expect(await queue.isFull()).toBe(true);
  });

  it('spots the same face a moment ago, and only then', async () => {
    const face = l2Normalize(Float32Array.from([1, 0, 0, 0]));
    const other = l2Normalize(Float32Array.from([0, 1, 0, 0]));
    const queue = new ScanQueue(memory());
    await queue.add(scan('a', { wallMs: 1_000 }));
    const decode = () => face;
    expect(await queue.seenRecently(face, decode, 1_000 + REPEAT_WINDOW_MS)).toBe(true);
    expect(await queue.seenRecently(other, decode, 1_000 + 1)).toBe(false);
    expect(await queue.seenRecently(face, decode, 1_000 + REPEAT_WINDOW_MS + 1)).toBe(false);
  });
});
