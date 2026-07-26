import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { chartColors, fonts, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgress } from '@/hooks/useProgress';

const CATEGORY_LABEL: Record<string, string> = {
  starter: 'Starter',
  study: 'Study',
  streak: 'Streaks',
  quiz: 'Quizzes',
  legend: 'Legend',
};

export default function BadgesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { progress } = useProgress(user?.id);

  const unlockedCount = progress.achievements.filter((a) => a.unlocked).length;
  const grouped = useMemo(() => {
    const map = new Map<string, typeof progress.achievements>();
    for (const badge of progress.achievements) {
      const list = map.get(badge.category) ?? [];
      list.push(badge);
      map.set(badge.category, list);
    }
    return [...map.entries()];
  }, [progress.achievements]);

  return (
    <Screen style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text, fontFamily: fonts.bodyMedium }]}>
            Back
          </Text>
        </Pressable>

        <Text style={[styles.kicker, { color: chartColors.amber, fontFamily: fonts.bodyBold }]}>
          BADGES
        </Text>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
          Your collection
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
          {unlockedCount}/{progress.achievements.length} unlocked — keep learning to earn more.
        </Text>

        {grouped.map(([category, badges]) => (
          <View key={category} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: fonts.bodyBold }]}>
              {(CATEGORY_LABEL[category] ?? category).toUpperCase()}
            </Text>
            <View style={styles.grid}>
              {badges.map((badge) => (
                <GlassCard
                  key={badge.id}
                  accent={badge.unlocked ? 'amber' : 'none'}
                  style={{
                    width: '47%',
                    flexGrow: 1,
                    minWidth: 140,
                    opacity: badge.unlocked ? 1 : 0.7,
                  }}
                >
                  <Text style={styles.icon}>{badge.unlocked ? badge.icon : '🔒'}</Text>
                  <Text
                    style={[
                      styles.label,
                      {
                        color: badge.unlocked ? colors.text : colors.textSecondary,
                        fontFamily: fonts.bodyBold,
                      },
                    ]}
                  >
                    {badge.label}
                  </Text>
                  <Text
                    style={[styles.desc, { color: colors.textMuted, fontFamily: fonts.body }]}
                    numberOfLines={3}
                  >
                    {badge.description}
                  </Text>
                </GlassCard>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    paddingBottom: 48,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.sm },
  kicker: { fontSize: fontSize.xs, letterSpacing: 1.4, marginTop: spacing.sm },
  title: { fontSize: fontSize.display, letterSpacing: -0.6 },
  subtitle: { fontSize: fontSize.md, lineHeight: 22 },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSize.xs, letterSpacing: 1.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  icon: { fontSize: 28 },
  label: { fontSize: fontSize.sm },
  desc: { fontSize: fontSize.xs, lineHeight: 16 },
});
