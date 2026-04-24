/**
 * Bridge to the native Android `ShareReceiver` module.
 *
 * The native side stores the most recent shared text in a static field so it
 * survives Activity recreation. JS calls `consumeSharedText()` once and the
 * native side clears the buffer.
 */

import { NativeModules, Platform } from 'react-native';

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
