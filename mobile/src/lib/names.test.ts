import { displayName, greeting } from './names';

describe('displayName', () => {
  it('turns an email into a name', () => {
    expect(displayName('deepak.bhat@example.com')).toBe('Deepak Bhat');
    expect(displayName('riya_kapoor@example.com')).toBe('Riya Kapoor');
  });

  it('leaves non-email logins and empty values alone', () => {
    expect(displayName('Administrator')).toBe('Administrator');
    expect(displayName(null)).toBe('');
  });
});

describe('greeting', () => {
  it('follows the hour', () => {
    expect(greeting(new Date(2026, 10, 2, 8))).toBe('Good morning');
    expect(greeting(new Date(2026, 10, 2, 14))).toBe('Good afternoon');
    expect(greeting(new Date(2026, 10, 2, 20))).toBe('Good evening');
  });
});
