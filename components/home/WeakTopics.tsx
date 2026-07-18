import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { WeakDeck } from '@/lib/gamification';

type WeakTopicsProps = {
  decks: WeakDeck[];
  onPress: (deckId: string) => void;
};

export function WeakTopics({ decks, onPress }: WeakTopicsProps) {
  if (decks.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>💪 Needs practice</Text>
      <Text style={styles.subtitle}>Retry decks where your quiz score is under 70%</Text>
      <View style={styles.list}>
        {decks.map((deck) => (
          <Pressable
            key={deck.deckId}
            onPress={() => onPress(deck.deckId)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.info}>
              <Text style={styles.deckTitle} numberOfLines={1}>
                {deck.deckTitle}
              </Text>
              <Text style={styles.meta}>Avg quiz {deck.averagePercent}%</Text>
            </View>
            <Text style={styles.cta}>Retry →</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.error + '44',
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  info: {
    flex: 1,
    gap: 2,
  },
  deckTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.md,
  },
  meta: {
    color: colors.error,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  cta: {
    color: colors.primary,
    fontWeight: '800',
  },
});
