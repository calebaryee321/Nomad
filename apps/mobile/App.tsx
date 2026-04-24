import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';

import { ApiClient } from '@app/api/client';
import { currentScreen, initialNav, navReducer } from '@app/navigation/nav';
import { AddItemScreen } from '@app/screens/AddItemScreen';
import { HomeScreen } from '@app/screens/HomeScreen';
import { LoginScreen } from '@app/screens/LoginScreen';
import { RegisterScreen } from '@app/screens/RegisterScreen';
import { consumeSharedText, subscribeToShares } from '@app/shareIntent/nativeBridge';
import { MemoryTokenStore } from '@app/state/tokenStore';
import { colors } from '@app/theme';

const API_BASE_URL = process.env.NOMAD_API_BASE_URL ?? 'http://10.0.2.2:8000';

const tokens = new MemoryTokenStore();
const api = new ApiClient({ baseUrl: API_BASE_URL, tokens });

export default function App(): React.ReactElement {
  const [nav, dispatch] = useReducer(navReducer, initialNav);
  // URL captured from a share intent that we couldn't act on yet (e.g. user
  // shared to Nomad while logged out). Replayed once authentication completes
  // so the user's intent is never silently dropped.
  const [pendingSharedUrl, setPendingSharedUrl] = useState<string | null>(null);
  const pendingSharedUrlRef = useRef<string | null>(null);
  pendingSharedUrlRef.current = pendingSharedUrl;

  const handleSharedText = useCallback(async (text: string) => {
    const token = await tokens.get();
    if (token) {
      // Logged in → straight to AddItem with the URL pre-filled.
      setPendingSharedUrl(null);
      dispatch({ type: 'push', to: { name: 'addItem', sharedUrl: text } });
    } else {
      // Not logged in → remember the URL and surface the login screen. The
      // URL is replayed in `handleAuthenticated`.
      setPendingSharedUrl(text);
      dispatch({ type: 'reset', to: { name: 'login' } });
    }
  }, []);

  const checkBufferedShare = useCallback(async () => {
    const text = await consumeSharedText();
    if (text) await handleSharedText(text);
  }, [handleSharedText]);

  const handleAuthenticated = useCallback(() => {
    const pending = pendingSharedUrlRef.current;
    if (pending) {
      setPendingSharedUrl(null);
      dispatch({ type: 'reset', to: { name: 'home' } });
      dispatch({ type: 'push', to: { name: 'addItem', sharedUrl: pending } });
    } else {
      dispatch({ type: 'reset', to: { name: 'home' } });
    }
  }, []);

  useEffect(() => {
    void checkBufferedShare();
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkBufferedShare();
    });
    // Live push for shares that arrive while the React context is alive
    // (e.g. user already foreground in split-screen with Instagram).
    const shareSub = subscribeToShares((text) => {
      void handleSharedText(text);
    });
    return () => {
      appStateSub.remove();
      shareSub.remove();
    };
  }, [checkBufferedShare, handleSharedText]);

  const screen = currentScreen(nav);

  let view: React.ReactElement;
  switch (screen.name) {
    case 'login':
      view = (
        <LoginScreen
          api={api}
          onAuthenticated={handleAuthenticated}
          onSwitchToRegister={() => dispatch({ type: 'push', to: { name: 'register' } })}
        />
      );
      break;
    case 'register':
      view = (
        <RegisterScreen
          api={api}
          onAuthenticated={handleAuthenticated}
          onBack={() => dispatch({ type: 'pop' })}
        />
      );
      break;
    case 'home':
      view = (
        <HomeScreen
          api={api}
          onAdd={() => dispatch({ type: 'push', to: { name: 'addItem' } })}
          onOpenItem={(id) => dispatch({ type: 'push', to: { name: 'itemDetail', itemId: id } })}
          onLogout={() => {
            void api.logout();
            dispatch({ type: 'reset', to: { name: 'login' } });
          }}
        />
      );
      break;
    case 'addItem':
      view = (
        <AddItemScreen
          api={api}
          initialSharedText={screen.sharedUrl}
          onSaved={() => dispatch({ type: 'reset', to: { name: 'home' } })}
          onCancel={() => dispatch({ type: 'pop' })}
        />
      );
      break;
    default:
      view = (
        <HomeScreen
          api={api}
          onAdd={() => dispatch({ type: 'push', to: { name: 'addItem' } })}
          onOpenItem={(id) => dispatch({ type: 'push', to: { name: 'itemDetail', itemId: id } })}
          onLogout={() => {
            void api.logout();
            dispatch({ type: 'reset', to: { name: 'login' } });
          }}
        />
      );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {view}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
