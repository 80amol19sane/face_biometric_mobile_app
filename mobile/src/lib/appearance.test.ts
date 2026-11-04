import { isThemePreference, resolveDark, versionLabel } from './appearance';

describe('resolveDark', () => {
  it('follows the phone unless told otherwise', () => {
    expect(resolveDark('system', 'dark')).toBe(true);
    expect(resolveDark('system', 'light')).toBe(false);
    expect(resolveDark('system', null)).toBe(false);
  });

  it('lets an explicit choice win over the phone', () => {
    expect(resolveDark('light', 'dark')).toBe(false);
    expect(resolveDark('dark', 'light')).toBe(true);
  });
});

describe('isThemePreference', () => {
  it('accepts only the three known values', () => {
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe('versionLabel', () => {
  it('shows version and build', () => {
    expect(versionLabel('1.0.0', 11)).toBe('1.0.0 (11)');
    expect(versionLabel('1.0.0', undefined)).toBe('1.0.0');
    expect(versionLabel(undefined, 11)).toBe('Unknown');
  });
});
