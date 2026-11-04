/** How long the kiosk waits with nobody in front of it before it blanks the screen. */
export type SleepChoice = '30' | '60' | '300' | 'never';

export const SLEEP_CHOICES: { value: SleepChoice; label: string }[] = [
  { value: '30', label: '30 s' },
  { value: '60', label: '1 min' },
  { value: '300', label: '5 min' },
  { value: 'never', label: 'Never' },
];

export const DEFAULT_SLEEP: SleepChoice = '60';

export const isSleepChoice = (value: string | null): value is SleepChoice => SLEEP_CHOICES.some((choice) => choice.value === value);

/** Milliseconds of emptiness before sleeping; 0 means never sleep. */
export function sleepAfterMs(choice: SleepChoice): number {
  return choice === 'never' ? 0 : Number(choice) * 1000;
}

/** True once nobody has been seen for the whole wait. A wait of 0 never sleeps. */
export function shouldSleep(now: number, lastSeen: number, waitMs: number): boolean {
  return waitMs > 0 && now - lastSeen >= waitMs;
}
