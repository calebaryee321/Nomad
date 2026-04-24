import React, { useMemo, useState } from 'react';
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
import { extractFirstUrl, isInstagramUrl } from '@app/shareIntent/extractUrl';
import { colors, elevation, radius, spacing, tagChipColor, typography } from '@app/theme';

interface Props {
  api: ApiClient;
  initialSharedText?: string;
  onSaved: () => void;
  onCancel: () => void;
}

function urlPath(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}

export function AddItemScreen({
  api,
  initialSharedText,
  onSaved,
  onCancel,
}: Props): React.ReactElement {
  const fromShare = useMemo(() => extractFirstUrl(initialSharedText) ?? '', [initialSharedText]);
  const [url, setUrl] = useState<string>(fromShare);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function commitTag(raw: string): void {
    const cleaned = raw.trim().replace(/^#+/, '').toLowerCase();
    if (!cleaned) return;
    setTags((prev) => (prev.includes(cleaned) ? prev : [...prev, cleaned]));
    setTagDraft('');
  }

  function removeTag(t: string): void {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  async function submit(): Promise<void> {
    setError(null);
    if (!url.trim()) {
      setError('Please paste or share a link.');
      return;
    }
    // Flush any unsubmitted tag draft so the user doesn't lose it.
    const pendingDraft = tagDraft.trim().replace(/^#+/, '').toLowerCase();
    const finalTags =
      pendingDraft && !tags.includes(pendingDraft) ? [...tags, pendingDraft] : tags;
    setLoading(true);
    try {
      await api.createItem({
        url: url.trim(),
        user_note: note.trim() || null,
        tags: finalTags,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
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
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.handle} />
        <Text style={styles.eyebrow}>New entry</Text>
        <Text style={styles.title}>Save a link</Text>

        {fromShare ? (
          <View style={styles.heroCard}>
            <Text style={styles.heroGlyph}>{isInstagramUrl(fromShare) ? '📸' : '🔗'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>
                {isInstagramUrl(fromShare) ? 'Shared from Instagram' : 'Shared link'}
              </Text>
              <Text style={styles.heroPath} numberOfLines={2}>
                {urlPath(fromShare)}
              </Text>
            </View>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
            value={url}
            onChangeText={setUrl}
          />
        )}

        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Why are you saving this?"
          placeholderTextColor={colors.textMuted}
          multiline
          value={note}
          onChangeText={setNote}
        />

        <Text style={styles.fieldLabel}>Tags</Text>
        <View style={styles.tagComposer}>
          {tags.map((t) => {
            const c = tagChipColor(t);
            return (
              <TouchableOpacity
                key={t}
                onPress={() => removeTag(t)}
                style={[styles.tagChip, { backgroundColor: c.bg }]}
                accessibilityRole="button"
                accessibilityLabel={`Remove tag ${t}`}
              >
                <Text style={[styles.tagChipText, { color: c.fg }]}>#{t} ×</Text>
              </TouchableOpacity>
            );
          })}
          <TextInput
            style={styles.tagInput}
            placeholder={tags.length === 0 ? 'Add tag and press enter' : 'Add another'}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            value={tagDraft}
            onChangeText={(t) => {
              // Allow comma-as-delimiter for power users.
              if (t.endsWith(',')) {
                commitTag(t.slice(0, -1));
              } else {
                setTagDraft(t);
              }
            }}
            onSubmitEditing={() => commitTag(tagDraft)}
            blurOnSubmit={false}
            returnKeyType="done"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, loading ? styles.primaryBtnDisabled : null]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={styles.primaryBtnText}>Save</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  title: { ...typography.display, marginBottom: spacing.xl },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...elevation.card,
  },
  heroGlyph: { fontSize: 28, marginRight: spacing.md },
  heroLabel: { ...typography.caption, marginBottom: spacing.xs },
  heroPath: { ...typography.body, color: colors.text },
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
  notesInput: { minHeight: 96, textAlignVertical: 'top' },
  tagComposer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  tagChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginVertical: spacing.xs,
  },
  tagChipText: { fontSize: 13, fontWeight: '600' },
  tagInput: {
    flexGrow: 1,
    minWidth: 120,
    color: colors.text,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
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
  cancelBtn: { paddingVertical: spacing.lg, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textMuted },
  error: { color: colors.danger, marginBottom: spacing.sm },
});
