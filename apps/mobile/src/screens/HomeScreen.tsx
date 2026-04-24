import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ApiClient, SavedItem } from '@app/api/client';
import { colors, spacing } from '@app/theme';

interface Props {
  api: ApiClient;
  onAdd: () => void;
  onOpenItem: (id: string) => void;
  onLogout: () => void;
}

export function HomeScreen({ api, onAdd, onOpenItem, onLogout }: Props): React.ReactElement {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');

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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Saved</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logout}>Log out</Text>
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
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
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
            <TouchableOpacity style={styles.card} onPress={() => onOpenItem(item.id)}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title || item.normalized_url}
              </Text>
              <Text style={styles.cardMeta}>
                {item.source_platform} · {item.item_type}
                {item.tags.length ? ` · ${item.tags.map((t) => `#${t}`).join(' ')}` : ''}
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL(item.source_url)}>
                <Text style={styles.openLink}>Open in Instagram →</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={onAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  logout: { color: colors.textMuted },
  search: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderColor: colors.border,
    borderWidth: 1,
  },
  cardTitle: { color: colors.text, fontWeight: '600', marginBottom: spacing.xs },
  cardMeta: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm },
  openLink: { color: colors.primary, fontSize: 12 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: colors.primaryText, fontSize: 28, lineHeight: 30 },
});
