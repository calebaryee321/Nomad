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


def test_missing_scheme_is_added() -> None:
    res = normalize_url("instagram.com/p/AaaBbbCcc")
    assert res.source_platform is SourcePlatform.INSTAGRAM
    assert res.normalized_url == "https://www.instagram.com/p/AaaBbbCcc/"


def test_empty_url_raises() -> None:
    import pytest

    with pytest.raises(ValueError):
        normalize_url("   ")
