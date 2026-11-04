import { backspace, canVerify, dotStates, pressDigit } from './pinEntry';

describe('PIN keypad', () => {
  it('adds digits up to the longest allowed PIN', () => {
    let digits = '';
    for (const d of '1234567') digits = pressDigit(digits, d, 6);
    expect(digits).toBe('123456');
  });

  it('ignores anything that is not a single digit', () => {
    expect(pressDigit('12', 'a', 6)).toBe('12');
    expect(pressDigit('12', '34', 6)).toBe('12');
  });

  it('deletes one digit at a time and can be emptied', () => {
    expect(backspace('1234')).toBe('123');
    expect(backspace('')).toBe('');
  });

  it('allows verifying only once the shortest PIN length is reached', () => {
    expect(canVerify('123', 4)).toBe(false);
    expect(canVerify('1234', 4)).toBe(true);
  });

  it('shows one dot per allowed digit', () => {
    expect(dotStates('12', 6)).toEqual([true, true, false, false, false, false]);
  });
});
