from app.db.base import Base
from app.models import Collection, ProcessingLog, SavedItem, SavedItemTag, Tag, User, UserSettings


def test_metadata_includes_core_tables() -> None:
    _ = (Collection, ProcessingLog, SavedItem, SavedItemTag, Tag, User, UserSettings)
    expected_tables = {
        "users",
        "user_settings",
        "collections",
        "saved_items",
        "tags",
        "saved_item_tags",
        "processing_logs",
    }
    assert expected_tables.issubset(set(Base.metadata.tables.keys()))
