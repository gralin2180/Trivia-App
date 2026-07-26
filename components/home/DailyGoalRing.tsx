import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { fonts, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type DailyGoalRingProps = {
  dailyXp: number;
  goalXp: number;
  streak: number;
};

export function DailyGoalRing({ dailyXp, goalXp, streak }: DailyGoalRingProps) {
  const { colors } = useTheme();
  const clamped = Math.min(dailyXp, goalXp);
  const progress = clamped / Math.max(goalXp, 1);
  const done = dailyXp >= goalXp;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary + '55',
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bodyBold }]}>
          {done ? 'Daily goal done' : 'Daily XP goal'}
        </Text>
        <View
          style={[
            styles.streakBadge,
            { backgroundColor: colors.streak + '22', borderColor: colors.streak },
          ]}
        >
          <Text style={[styles.streakText, { color: colors.streak, fontFamily: fonts.bodyBold }]}>
            {streak} day streak
          </Text>
        </View>
      </View>

      <View style={styles.xpRow}>
        <Text style={[styles.xpCurrent, { color: colors.primary, fontFamily: fonts.display }]}>
          {clamped}
        </Text>
        <Text style={[styles.xpDivider, { color: colors.textMuted }]}> / </Text>
        <Text style={[styles.xpGoal, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
          {goalXp} XP
        </Text>
      </View>

      <ProgressBar progress={progress} height={14} gradient={colors.primaryGradient} />

      <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
        {done ? 'Nice work — come back tomorrow.' : `${goalXp - clamped} XP left today`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    borderWidth: 2,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    flexShrink: 1,
  },
  streakBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  streakText: {
    fontSize: fontSize.xs,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  xpCurrent: {
    fontSize: 36,
    lineHeight: 40,
  },
  xpDivider: {
    fontWeight: '700',
    fontSize: fontSize.lg,
  },
  xpGoal: {
    fontSize: fontSize.lg,
  },
  subtitle: {
    fontSize: fontSize.sm,
  },
});
