import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { ApiClient } from '@app/api/client';
import { colors, spacing } from '@app/theme';

interface Props {
  api: ApiClient;
  onAuthenticated: () => void;
  onSwitchToRegister: () => void;
}

export function LoginScreen({ api, onAuthenticated, onSwitchToRegister }: Props): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      await api.login(email.trim().toLowerCase(), password);
      onAuthenticated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nomad</Text>
      <Text style={styles.subtitle}>Save Instagram links you actually want to find again.</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.primaryBtnText}>Log in</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={onSwitchToRegister}>
        <Text style={styles.link}>Need an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background, justifyContent: 'center' },
  title: { color: colors.text, fontSize: 36, fontWeight: '700', marginBottom: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryBtnText: { color: colors.primaryText, fontWeight: '600' },
  link: { color: colors.primary, marginTop: spacing.md, textAlign: 'center' },
  error: { color: colors.danger, marginBottom: spacing.sm },
});
