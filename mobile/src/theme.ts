/** One accent, quiet neutrals. Colour carries status, not decoration. */
export const color = {
  bg: '#F6F7F9',
  surface: '#FFFFFF',
  ink: '#101828',
  muted: '#586174',
  line: '#E4E7EC',
  accent: '#0D7377',
  accentInk: '#FFFFFF',
  accentTint: '#E3F2F1',
  success: '#16794C',
  successTint: '#E4F4EC',
  warning: '#8A5300',
  warningTint: '#FDF1DC',
  danger: '#B42318',
  dangerTint: '#FDE8E6',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
} as const;

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

/** Foreground and tinted background for a status tone. */
export const tones: Record<Tone, { fg: string; bg: string }> = {
  neutral: { fg: color.muted, bg: color.line },
  accent: { fg: color.accent, bg: color.accentTint },
  success: { fg: color.success, bg: color.successTint },
  warning: { fg: color.warning, bg: color.warningTint },
  danger: { fg: color.danger, bg: color.dangerTint },
};
