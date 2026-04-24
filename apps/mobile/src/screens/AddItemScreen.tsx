import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { ApiClient } from '@app/api/client';
import { extractFirstUrl, isInstagramUrl } from '@app/shareIntent/extractUrl';
import { colors, spacing } from '@app/theme';

interface Props {
  api: ApiClient;
  initialSharedText?: string;
  onSaved: () => void;
  onCancel: () => void;
}

export function AddItemScreen({ api, initialSharedText, onSaved, onCancel }: Props): React.ReactElement {
  const fromShare = extractFirstUrl(initialSharedText) ?? '';
  const [url, setUrl] = useState<string>(fromShare);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setError(null);
    if (!url.trim()) {
      setError('Please paste or share a link.');
      return;
    }
    setLoading(true);
    try {
      await api.createItem({
        url: url.trim(),
        user_note: note.trim() || null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Save link</Text>
      {fromShare ? (
        <Text style={styles.shared}>
          {isInstagramUrl(fromShare) ? '📸 Shared from Instagram' : '🔗 Shared link'}
        </Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="https://..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="url"
        value={url}
        onChangeText={setUrl}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Notes (optional)"
        placeholderTextColor={colors.textMuted}
        multiline
        value={note}
        onChangeText={setNote}
      />
      <TextInput
        style={styles.input}
        placeholder="Tags, comma separated (e.g. recipes, travel)"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={tags}
        onChangeText={setTags}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.primaryBtnText}>Save</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.link}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.md },
  shared: { color: colors.primary, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryBtnText: { color: colors.primaryText, fontWeight: '600' },
  link: { color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
  error: { color: colors.danger, marginBottom: spacing.sm },
});
