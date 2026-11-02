/** 4pt spacing grid and a calm palette; every screen takes its values from here. */
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const color = {
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  text: '#16202A',
  muted: '#5B6773',
  primary: '#1F5FBF',
  primaryText: '#FFFFFF',
  success: '#1E7D4F',
  warning: '#B26A00',
  danger: '#B3261E',
  border: '#D5DBE1',
} as const;

export const radius = { md: 12, pill: 999 } as const;
