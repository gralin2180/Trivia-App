import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatCard } from '@/components/home/StatCard';
import { DeckProgressRow } from '@/components/progress/DeckProgressRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { GameCard } from '@/components/ui/GameCard';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, spacing } from '@/constants/theme';
import { useProgress } from '@/hooks/useProgress';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function ProgressScreen() {
  const { user } = useAuth();
  const { progress, isLoading, error, reload } = useProgress(user?.id);

  if (isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={reload} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard label="Day streak" value={progress.streak} icon="🔥" accent={colors.streak} />
          <StatCard label="Cards studied" value={progress.cardsStudied} icon="🃏" accent={colors.secondary} />
          <StatCard label="Quiz avg" value={`${progress.averageQuizPercent}%`} icon="🏆" accent={colors.xp} />
        </View>

        <GameCard variant="highlight">
          <Text style={styles.levelTitle}>⭐ Level {progress.levelInfo.level}</Text>
          <Text style={styles.xpTotal}>{progress.xp} total XP earned</Text>
        </GameCard>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Deck progress</Text>
          {progress.deckProgress.length === 0 ? (
            <EmptyState
              title="No progress yet"
              message="Study or quiz a deck to start tracking your progress."
            />
          ) : (
            <View style={styles.list}>
              {progress.deckProgress.map((item) => (
                <DeckProgressRow key={item.deckId} item={item} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Recent quizzes</Text>
          {progress.recentQuizzes.length === 0 ? (
            <Text style={styles.emptyText}>Complete a quiz to see scores here.</Text>
          ) : (
            <View style={styles.list}>
              {progress.recentQuizzes.map((quiz) => {
                const pct = quiz.totalQuestions > 0
                  ? Math.round((quiz.score / quiz.totalQuestions) * 100)
                  : 0;
                return (
                  <View key={quiz.id} style={styles.quizRow}>
                    <View style={styles.quizInfo}>
                      <Text style={styles.quizTitle}>{quiz.deckTitle}</Text>
                      <Text style={styles.quizDate}>{formatDate(quiz.completedAt)}</Text>
                    </View>
                    <View style={styles.quizScoreWrap}>
                      <Text style={styles.quizScore}>{quiz.score}/{quiz.totalQuestions}</Text>
                      <Text style={[styles.quizPct, pct >= 70 ? styles.quizPctGood : styles.quizPctOk]}>
                        {pct}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.xp,
  },
  xpTotal: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  list: {
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  quizRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  quizInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  quizTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  quizDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  quizScoreWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  quizScore: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  quizPct: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  quizPctGood: {
    color: colors.success,
  },
  quizPctOk: {
    color: colors.warning,
  },
});
