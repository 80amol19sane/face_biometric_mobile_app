/** One accent, quiet neutrals. Colour carries status, not decoration. */
export const light = {
  bg: '#F6F7F9',
  surface: '#FFFFFF',
  ink: '#101828',
  muted: '#586174',
  faint: '#98A2B3',
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
};

export type Palette = Record<keyof typeof light, string>;

/** Same roles on a deep slate ground; accents are lifted so text on them keeps its contrast. */
export const dark: Palette = {
  bg: '#0C1117',
  surface: '#151C25',
  ink: '#F2F4F7',
  muted: '#A3ADBC',
  faint: '#6B7789',
  line: '#283241',
  accent: '#3CC4BB',
  accentInk: '#05201F',
  accentTint: '#143533',
  success: '#5BD38F',
  successTint: '#123424',
  warning: '#F2B35C',
  warningTint: '#3A2A10',
  danger: '#F97066',
  dangerTint: '#3F1A17',
};

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

/** Foreground and tinted background for a status tone. */
export function tonesFor(c: Palette): Record<Tone, { fg: string; bg: string }> {
  return {
    neutral: { fg: c.muted, bg: c.line },
    accent: { fg: c.accent, bg: c.accentTint },
    success: { fg: c.success, bg: c.successTint },
    warning: { fg: c.warning, bg: c.warningTint },
    danger: { fg: c.danger, bg: c.dangerTint },
  };
}
