import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontSize, gradients, spacing } from '@/constants/theme';

type DailyGoalRingProps = {
  dailyXp: number;
  goalXp: number;
  streak: number;
};

export function DailyGoalRing({ dailyXp, goalXp, streak }: DailyGoalRingProps) {
  const clamped = Math.min(dailyXp, goalXp);
  const progress = clamped / Math.max(goalXp, 1);
  const done = dailyXp >= goalXp;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{done ? 'Daily goal done' : 'Daily XP goal'}</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {streak}</Text>
        </View>
      </View>

      <View style={styles.xpRow}>
        <Text style={styles.xpCurrent}>{clamped}</Text>
        <Text style={styles.xpDivider}> / </Text>
        <Text style={styles.xpGoal}>{goalXp} XP</Text>
      </View>

      <ProgressBar progress={progress} height={14} gradient={gradients.primary} />

      <Text style={styles.subtitle}>
        {done ? 'Nice work — come back tomorrow.' : `${goalXp - clamped} XP left today`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary + '55',
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.md,
  },
  streakBadge: {
    backgroundColor: colors.streak + '22',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.streak,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  streakText: {
    color: colors.streak,
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  xpCurrent: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 36,
    lineHeight: 40,
  },
  xpDivider: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: fontSize.lg,
  },
  xpGoal: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: fontSize.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
