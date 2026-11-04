import { formatClock, formatLongDate, formatShortDate, parseSiteTime } from './clock';

describe('clock formatting', () => {
  const morning = new Date(2026, 10, 3, 9, 2);

  it('formats a 12-hour clock', () => {
    expect(formatClock(morning)).toBe('9:02 AM');
    expect(formatClock(new Date(2026, 10, 3, 0, 5))).toBe('12:05 AM');
    expect(formatClock(new Date(2026, 10, 3, 12, 0))).toBe('12:00 PM');
    expect(formatClock(new Date(2026, 10, 3, 18, 4))).toBe('6:04 PM');
  });

  it('formats long and short dates', () => {
    expect(formatLongDate(morning)).toBe('Tuesday, 3 November 2026');
    expect(formatShortDate(morning)).toBe('Tue, 3 Nov 2026');
  });
});

describe('parseSiteTime', () => {
  it('reads the site clock parts without a time zone shift', () => {
    const date = parseSiteTime('2026-11-03 09:12:08');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([2026, 10, 3, 9, 12]);
  });

  it('gives an invalid date for junk', () => {
    expect(Number.isNaN(parseSiteTime('soon').getTime())).toBe(true);
  });
});
