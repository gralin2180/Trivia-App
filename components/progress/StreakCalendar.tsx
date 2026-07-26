import { StyleSheet, Text, View } from 'react-native';

import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { StreakDay } from '@/lib/gamification';

type StreakCalendarProps = {
  days: StreakDay[];
  streak: number;
};

export function StreakCalendar({ days, streak }: StreakCalendarProps) {
  const { colors } = useTheme();
  const week = days.slice(-7);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>
          This week
        </Text>
        <Text style={[styles.streakText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
          {streak} day streak
        </Text>
      </View>

      <View style={styles.grid}>
        {week.map((day) => (
          <View key={day.date} style={styles.dayCol}>
            <Text
              style={[
                styles.weekday,
                { color: day.isToday ? colors.primary : colors.textSecondary, fontFamily: fonts.bodyMedium },
              ]}
            >
              {day.weekday}
            </Text>
            <View
              style={[
                styles.dayDot,
                {
                  backgroundColor: day.active ? colors.primary : colors.surfaceHighlight,
                  borderColor: day.isToday ? colors.primary : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  {
                    color: day.active ? colors.textOnPrimary : colors.textSecondary,
                    fontFamily: fonts.bodyBold,
                  },
                ]}
              >
                {day.dayNum}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.lg,
  },
  streakText: {
    fontSize: fontSize.sm,
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
  },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontSize: 12,
  },
});
