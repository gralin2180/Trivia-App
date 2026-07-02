import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontSize, gradients, radius, spacing } from '@/constants/theme';
import type { DeckProgressItem } from '@/lib/progress';

type DeckProgressRowProps = {
  item: DeckProgressItem;
};

export function DeckProgressRow({ item }: DeckProgressRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.title}>🃏 {item.deckTitle}</Text>
        <Text style={styles.percent}>{item.percent}%</Text>
      </View>
      <ProgressBar progress={item.percent / 100} height={10} gradient={gradients.primary} />
      <Text style={styles.meta}>
        {item.cardsStudied}/{item.totalCards} cards studied
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
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
    fontWeight: '700',
    color: colors.text,
  },
  percent: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.primary,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
