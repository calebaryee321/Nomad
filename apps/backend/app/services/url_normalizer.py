"""URL helpers, including Instagram URL detection and normalization."""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse, urlunparse

from app.models.enums import SavedItemType, SourcePlatform

_INSTAGRAM_HOSTS = {
    "instagram.com",
    "www.instagram.com",
    "m.instagram.com",
    "instagr.am",
}

# Path patterns: /p/<code>, /reel/<code>, /reels/<code>, /tv/<code>
_IG_SHORTCODE_RE = re.compile(r"^/(?P<kind>p|reel|reels|tv)/(?P<code>[A-Za-z0-9_-]+)/?")


@dataclass(frozen=True)
class NormalizedUrl:
    source_url: str
    normalized_url: str
    source_platform: SourcePlatform
    item_type: SavedItemType
    instagram_shortcode: str | None


def _strip_tracking_query(url: str) -> str:
    """Drop query string and fragment for normalization."""
    parsed = urlparse(url)
    return urlunparse(parsed._replace(query="", fragment=""))


def normalize_url(raw_url: str) -> NormalizedUrl:
    """Detect platform/type and produce a canonical form for deduplication.

    The original URL is preserved as ``source_url`` so the user can still open
    the link in Instagram exactly as shared. ``normalized_url`` is used for
    deduplication/search.
    """
    if not raw_url or not raw_url.strip():
        raise ValueError("url must not be empty")

    url = raw_url.strip()
    # Add scheme if missing so urlparse populates netloc correctly.
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
        url = "https://" + url

    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()

    if host in _INSTAGRAM_HOSTS:
        match = _IG_SHORTCODE_RE.match(parsed.path or "")
        if match:
            kind = match.group("kind")
            code = match.group("code")
            kind_segment = "reel" if kind in ("reel", "reels") else kind
            normalized = f"https://www.instagram.com/{kind_segment}/{code}/"
            item_type = (
                SavedItemType.VIDEO if kind in ("reel", "reels", "tv") else SavedItemType.IMAGE
            )
            return NormalizedUrl(
                source_url=url,
                normalized_url=normalized,
                source_platform=SourcePlatform.INSTAGRAM,
                item_type=item_type,
                instagram_shortcode=code,
            )
        # Other Instagram URL (profile, story, etc.) — store as link.
        cleaned = _strip_tracking_query(url).rstrip("/") + "/"
        return NormalizedUrl(
            source_url=url,
            normalized_url=cleaned,
            source_platform=SourcePlatform.INSTAGRAM,
            item_type=SavedItemType.LINK,
            instagram_shortcode=None,
        )

    return NormalizedUrl(
        source_url=url,
        normalized_url=_strip_tracking_query(url),
        source_platform=SourcePlatform.OTHER,
        item_type=SavedItemType.LINK,
        instagram_shortcode=None,
    )
