import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { fonts, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { DeckProgressItem } from '@/lib/progress';

type DeckProgressRowProps = {
  item: DeckProgressItem;
};

export function DeckProgressRow({ item }: DeckProgressRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bodyBold }]} numberOfLines={1}>
          {item.deckTitle}
        </Text>
        <Text style={[styles.percent, { color: colors.primary, fontFamily: fonts.displayBold }]}>
          {item.percent}%
        </Text>
      </View>
      <ProgressBar progress={item.percent / 100} height={6} gradient={colors.primaryGradient} />
      <Text style={[styles.meta, { color: colors.textSecondary, fontFamily: fonts.body }]}>
        {item.cardsStudied}/{item.totalCards} cards studied
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
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
  },
  percent: {
    fontSize: fontSize.md,
  },
  meta: {
    fontSize: fontSize.sm,
  },
});
