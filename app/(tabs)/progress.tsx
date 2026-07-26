import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { StatsCharts } from '@/components/progress/StatsCharts';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { chartColors, fonts, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgress } from '@/hooks/useProgress';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function ProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { progress, isLoading, error, reload } = useProgress(user?.id);

  if (isLoading) {
    return (
      <Screen style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ErrorState message={error} onRetry={reload} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...colors.heroGradient]} style={styles.hero}>
          <Text style={[styles.kicker, { color: chartColors.mint, fontFamily: fonts.bodyBold }]}>
            ACUMEN PULSE
          </Text>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
            {progress.xp.toLocaleString()} XP
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Your learning signal — streaks, scores, mastery.
          </Text>
        </LinearGradient>

        <View style={styles.kpiRow}>
          <GlassCard accent="amber" style={styles.kpi}>
            <Text style={[styles.kpiValue, { color: chartColors.amber, fontFamily: fonts.display }]}>
              {progress.streak}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontFamily: fonts.body }]}>
              streak
            </Text>
          </GlassCard>
          <GlassCard accent="cyan" style={styles.kpi}>
            <Text style={[styles.kpiValue, { color: chartColors.cyan, fontFamily: fonts.display }]}>
              {progress.cardsStudied}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontFamily: fonts.body }]}>
              cards
            </Text>
          </GlassCard>
          <GlassCard accent="pink" style={styles.kpi}>
            <Text style={[styles.kpiValue, { color: chartColors.pink, fontFamily: fonts.display }]}>
              {progress.quizzesTaken}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontFamily: fonts.body }]}>
              quizzes
            </Text>
          </GlassCard>
        </View>

        <View style={styles.quickLinks}>
          <Pressable
            onPress={() => router.push('/badges')}
            style={[styles.quickLink, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="ribbon-outline" size={18} color={chartColors.amber} />
            <Text style={[styles.quickLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              Badges
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/leaderboard')}
            style={[styles.quickLink, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="trophy-outline" size={18} color={chartColors.pink} />
            <Text style={[styles.quickLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              Leaderboard
            </Text>
          </Pressable>
        </View>

        <StatsCharts progress={progress} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            Recent quizzes
          </Text>
          {progress.recentQuizzes.length === 0 ? (
            <EmptyState
              title="No quizzes yet"
              message="Run a practice or timed quiz to light up your trend line."
            />
          ) : (
            progress.recentQuizzes.slice(0, 5).map((quiz) => {
              const pct =
                quiz.totalQuestions > 0
                  ? Math.round((quiz.score / quiz.totalQuestions) * 100)
                  : 0;
              return (
                <View
                  key={quiz.id}
                  style={[styles.quizRow, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.quizInfo}>
                    <Text
                      style={[styles.quizTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
                    >
                      {quiz.deckTitle}
                    </Text>
                    <Text
                      style={[styles.quizDate, { color: colors.textSecondary, fontFamily: fonts.body }]}
                    >
                      {formatDate(quiz.completedAt)} · {quiz.score}/{quiz.totalQuestions}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.quizScore,
                      {
                        color: pct >= 70 ? chartColors.mint : chartColors.pink,
                        fontFamily: fonts.displayBold,
                      },
                    ]}
                  >
                    {pct}%
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 110,
    gap: spacing.md,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  kicker: {
    fontSize: fontSize.xs,
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 42,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  kpi: {
    flex: 1,
  },
  kpiValue: {
    fontSize: fontSize.xl,
  },
  kpiLabel: {
    fontSize: fontSize.xs,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  quickLink: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  quickLabel: {
    fontSize: fontSize.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
  },
  quizRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  quizInfo: {
    flex: 1,
    gap: 2,
  },
  quizTitle: {
    fontSize: fontSize.md,
  },
  quizDate: {
    fontSize: fontSize.sm,
  },
  quizScore: {
    fontSize: fontSize.lg,
  },
});
