import { clockTime } from './punches';

describe('clockTime', () => {
  it('reads the site clock as 12-hour time', () => {
    expect(clockTime('2026-11-03 09:02:11')).toBe('9:02 AM');
    expect(clockTime('2026-11-03 13:45:00')).toBe('1:45 PM');
    expect(clockTime('2026-11-03 00:05:00')).toBe('12:05 AM');
    expect(clockTime('2026-11-03 12:00:00')).toBe('12:00 PM');
  });

  it('leaves anything unexpected alone', () => {
    expect(clockTime('soon')).toBe('soon');
  });
});
