/**
 * Wire-format types shared between the Nomad backend (FastAPI/Pydantic) and
 * the React Native client. Keep this module dependency-free.
 */

export type SourcePlatform = 'instagram' | 'other';
export type SavedItemType = 'video' | 'image' | 'link' | 'unknown';
export type ProcessingStatus =
  | 'pending'
  | 'metadata_fetched'
  | 'queued_for_ai'
  | 'processed'
  | 'partial'
  | 'failed';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: AuthUser;
}

export interface Collection {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedItem {
  id: string;
  source_platform: SourcePlatform;
  source_url: string;
  normalized_url: string;
  item_type: SavedItemType;
  title: string | null;
  user_note: string | null;
  collection_id: string | null;
  processing_status: ProcessingStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}
