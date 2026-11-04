import { clockTime, punchLines } from './punches';

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

describe('punchLines', () => {
  it('lists punches in order', () => {
    expect(
      punchLines([
        { time: '2026-11-03 09:02:11', log_type: 'IN' },
        { time: '2026-11-03 13:00:00', log_type: 'OUT' },
      ]),
    ).toEqual(['In 9:02 AM', 'Out 1:00 PM']);
  });

  it('copes with an older server that sends nothing', () => {
    expect(punchLines(undefined)).toEqual([]);
  });
});
