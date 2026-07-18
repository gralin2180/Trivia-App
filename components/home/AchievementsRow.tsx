import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';
import type { Achievement } from '@/lib/gamification';

type AchievementsRowProps = {
  achievements: Achievement[];
};

export function AchievementsRow({ achievements }: AchievementsRowProps) {
  if (achievements.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>🏅 Badges</Text>
      <View style={styles.row}>
        {achievements.map((item) => (
          <View
            key={item.id}
            style={[styles.badge, !item.unlocked && styles.locked]}
          >
            <Text style={styles.icon}>{item.unlocked ? item.icon : '🔒'}</Text>
            <Text style={[styles.label, !item.unlocked && styles.labelLocked]} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    width: '30%',
    minWidth: 96,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.xp + '55',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 4,
  },
  locked: {
    borderColor: colors.border,
    opacity: 0.55,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelLocked: {
    color: colors.textMuted,
  },
});
