import { StyleSheet, Text, View } from 'react-native';

import { GameCard } from '@/components/ui/GameCard';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { StreakDay } from '@/lib/gamification';

type StreakCalendarProps = {
  days: StreakDay[];
  streak: number;
};

export function StreakCalendar({ days, streak }: StreakCalendarProps) {
  // Show one week on mobile so dots don't overflow
  const week = days.slice(-7);

  return (
    <GameCard variant="quest">
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Streak</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{streak} days</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>This week’s activity</Text>

      <View style={styles.grid}>
        {week.map((day) => (
          <View key={day.date} style={styles.dayCol}>
            <Text style={[styles.weekday, day.isToday && styles.weekdayToday]}>
              {day.weekday}
            </Text>
            <View
              style={[
                styles.dayDot,
                day.active && styles.dayActive,
                day.isToday && styles.dayToday,
              ]}
            >
              <Text style={[styles.dayNum, day.active && styles.dayNumActive]}>
                {day.active ? '🔥' : day.dayNum}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  streakBadge: {
    backgroundColor: colors.streak + '33',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.streak,
  },
  streakText: {
    color: colors.streak,
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  weekdayToday: {
    color: colors.streak,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: {
    backgroundColor: colors.streak + '33',
    borderColor: colors.streak,
  },
  dayToday: {
    borderColor: colors.primary,
  },
  dayNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayNumActive: {
    fontSize: 14,
  },
});
