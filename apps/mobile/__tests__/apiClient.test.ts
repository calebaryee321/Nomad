import { ApiClient, ApiError } from '@app/api/client';
import { MemoryTokenStore } from '@app/state/tokenStore';

interface Recorded {
  url: string;
  init: RequestInit;
}

function makeFetch(
  responder: (url: string, init: RequestInit) => { status: number; body?: unknown },
): { fn: typeof fetch; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const fn = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    const { status, body } = responder(url, init);
    const text = body === undefined ? '' : JSON.stringify(body);
    return {
      status,
      ok: status >= 200 && status < 300,
      text: async () => text,
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

describe('ApiClient', () => {
  it('attaches the bearer token after login', async () => {
    const store = new MemoryTokenStore();
    const { fn, calls } = makeFetch((url) => {
      if (url.endsWith('/api/v1/auth/login')) {
        return {
          status: 200,
          body: {
            access_token: 'tok-123',
            token_type: 'bearer',
            user: { id: 'u', email: 'a@b.c', display_name: null, created_at: '' },
          },
        };
      }
      return { status: 200, body: [] };
    });
    const api = new ApiClient({ baseUrl: 'https://api.test', tokens: store, fetchImpl: fn });

    await api.login('a@b.c', 'pw12345678');
    expect(await store.get()).toBe('tok-123');

    await api.listItems();
    const last = calls[calls.length - 1];
    expect(last.url).toBe('https://api.test/api/v1/items');
    expect((last.init.headers as Record<string, string>).Authorization).toBe('Bearer tok-123');
  });

  it('throws ApiError with detail on non-2xx', async () => {
    const store = new MemoryTokenStore();
    await store.set('t');
    const { fn } = makeFetch(() => ({ status: 401, body: { detail: 'Invalid token' } }));
    const api = new ApiClient({ baseUrl: 'https://api.test', tokens: store, fetchImpl: fn });

    await expect(api.me()).rejects.toBeInstanceOf(ApiError);
    await expect(api.me()).rejects.toMatchObject({ status: 401, message: 'Invalid token' });
  });

  it('serializes createItem payload and returns parsed body', async () => {
    const store = new MemoryTokenStore();
    await store.set('t');
    const { fn, calls } = makeFetch(() => ({
      status: 201,
      body: {
        id: 'i1',
        source_platform: 'instagram',
        source_url: 'https://www.instagram.com/p/AAA/',
        normalized_url: 'https://www.instagram.com/p/AAA/',
        item_type: 'image',
        title: null,
        user_note: 'note',
        collection_id: null,
        processing_status: 'pending',
        tags: ['food'],
        created_at: 't',
        updated_at: 't',
      },
    }));
    const api = new ApiClient({ baseUrl: 'https://api.test', tokens: store, fetchImpl: fn });

    const item = await api.createItem({
      url: 'https://www.instagram.com/p/AAA/',
      user_note: 'note',
      tags: ['food'],
    });
    expect(item.id).toBe('i1');
    const sent = JSON.parse(String(calls[0].init.body));
    expect(sent).toEqual({
      url: 'https://www.instagram.com/p/AAA/',
      user_note: 'note',
      tags: ['food'],
    });
  });
});
