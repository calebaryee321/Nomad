import { DEFAULT_TAG_COLOR, tagChipColor } from '@app/theme/tagColor';

describe('tagChipColor', () => {
  it('returns the default color for empty / whitespace tags', () => {
    expect(tagChipColor('')).toBe(DEFAULT_TAG_COLOR);
    expect(tagChipColor('   ')).toBe(DEFAULT_TAG_COLOR);
  });

  it('is deterministic for the same tag', () => {
    expect(tagChipColor('travel')).toEqual(tagChipColor('travel'));
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(tagChipColor('Travel')).toEqual(tagChipColor('  travel '));
  });

  it('returns a non-default color for non-empty tags', () => {
    const c = tagChipColor('recipes');
    expect(c).not.toBe(DEFAULT_TAG_COLOR);
    expect(c.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(c.fg).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('spreads tags across the palette (more than one bucket used)', () => {
    const samples = ['travel', 'food', 'art', 'design', 'nature', 'music', 'books', 'film'];
    const buckets = new Set(samples.map((t) => tagChipColor(t).bg));
    expect(buckets.size).toBeGreaterThan(1);
  });
});
