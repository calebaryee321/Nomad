import { extractFirstUrl, isInstagramUrl } from '@app/shareIntent/extractUrl';

describe('extractFirstUrl', () => {
  it('returns null on empty input', () => {
    expect(extractFirstUrl(undefined)).toBeNull();
    expect(extractFirstUrl('')).toBeNull();
    expect(extractFirstUrl('   ')).toBeNull();
  });

  it('extracts a bare URL', () => {
    expect(extractFirstUrl('https://www.instagram.com/p/AbC123/')).toBe(
      'https://www.instagram.com/p/AbC123/',
    );
  });

  it('extracts URL embedded in shared caption text', () => {
    const shared =
      'Check this out https://www.instagram.com/reel/XyZ_-9aB/?igshid=foo (via friend)';
    expect(extractFirstUrl(shared)).toBe(
      'https://www.instagram.com/reel/XyZ_-9aB/?igshid=foo',
    );
  });

  it('strips trailing punctuation', () => {
    expect(extractFirstUrl('see https://example.com/path,')).toBe('https://example.com/path');
  });

  it('returns null when no URL is present', () => {
    expect(extractFirstUrl('just some text without a link')).toBeNull();
  });
});

describe('isInstagramUrl', () => {
  it.each([
    ['https://www.instagram.com/p/AbC/', true],
    ['https://instagram.com/reel/XyZ/', true],
    ['https://m.instagram.com/p/AbC/', true],
    ['https://example.com/p/AbC/', false],
    ['not a url', false],
  ])('classifies %s', (url, expected) => {
    expect(isInstagramUrl(url)).toBe(expected);
  });
});
