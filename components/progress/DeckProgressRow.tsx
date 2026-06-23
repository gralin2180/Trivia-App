import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '@/constants/theme';
import type { DeckProgressItem } from '@/lib/progress';

type DeckProgressRowProps = {
  item: DeckProgressItem;
};

export function DeckProgressRow({ item }: DeckProgressRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.deckTitle}</Text>
        <Text style={styles.meta}>
          {item.cardsStudied}/{item.totalCards} cards
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${item.percent}%` }]} />
      </View>
      <Text style={styles.percent}>{item.percent}% studied</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  track: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  percent: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
