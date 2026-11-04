import { isSleepChoice, shouldSleep, sleepAfterMs } from './sleep';

describe('sleepAfterMs', () => {
  it('turns the choice into milliseconds', () => {
    expect(sleepAfterMs('30')).toBe(30_000);
    expect(sleepAfterMs('300')).toBe(300_000);
  });

  it('uses 0 for never', () => {
    expect(sleepAfterMs('never')).toBe(0);
  });
});

describe('shouldSleep', () => {
  it('waits for the whole period', () => {
    expect(shouldSleep(59_999, 0, 60_000)).toBe(false);
    expect(shouldSleep(60_000, 0, 60_000)).toBe(true);
  });

  it('never sleeps when the wait is 0', () => {
    expect(shouldSleep(10_000_000, 0, 0)).toBe(false);
  });
});

describe('isSleepChoice', () => {
  it('accepts only the listed choices', () => {
    expect(isSleepChoice('60')).toBe(true);
    expect(isSleepChoice('45')).toBe(false);
    expect(isSleepChoice(null)).toBe(false);
  });
});
