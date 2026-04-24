import React, { useCallback, useEffect, useReducer } from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';

import { ApiClient } from '@app/api/client';
import { currentScreen, initialNav, navReducer } from '@app/navigation/nav';
import { AddItemScreen } from '@app/screens/AddItemScreen';
import { HomeScreen } from '@app/screens/HomeScreen';
import { LoginScreen } from '@app/screens/LoginScreen';
import { RegisterScreen } from '@app/screens/RegisterScreen';
import { consumeSharedText } from '@app/shareIntent/nativeBridge';
import { MemoryTokenStore } from '@app/state/tokenStore';
import { colors } from '@app/theme';

const API_BASE_URL = process.env.NOMAD_API_BASE_URL ?? 'http://10.0.2.2:8000';

const tokens = new MemoryTokenStore();
const api = new ApiClient({ baseUrl: API_BASE_URL, tokens });

export default function App(): React.ReactElement {
  const [nav, dispatch] = useReducer(navReducer, initialNav);

  const checkSharedIntent = useCallback(async () => {
    const text = await consumeSharedText();
    if (text) {
      const token = await tokens.get();
      dispatch({
        type: token ? 'push' : 'reset',
        to: token ? { name: 'addItem', sharedUrl: text } : { name: 'login' },
      });
    }
  }, []);

  useEffect(() => {
    void checkSharedIntent();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkSharedIntent();
    });
    return () => sub.remove();
  }, [checkSharedIntent]);

  const screen = currentScreen(nav);

  let view: React.ReactElement;
  switch (screen.name) {
    case 'login':
      view = (
        <LoginScreen
          api={api}
          onAuthenticated={() => dispatch({ type: 'reset', to: { name: 'home' } })}
          onSwitchToRegister={() => dispatch({ type: 'push', to: { name: 'register' } })}
        />
      );
      break;
    case 'register':
      view = (
        <RegisterScreen
          api={api}
          onAuthenticated={() => dispatch({ type: 'reset', to: { name: 'home' } })}
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
