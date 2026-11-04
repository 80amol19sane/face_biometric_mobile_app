const MS_PER_HOUR = 3_600_000;

/** The server's clock at the last contact, with the phone's running time and boot count at that moment. */
export interface TimeAnchor {
  serverMs: number;
  elapsedMs: number;
  bootCount: number;
}

/** What an offline scan carries about when it happened; mirrors the fields checked in core/offline_time.py. */
export interface Stamp {
  anchoredMs: number;
  wallMs: number;
  bootCount: number;
  anchorBootCount: number;
}

/**
 * True when the phone has restarted since the anchor. The running time then went backwards, or the
 * boot count moved (when this Android version reports one).
 */
export function restarted(anchor: TimeAnchor, elapsedMs: number, bootCount: number): boolean {
  const countMoved = bootCount !== -1 && anchor.bootCount !== -1 && bootCount !== anchor.bootCount;
  return elapsedMs < anchor.elapsedMs || countMoved;
}

/**
 * The server's time, worked out as it was at the last contact plus the time the phone has run since.
 * Setting the phone's clock cannot move this. After a restart there is no way to know, so the phone's
 * clock is used and the boot count is made different on purpose: the server then holds the scan for HR.
 */
export function stampNow(anchor: TimeAnchor, elapsedMs: number, bootCount: number, wallMs: number): Stamp {
  if (restarted(anchor, elapsedMs, bootCount)) {
    return { anchoredMs: Math.round(wallMs), wallMs: Math.round(wallMs), bootCount: anchor.bootCount + 1, anchorBootCount: anchor.bootCount };
  }
  return {
    anchoredMs: Math.round(anchor.serverMs + (elapsedMs - anchor.elapsedMs)),
    wallMs: Math.round(wallMs),
    bootCount: anchor.bootCount,
    anchorBootCount: anchor.bootCount,
  };
}

export type QueueBlock = 'disabled' | 'never_connected' | 'too_long';

/** Why a scan may not be saved offline, or null when it may. */
export function queueBlock(anchor: TimeAnchor | null, enabled: boolean, maxHours: number, elapsedMs: number, bootCount: number, wallMs: number): QueueBlock | null {
  if (!enabled) return 'disabled';
  if (!anchor) return 'never_connected';
  const offlineMs = restarted(anchor, elapsedMs, bootCount) ? wallMs - anchor.serverMs : elapsedMs - anchor.elapsedMs;
  return offlineMs > maxHours * MS_PER_HOUR ? 'too_long' : null;
}
