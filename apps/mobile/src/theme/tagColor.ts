/**
 * Pure helper that maps a tag string to one of a small palette of chip
 * background/foreground color pairs. The mapping is deterministic (a given
 * tag always renders with the same colors across the app) and is based on a
 * stable hash of the tag's lowercase form so colors aren't index-dependent.
 *
 * Kept in its own pure module (no react-native imports) so it can be unit
 * tested under the existing ts-jest / node setup.
 */

export interface TagColor {
  /** Soft tinted background suitable for a chip on the off-white canvas. */
  bg: string;
  /** Readable foreground for label text on top of `bg`. */
  fg: string;
}

const TAG_PALETTE: readonly TagColor[] = [
  { bg: '#F4D9CC', fg: '#8A3416' }, // terracotta tint
  { bg: '#DCE7DF', fg: '#244A35' }, // sage
  { bg: '#E2DCEA', fg: '#3F2E63' }, // dusty violet
  { bg: '#EFE2C7', fg: '#6B4A12' }, // ochre
  { bg: '#D4E3EA', fg: '#1F4A5C' }, // pale teal
  { bg: '#EAD4DC', fg: '#6B2238' }, // rose
];

/** Default chip colors used when no tag string is provided. */
export const DEFAULT_TAG_COLOR: TagColor = { bg: '#E8E0D5', fg: '#1A1A1A' };

/**
 * Return a deterministic chip color for the given tag. Empty/whitespace-only
 * tags fall back to `DEFAULT_TAG_COLOR` so the caller never has to special
 * case them.
 */
export function tagChipColor(tag: string): TagColor {
  const key = tag.trim().toLowerCase();
  if (!key) return DEFAULT_TAG_COLOR;
  // djb2-ish: small, stable, no deps. Always a non-negative index.
  let h = 5381;
  for (let i = 0; i < key.length; i += 1) {
    h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % TAG_PALETTE.length;
  return TAG_PALETTE[idx];
}
