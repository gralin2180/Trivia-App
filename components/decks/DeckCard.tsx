import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '@/constants/theme';
import type { DeckWithCardCount } from '@/types/database';

type DeckCardProps = {
  deck: DeckWithCardCount;
  onPress: () => void;
};

export function DeckCard({ deck, onPress }: DeckCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.category}>{deck.category}</Text>
        <Text style={styles.count}>{deck.card_count} cards</Text>
      </View>
      <Text style={styles.title}>{deck.title}</Text>
      {deck.description ? <Text style={styles.description}>{deck.description}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
    borderColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  count: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
