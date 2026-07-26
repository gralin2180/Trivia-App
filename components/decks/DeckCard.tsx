import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getDifficultyBadge } from '@/lib/gamification';
import type { DeckWithCardCount } from '@/types/database';

type DeckCardProps = {
  deck: DeckWithCardCount;
  progress?: number;
  onPress: () => void;
};

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function DeckCard({ deck, progress = 0, onPress }: DeckCardProps) {
  const { colors } = useTheme();
  const percent = Math.round(progress * 100);
  const badge = getDifficultyBadge(percent);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.mark, { backgroundColor: colors.surfaceHighlight }]}>
        <Text style={[styles.markText, { color: colors.primary, fontFamily: fonts.display }]}>
          {initials(deck.title) || 'A'}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]} numberOfLines={1}>
            {deck.title}
          </Text>
          <Text style={[styles.badge, { color: colors.textSecondary, fontFamily: fonts.bodyMedium }]}>
            {badge}
          </Text>
        </View>

        {deck.description ? (
          <Text style={[styles.description, { color: colors.textMuted, fontFamily: fonts.body }]} numberOfLines={1}>
            {deck.description}
          </Text>
        ) : null}

        <ProgressBar progress={progress} height={6} gradient={colors.primaryGradient} />

        <View style={styles.bottom}>
          <Text style={[styles.meta, { color: colors.textSecondary, fontFamily: fonts.body }]}>
            {deck.card_count} cards · {percent}%
          </Text>
          <Text style={[styles.open, { color: colors.primary, fontFamily: fonts.bodyBold }]}>Open</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    fontSize: fontSize.md,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
  },
  badge: {
    fontSize: fontSize.xs,
  },
  description: {
    fontSize: fontSize.sm,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: fontSize.xs,
  },
  open: {
    fontSize: fontSize.sm,
  },
});
