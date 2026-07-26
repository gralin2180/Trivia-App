import { StyleSheet, Text, View } from 'react-native';

import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { Achievement } from '@/lib/gamification';

type AchievementsRowProps = {
  achievements: Achievement[];
};

export function AchievementsRow({ achievements }: AchievementsRowProps) {
  const { colors } = useTheme();
  if (achievements.length === 0) return null;

  const preview = achievements.slice(0, 6);

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>
        Badges
      </Text>
      <View style={styles.row}>
        {preview.map((item) => (
          <View
            key={item.id}
            style={[
              styles.badge,
              {
                backgroundColor: colors.surface,
                borderColor: item.unlocked ? colors.xp + '66' : colors.border,
                opacity: item.unlocked ? 1 : 0.55,
              },
            ]}
          >
            <Text style={styles.icon}>{item.unlocked ? item.icon : '🔒'}</Text>
            <Text
              style={[
                styles.label,
                {
                  color: item.unlocked ? colors.text : colors.textMuted,
                  fontFamily: fonts.bodyBold,
                },
              ]}
              numberOfLines={2}
            >
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
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  title: {
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
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});
