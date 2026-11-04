import { queueBlock, restarted, stampNow, type TimeAnchor } from './anchor';

const anchor: TimeAnchor = { serverMs: 1_800_000_000_000, elapsedMs: 5_000_000, bootCount: 12 };
const HOUR = 3_600_000;

describe('stampNow', () => {
  it('adds the running time since the anchor to the server time', () => {
    const stamp = stampNow(anchor, 5_000_000 + 90_000, 12, 1_800_000_090_500);
    expect(stamp.anchoredMs).toBe(1_800_000_090_000);
    expect(stamp.wallMs).toBe(1_800_000_090_500);
    expect(stamp.bootCount).toBe(12);
    expect(stamp.anchorBootCount).toBe(12);
  });

  it('is not moved by a changed clock', () => {
    const stamp = stampNow(anchor, 5_000_000 + 60_000, 12, 1_900_000_000_000);
    expect(stamp.anchoredMs).toBe(1_800_000_060_000);
    expect(stamp.wallMs).toBe(1_900_000_000_000);
  });

  it('after a restart uses the phone clock and breaks the boot count on purpose', () => {
    const stamp = stampNow(anchor, 40_000, 13, 1_800_000_500_000);
    expect(stamp.anchoredMs).toBe(1_800_000_500_000);
    expect(stamp.bootCount).not.toBe(stamp.anchorBootCount);
  });
});

describe('restarted', () => {
  it('sees the running time go backwards', () => {
    expect(restarted(anchor, 1_000, 12)).toBe(true);
  });

  it('sees the boot count move', () => {
    expect(restarted(anchor, 6_000_000, 13)).toBe(true);
  });

  it('ignores an unreadable boot count', () => {
    expect(restarted(anchor, 6_000_000, -1)).toBe(false);
    expect(restarted({ ...anchor, bootCount: -1 }, 6_000_000, 4)).toBe(false);
  });
});

describe('queueBlock', () => {
  const at = (hours: number) => queueBlock(anchor, true, 72, 5_000_000 + hours * HOUR, 12, 0);

  it('allows a scan inside the window', () => {
    expect(at(1)).toBeNull();
    expect(at(72)).toBeNull();
  });

  it('stops after the window', () => {
    expect(at(73)).toBe('too_long');
  });

  it('needs the switch on and a past contact', () => {
    expect(queueBlock(anchor, false, 72, 6_000_000, 12, 0)).toBe('disabled');
    expect(queueBlock(null, true, 72, 6_000_000, 12, 0)).toBe('never_connected');
  });

  it('after a restart measures from the phone clock', () => {
    expect(queueBlock(anchor, true, 72, 1_000, 13, anchor.serverMs + 80 * HOUR)).toBe('too_long');
    expect(queueBlock(anchor, true, 72, 1_000, 13, anchor.serverMs + 2 * HOUR)).toBeNull();
  });
});
