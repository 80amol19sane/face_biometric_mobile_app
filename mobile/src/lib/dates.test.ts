import { addDays, dayLabel, isoDay, isToday } from './dates';
import { formatShortDate } from './clock';

describe('dates', () => {
  it('formats and steps local days across month ends', () => {
    expect(isoDay(new Date(2026, 10, 3))).toBe('2026-11-03');
    expect(addDays('2026-11-03', -3)).toBe('2026-10-31');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('knows today, and labels it', () => {
    const today = isoDay(new Date());
    expect(isToday(today)).toBe(true);
    expect(isToday(addDays(today, -1))).toBe(false);
    expect(dayLabel('2026-11-02', formatShortDate)).toBe('Mon, 2 Nov 2026');
    expect(dayLabel(today, formatShortDate).startsWith('Today · ')).toBe(true);
  });
});
