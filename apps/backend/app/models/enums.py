from enum import StrEnum


class SourcePlatform(StrEnum):
    INSTAGRAM = "instagram"
    OTHER = "other"


class SavedItemType(StrEnum):
    VIDEO = "video"
    IMAGE = "image"
    LINK = "link"
    UNKNOWN = "unknown"


class ProcessingStatus(StrEnum):
    PENDING = "pending"
    METADATA_FETCHED = "metadata_fetched"
    QUEUED_FOR_AI = "queued_for_ai"
    PROCESSED = "processed"
    PARTIAL = "partial"
    FAILED = "failed"


class ProcessingMode(StrEnum):
    MANUAL = "manual"
    AI_TEXT = "ai_text"
    AI_ENRICHED = "ai_enriched"
