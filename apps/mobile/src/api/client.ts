/**
 * Minimal HTTP client around the Nomad backend. Uses `fetch` (available in
 * React Native and Node 18+). Token storage is injected so the same client
 * can be unit-tested without React Native dependencies.
 */

export interface TokenStore {
  get(): Promise<string | null>;
  set(token: string | null): Promise<void>;
}

export interface ApiClientOptions {
  baseUrl: string;
  tokens: TokenStore;
  fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: unknown,
  ) {
    super(typeof detail === 'string' ? detail : `HTTP ${status}`);
    this.name = 'ApiError';
  }
}

export interface SavedItem {
  id: string;
  source_platform: 'instagram' | 'other';
  source_url: string;
  normalized_url: string;
  item_type: 'video' | 'image' | 'link' | 'unknown';
  title: string | null;
  user_note: string | null;
  collection_id: string | null;
  processing_status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokens: TokenStore;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.tokens = opts.tokens;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    requireAuth = true,
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (requireAuth) {
      const token = await this.tokens.get();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const data = text ? safeJsonParse(text) : null;
    if (!res.ok) {
      throw new ApiError(res.status, (data as { detail?: unknown })?.detail ?? text);
    }
    return data as T;
  }

  // ----- auth ----------------------------------------------------------
  async register(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>(
      'POST',
      '/api/v1/auth/register',
      { email, password, display_name: displayName ?? null },
      false,
    );
    await this.tokens.set(res.access_token);
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>(
      'POST',
      '/api/v1/auth/login',
      { email, password },
      false,
    );
    await this.tokens.set(res.access_token);
    return res;
  }

  async logout(): Promise<void> {
    await this.tokens.set(null);
  }

  async me(): Promise<AuthUser> {
    return this.request<AuthUser>('GET', '/api/v1/auth/me');
  }

  // ----- items ---------------------------------------------------------
  async listItems(params?: { collectionId?: string; q?: string }): Promise<SavedItem[]> {
    const qs = new URLSearchParams();
    if (params?.collectionId) qs.set('collection_id', params.collectionId);
    if (params?.q) qs.set('q', params.q);
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<SavedItem[]>('GET', `/api/v1/items${tail}`);
  }

  async createItem(payload: {
    url: string;
    title?: string | null;
    user_note?: string | null;
    collection_id?: string | null;
    tags?: string[];
  }): Promise<SavedItem> {
    return this.request<SavedItem>('POST', '/api/v1/items', payload);
  }

  async updateItem(
    id: string,
    payload: Partial<Pick<SavedItem, 'title' | 'user_note' | 'collection_id' | 'tags'>>,
  ): Promise<SavedItem> {
    return this.request<SavedItem>('PATCH', `/api/v1/items/${id}`, payload);
  }

  async deleteItem(id: string): Promise<void> {
    await this.request<void>('DELETE', `/api/v1/items/${id}`);
  }

  // ----- collections ---------------------------------------------------
  async listCollections(): Promise<Collection[]> {
    return this.request<Collection[]>('GET', '/api/v1/collections');
  }

  async createCollection(name: string, color?: string, icon?: string): Promise<Collection> {
    return this.request<Collection>('POST', '/api/v1/collections', {
      name,
      color: color ?? null,
      icon: icon ?? null,
    });
  }

  async deleteCollection(id: string): Promise<void> {
    await this.request<void>('DELETE', `/api/v1/collections/${id}`);
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
