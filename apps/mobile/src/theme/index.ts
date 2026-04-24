/**
 * Design tokens for the Nomad mobile app. The visual direction is a warm,
 * editorial travel-magazine aesthetic: an off-white canvas, ink text, a
 * terracotta accent, and soft hairline elevation instead of harsh Material
 * shadows.
 *
 * Keep this file pure (no react-native imports) so it can be consumed from
 * jest unit tests under the existing ts-jest / node setup.
 */

export const colors = {
  // Canvas
  background: '#F7F4EF', // warm off-white
  surface: '#FFFFFF', // raised cards / inputs
  surfaceMuted: '#E8E0D5', // soft sand (notes field, chips)
  // Ink
  text: '#1A1A1A',
  textMuted: '#6B6358',
  // Accent — terracotta
  primary: '#D9643A',
  primaryText: '#FFFFFF',
  // Hairline border used in lieu of heavy shadows
  border: '#E5DFD4',
  // Status
  danger: '#B3261E',
  // Translucent ink used for image-card scrim gradients
  scrim: 'rgba(20, 16, 12, 0.55)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  /**
   * Use as `borderRadius: radius.full` for pill / circular shapes — RN
   * caps `borderRadius` at half the smaller side, so any sufficiently large
   * value yields a fully-rounded shape.
   */
  full: 999,
} as const;

/**
 * Soft elevation tokens. Each card uses a 1px hairline border *plus* a very
 * subtle shadow so it reads as raised on iOS / Android without the harsh
 * Material drop shadow.
 */
export const elevation = {
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fab: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;

/**
 * Typography scale. Numbers are kept conservative so the app reads well on
 * small Android screens; the display style picks up generous letter-spacing
 * to land the editorial feel.
 */
export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    color: colors.text,
  },
  title: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
} as const;

export { tagChipColor, DEFAULT_TAG_COLOR } from './tagColor';
export type { TagColor } from './tagColor';
