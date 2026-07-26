import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { WeakDeck } from '@/lib/gamification';

type WeakTopicsProps = {
  decks: WeakDeck[];
  onPress: (deckId: string) => void;
};

export function WeakTopics({ decks, onPress }: WeakTopicsProps) {
  const { colors } = useTheme();
  if (decks.length === 0) return null;

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>
        Needs practice
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
        Decks where your quiz average is under 70%
      </Text>
      <View style={styles.list}>
        {decks.map((deck) => (
          <Pressable
            key={deck.deckId}
            onPress={() => onPress(deck.deckId)}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.info}>
              <Text
                style={[styles.deckTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
                numberOfLines={1}
              >
                {deck.deckTitle}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary, fontFamily: fonts.body }]}>
                Avg quiz {deck.averagePercent}%
              </Text>
            </View>
            <Text style={[styles.cta, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
              Retry
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  deckTitle: {
    fontSize: fontSize.md,
  },
  meta: {
    fontSize: fontSize.sm,
  },
  cta: {
    fontSize: fontSize.sm,
  },
});
