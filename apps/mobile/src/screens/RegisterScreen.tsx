import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { ApiClient } from '@app/api/client';
import { colors, spacing } from '@app/theme';

interface Props {
  api: ApiClient;
  onAuthenticated: () => void;
  onBack: () => void;
}

export function RegisterScreen({ api, onAuthenticated, onBack }: Props): React.ReactElement {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await api.register(email.trim().toLowerCase(), password, displayName.trim() || undefined);
      onAuthenticated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your Nomad account</Text>
      <TextInput
        style={styles.input}
        placeholder="Display name (optional)"
        placeholderTextColor={colors.textMuted}
        value={displayName}
        onChangeText={setDisplayName}
      />
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
        placeholder="Password (min 8 chars)"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.primaryBtnText}>Create account</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background, justifyContent: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: spacing.lg },
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
