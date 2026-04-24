import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ApiClient, AuthUser, SavedItem } from '@app/api/client';
import { colors, elevation, radius, spacing, tagChipColor, typography } from '@app/theme';

interface Props {
  api: ApiClient;
  onAdd: () => void;
  onOpenItem: (id: string) => void;
  onLogout: () => void;
}

const ALL_TAGS_FILTER = '__all__';

function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function previewImageUrl(item: SavedItem): string | null {
  // The current backend doesn't surface a preview image yet, but the
  // SavedItem shape may grow one. Be defensive so the discover feed can
  // light up the moment one lands without a UI rev.
  const candidate = (item as unknown as { preview_image_url?: unknown }).preview_image_url;
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : null;
}

export function HomeScreen({ api, onAdd, onOpenItem, onLogout }: Props): React.ReactElement {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [activeTag, setActiveTag] = useState<string>(ALL_TAGS_FILTER);
  const [me, setMe] = useState<AuthUser | null>(null);

  const load = useCallback(
    async (search?: string) => {
      try {
        const data = await api.listItems(search ? { q: search } : undefined);
        setItems(data);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [api],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((u) => {
        if (!cancelled) setMe(u);
      })
      .catch(() => {
        // Non-fatal: greeting just falls back to a generic copy.
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) for (const t of it.tags) set.add(t);
    return Array.from(set).sort();
  }, [items]);

  const visibleItems = useMemo(() => {
    if (activeTag === ALL_TAGS_FILTER) return items;
    return items.filter((it) => it.tags.includes(activeTag));
  }, [items, activeTag]);

  const greetingName = me?.display_name?.trim() || me?.email?.split('@')[0] || 'traveler';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Discover</Text>
          <Text style={styles.greeting} numberOfLines={2}>
            Where to next, {greetingName}?
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={onLogout}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {greetingName.slice(0, 1).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search saved links"
        placeholderTextColor={colors.textMuted}
        value={q}
        onChangeText={(text) => {
          setQ(text);
          void load(text);
        }}
      />

      {allTags.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagRow}
        >
          <TagPill
            label="All"
            active={activeTag === ALL_TAGS_FILTER}
            onPress={() => setActiveTag(ALL_TAGS_FILTER)}
          />
          {allTags.map((t) => (
            <TagPill
              key={t}
              label={`#${t}`}
              active={activeTag === t}
              onPress={() => setActiveTag(t)}
            />
          ))}
        </ScrollView>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.feed}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(q);
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nothing saved yet. From Instagram, tap Share → Nomad.
            </Text>
          }
          renderItem={({ item }) => (
            <ItemCard item={item} onOpenItem={onOpenItem} />
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Save a new link"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

interface TagPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function TagPill({ label, active, onPress }: TagPillProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : null]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface ItemCardProps {
  item: SavedItem;
  onOpenItem: (id: string) => void;
}

function ItemCard({ item, onOpenItem }: ItemCardProps): React.ReactElement {
  const preview = previewImageUrl(item);
  const domain = sourceDomain(item.source_url || item.normalized_url);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onOpenItem(item.id)}
      activeOpacity={0.85}
    >
      <View style={styles.cardMedia}>
        {preview ? (
          <Image source={{ uri: preview }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardFallback}>
            <Text style={styles.cardFallbackGlyph}>🌐</Text>
          </View>
        )}
        <View style={styles.cardScrim} />
        <View style={styles.cardOverlay}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title || item.normalized_url}
          </Text>
          <View style={styles.cardMetaRow}>
            <Text style={styles.cardDomain} numberOfLines={1}>
              {domain}
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL(item.source_url)}>
              <Text style={styles.cardOpen}>Open ↗</Text>
            </TouchableOpacity>
          </View>
          {item.tags.length > 0 ? (
            <View style={styles.cardTagRow}>
              {item.tags.slice(0, 4).map((t) => {
                const c = tagChipColor(t);
                return (
                  <View key={t} style={[styles.cardTag, { backgroundColor: c.bg }]}>
                    <Text style={[styles.cardTagText, { color: c.fg }]}>#{t}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  greeting: { ...typography.display },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
    marginTop: spacing.sm,
  },
  avatarText: { ...typography.title, fontSize: 18 },
  search: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...elevation.card,
  },
  tagRow: {
    paddingBottom: spacing.lg,
    paddingRight: spacing.lg,
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  pillText: { ...typography.caption, color: colors.text },
  pillTextActive: { color: colors.background },
  feed: { paddingBottom: 96 },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  cardMedia: {
    width: '100%',
    aspectRatio: 16 / 10,
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  cardFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFallbackGlyph: { fontSize: 56 },
  cardScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    backgroundColor: colors.scrim,
  },
  cardOverlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
  cardTitle: {
    ...typography.title,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardDomain: { ...typography.caption, color: '#F0E9DD', flex: 1, marginRight: spacing.sm },
  cardOpen: { ...typography.caption, color: '#FFFFFF', fontWeight: '600' },
  cardTagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  cardTag: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginTop: spacing.xs,
  },
  cardTagText: { fontSize: 12, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.fab,
  },
  fabText: { color: colors.primaryText, fontSize: 30, lineHeight: 32, fontWeight: '300' },
});
