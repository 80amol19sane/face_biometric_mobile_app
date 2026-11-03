export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_CHOICES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** The scheme to draw: the person's choice, or the phone's when they have not chosen. */
export function resolveDark(preference: ThemePreference, system: string | null | undefined): boolean {
  return preference === 'system' ? system === 'dark' : preference === 'dark';
}

export const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

/** "Version 1.0.0 (11)"; the build number is what support needs to tell two APKs apart. */
export function versionLabel(version: string | undefined, build: number | undefined): string {
  if (!version) return 'Unknown';
  return build ? `${version} (${build})` : version;
}
