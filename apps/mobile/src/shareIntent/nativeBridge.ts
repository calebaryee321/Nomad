/**
 * Bridge to the native Android `ShareReceiver` module.
 *
 * Two delivery paths are supported:
 *  - Pull: `consumeSharedText()` returns whatever URL was buffered natively
 *    while JS was not yet listening (cold-start case). The native side clears
 *    the buffer.
 *  - Push: `subscribeToShares(cb)` listens for `onSharedText` device events
 *    emitted whenever a SEND intent is received while the React context is
 *    alive (e.g. the user shares to Nomad while Nomad is already foreground).
 */

import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

interface ShareReceiverModule {
  consumeSharedText(): Promise<string | null>;
}

const fallback: ShareReceiverModule = {
  async consumeSharedText() {
    return null;
  },
};

const module_: ShareReceiverModule =
  Platform.OS === 'android' && (NativeModules.ShareReceiver as ShareReceiverModule | undefined)
    ? (NativeModules.ShareReceiver as ShareReceiverModule)
    : fallback;

export async function consumeSharedText(): Promise<string | null> {
  return module_.consumeSharedText();
}

export interface SharedTextSubscription {
  remove(): void;
}

export function subscribeToShares(
  callback: (text: string) => void,
): SharedTextSubscription {
  if (Platform.OS !== 'android') {
    return { remove: () => undefined };
  }
  const sub = DeviceEventEmitter.addListener('onSharedText', (text: string) => {
    if (typeof text === 'string' && text.length > 0) callback(text);
  });
  return { remove: () => sub.remove() };
}
