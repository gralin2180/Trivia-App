import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatCard } from '@/components/home/StatCard';
import { DeckProgressRow } from '@/components/progress/DeckProgressRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
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
          <StatCard label="Day streak" value={progress.streak} />
          <StatCard label="Cards studied" value={progress.cardsStudied} />
          <StatCard label="Quiz avg" value={`${progress.averageQuizPercent}%`} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deck progress</Text>
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
          <Text style={styles.sectionTitle}>Recent quizzes</Text>
          {progress.recentQuizzes.length === 0 ? (
            <Text style={styles.emptyText}>Complete a quiz to see scores here.</Text>
          ) : (
            <View style={styles.list}>
              {progress.recentQuizzes.map((quiz) => (
                <View key={quiz.id} style={styles.quizRow}>
                  <View style={styles.quizInfo}>
                    <Text style={styles.quizTitle}>{quiz.deckTitle}</Text>
                    <Text style={styles.quizDate}>{formatDate(quiz.completedAt)}</Text>
                  </View>
                  <Text style={styles.quizScore}>
                    {quiz.score}/{quiz.totalQuestions}
                  </Text>
                </View>
              ))}
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
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
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
    borderWidth: 1,
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
    fontWeight: '600',
    color: colors.text,
  },
  quizDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  quizScore: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
});
