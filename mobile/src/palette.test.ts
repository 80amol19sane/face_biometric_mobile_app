import { dark, light, tonesFor, type Palette } from './palette';

const channel = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe.each([
  ['light', light],
  ['dark', dark],
] as [string, Palette][])('%s palette', (_name, c) => {
  it('keeps body text readable on both grounds', () => {
    for (const ground of [c.bg, c.surface]) {
      expect(contrast(c.ink, ground)).toBeGreaterThanOrEqual(7);
      expect(contrast(c.muted, ground)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps text on the accent and its tint readable', () => {
    expect(contrast(c.accentInk, c.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.accent, c.accentTint)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.accent, c.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps every status tone readable on its tint', () => {
    for (const [tone, pair] of Object.entries(tonesFor(c))) {
      expect([tone, contrast(pair.fg, pair.bg) >= 4.5]).toEqual([tone, true]);
    }
  });

  it('keeps status colours readable on the surface', () => {
    for (const fg of [c.success, c.warning, c.danger]) expect(contrast(fg, c.surface)).toBeGreaterThanOrEqual(4.5);
  });
});
