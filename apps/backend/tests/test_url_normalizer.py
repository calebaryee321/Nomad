from app.models.enums import SavedItemType, SourcePlatform
from app.services.url_normalizer import normalize_url


def test_instagram_post_normalized() -> None:
    res = normalize_url("https://www.instagram.com/p/CabCdEf123/?igshid=abc")
    assert res.source_platform is SourcePlatform.INSTAGRAM
    assert res.item_type is SavedItemType.IMAGE
    assert res.normalized_url == "https://www.instagram.com/p/CabCdEf123/"
    assert res.instagram_shortcode == "CabCdEf123"


def test_instagram_reel_normalized_to_video() -> None:
    res = normalize_url("https://instagram.com/reels/XyZ_-9aB/")
    assert res.source_platform is SourcePlatform.INSTAGRAM
    assert res.item_type is SavedItemType.VIDEO
    assert res.normalized_url == "https://www.instagram.com/reel/XyZ_-9aB/"
    assert res.instagram_shortcode == "XyZ_-9aB"


def test_instagram_profile_is_link() -> None:
    res = normalize_url("https://www.instagram.com/someuser/")
    assert res.source_platform is SourcePlatform.INSTAGRAM
    assert res.item_type is SavedItemType.LINK
    assert res.instagram_shortcode is None


def test_other_url_passthrough_strips_query() -> None:
    res = normalize_url("https://example.com/article?utm_source=x#frag")
    assert res.source_platform is SourcePlatform.OTHER
    assert res.item_type is SavedItemType.LINK
    assert res.normalized_url == "https://example.com/article"


def test_other_url_preserves_meaningful_query() -> None:
    # Distinct ``id`` values must not collapse to the same normalized URL.
    a = normalize_url("https://news.example.com/article?id=1&utm_source=fb")
    b = normalize_url("https://news.example.com/article?id=2&utm_source=fb")
    assert a.normalized_url == "https://news.example.com/article?id=1"
    assert b.normalized_url == "https://news.example.com/article?id=2"
    assert a.normalized_url != b.normalized_url


def test_other_url_drops_known_click_ids() -> None:
    res = normalize_url("https://shop.example.com/p?fbclid=ABC&gclid=XYZ&sku=42")
    assert res.normalized_url == "https://shop.example.com/p?sku=42"


def test_normalize_url_is_idempotent() -> None:
    once = normalize_url("https://www.instagram.com/p/AbC/?igshid=1")
    twice = normalize_url(once.normalized_url)
    assert once.normalized_url == twice.normalized_url


def test_missing_scheme_is_added() -> None:
    res = normalize_url("instagram.com/p/AaaBbbCcc")
    assert res.source_platform is SourcePlatform.INSTAGRAM
    assert res.normalized_url == "https://www.instagram.com/p/AaaBbbCcc/"


def test_empty_url_raises() -> None:
    import pytest

    with pytest.raises(ValueError):
        normalize_url("   ")
