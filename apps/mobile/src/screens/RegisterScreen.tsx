import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ApiClient } from '@app/api/client';
import { colors, radius, spacing, typography } from '@app/theme';

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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Nomad</Text>
          <Text style={styles.headline}>Start your{'\n'}travel journal.</Text>
          <Text style={styles.tagline}>One tap from Instagram and your inspiration lives here.</Text>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Display name</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, loading ? styles.primaryBtnDisabled : null]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.primaryBtnText}>Create account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  header: { marginBottom: spacing.xxl },
  eyebrow: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  headline: { ...typography.display, fontSize: 40, lineHeight: 46, marginBottom: spacing.lg },
  tagline: { ...typography.body, color: colors.textMuted },
  fieldLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    fontSize: typography.body.fontSize,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: colors.primaryText, fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  switchBtn: { paddingVertical: spacing.lg, alignItems: 'center' },
  switchText: { ...typography.body, color: colors.textMuted },
  switchLink: { color: colors.primary, fontWeight: '600' },
  error: { color: colors.danger, marginBottom: spacing.sm },
});
