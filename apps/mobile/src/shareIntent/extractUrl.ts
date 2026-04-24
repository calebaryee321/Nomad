/**
 * Pure helpers for extracting URLs from text shared via the Android share
 * sheet. Instagram's "Share to other apps" generally sends `EXTRA_TEXT` of the
 * form "Caption text https://instagram.com/reel/<code>?igshid=..." or just the
 * URL itself depending on the surface. We pull the first http(s) URL out.
 */

const URL_RE = /\bhttps?:\/\/[^\s<>"']+/i;

export function extractFirstUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(URL_RE);
  return match ? cleanTrailingPunctuation(match[0]) : null;
}

function cleanTrailingPunctuation(url: string): string {
  // Strip trailing punctuation that's almost never part of a real URL.
  return url.replace(/[).,!?;:]+$/, '');
}

export function isInstagramUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return (
      host === 'instagram.com' ||
      host === 'www.instagram.com' ||
      host === 'm.instagram.com' ||
      host === 'instagr.am'
    );
  } catch {
    return false;
  }
}
