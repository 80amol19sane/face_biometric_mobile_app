import { useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { resolveDark } from './lib/appearance';
import { dark, light, tonesFor, type Palette, type Tone } from './palette';
import { usePreferences } from './state/preferences';

export type { Palette, Tone };

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
} as const;

/** The palette for the chosen appearance (System follows the phone), plus tone pairs built from it. */
export function useTheme() {
  const { theme } = usePreferences();
  const dim = resolveDark(theme, useColorScheme());
  return useMemo(() => {
    const color = dim ? dark : light;
    return { color, tones: tonesFor(color), dark: dim };
  }, [dim]);
}

/** Gives a palette-dependent style factory the same literal typing as StyleSheet.create. */
export const styleFactory = <T extends StyleSheet.NamedStyles<T>>(make: (color: Palette) => T) => make;

/** Styles that depend on the palette. Pass a module-level factory so the sheet is built once per appearance. */
export function useStyles<T extends StyleSheet.NamedStyles<T>>(make: (color: Palette) => T): T {
  const { color } = useTheme();
  return useMemo(() => StyleSheet.create(make(color)), [make, color]);
}
