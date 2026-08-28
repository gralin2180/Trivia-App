import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useDecks } from '@/hooks/useDecks';
import { fetchPublicDecks, type PublicDeck } from '@/lib/publicDecks';

type GlobalDecksProps = {
  /** How many public decks to show (after filtering own). */
  limit?: number;
};

/**
 * Shared AI decks from other users. Hides decks the current account already owns.
 */
export function GlobalDecks({ limit = 24 }: GlobalDecksProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { decks: ownDecks } = useDecks();
  const [decks, setDecks] = useState<PublicDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ownIds = useMemo(() => new Set(ownDecks.map((d) => d.id)), [ownDecks]);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicDecks(Math.max(limit, 12)).then((result) => {
      if (cancelled) return;
      setDecks(result.decks);
      setError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const visible = decks.filter((d) => !ownIds.has(d.id)).slice(0, limit);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>
          Global library
        </Text>
        <Text style={[styles.hint, { color: colors.textMuted, fontFamily: fonts.body }]}>
          Decks others generated — open without regenerating
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : error && visible.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted, fontFamily: fonts.body }]}>
          Could not load the library right now.
        </Text>
      ) : visible.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted, fontFamily: fonts.body }]}>
          No shared decks yet — generate one and it can appear here for others.
        </Text>
      ) : (
        <View style={styles.list}>
          {visible.map((deck) => (
            <Pressable
              key={deck.id}
              onPress={() => router.push(`/deck/${deck.id}`)}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
                  numberOfLines={1}
                >
                  {deck.title}
                </Text>
                <Text
                  style={[styles.rowMeta, { color: colors.textMuted, fontFamily: fonts.body }]}
                  numberOfLines={1}
                >
                  {(deck.difficulty || 'medium').toUpperCase()}
                  {deck.cardCount ? ` · ${deck.cardCount} cards` : ''}
                  {deck.reuseCount > 0 ? ` · reused ${deck.reuseCount}×` : ''}
                </Text>
              </View>
              <Text style={[styles.open, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                Open
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: fontSize.lg,
  },
  hint: {
    fontSize: fontSize.xs,
  },
  loader: {
    marginVertical: spacing.sm,
  },
  empty: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: fontSize.sm,
  },
  rowMeta: {
    fontSize: fontSize.xs,
  },
  open: {
    fontSize: fontSize.xs,
  },
});
