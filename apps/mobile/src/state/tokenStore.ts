/**
 * In-memory token store. The real app should swap this for AsyncStorage or
 * EncryptedStorage once those native modules are added.
 */

import type { TokenStore } from '@app/api/client';

export class MemoryTokenStore implements TokenStore {
  private token: string | null = null;
  async get(): Promise<string | null> {
    return this.token;
  }
  async set(token: string | null): Promise<void> {
    this.token = token;
  }
}
