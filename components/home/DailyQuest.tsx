import { StyleSheet, Text, View } from 'react-native';

import { GameCard } from '@/components/ui/GameCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontSize, game, gradients, spacing } from '@/constants/theme';

type DailyQuestProps = {
  cardsStudied: number;
  goal?: number;
};

export function DailyQuest({ cardsStudied, goal = game.dailyGoal }: DailyQuestProps) {
  const progress = Math.min(cardsStudied / goal, 1);
  const isComplete = cardsStudied >= goal;

  return (
    <GameCard variant="quest">
      <View style={styles.header}>
        <Text style={styles.badge}>⚔️ DAILY QUEST</Text>
        {isComplete ? (
          <View style={styles.completeBadge}>
            <Text style={styles.completeText}>✓ DONE</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title}>Study {goal} cards today</Text>
      <Text style={styles.reward}>Reward: ⭐ +{game.xpPerDailyQuest} XP</Text>

      <ProgressBar progress={progress} height={14} gradient={gradients.xp} />

      <Text style={styles.progress}>
        {Math.min(cardsStudied, goal)} / {goal} cards
        {isComplete ? ' — Quest complete! 🎉' : ''}
      </Text>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badge: {
    color: colors.warning,
    fontWeight: '800',
    fontSize: fontSize.sm,
    letterSpacing: 1,
  },
  completeBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.success,
  },
  completeText: {
    color: colors.success,
    fontWeight: '800',
    fontSize: fontSize.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  reward: {
    color: colors.xp,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  progress: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
});
