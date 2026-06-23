import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { QuizOptionButton } from '@/components/quiz/QuizOptionButton';
import { QuizResults } from '@/components/quiz/QuizResults';
import { StudyProgressBar } from '@/components/study/StudyProgressBar';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, spacing } from '@/constants/theme';
import { useDeck } from '@/hooks/useDeck';
import { useQuiz } from '@/hooks/useQuiz';

function getOptionState(
  option: string,
  selectedOption: string | null,
  correctAnswer: string,
): 'default' | 'correct' | 'wrong' | 'muted' {
  if (!selectedOption) return 'default';
  if (option === correctAnswer) return 'correct';
  if (option === selectedOption) return 'wrong';
  return 'muted';
}

export default function QuizScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { user } = useAuth();
  const { deck, isLoading, error, reload } = useDeck(deckId);
  const quiz = useQuiz(deckId, deck?.cards ?? [], user?.id);

  if (isLoading || quiz.phase === 'loading') {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (error || !deck) {
    return (
      <Screen>
        <ErrorState message={error ?? quiz.error ?? 'Deck not found.'} onRetry={reload} />
      </Screen>
    );
  }

  if (quiz.error && quiz.phase !== 'results') {
    return (
      <Screen>
        <ErrorState message={quiz.error} onRetry={reload} />
      </Screen>
    );
  }

  if (quiz.phase === 'results') {
    return (
      <Screen style={styles.screen}>
        <QuizResults
          deckTitle={deck.title}
          score={quiz.score}
          total={quiz.total}
          answers={quiz.answers}
          onRetry={quiz.restart}
          onDone={() => router.back()}
        />
      </Screen>
    );
  }

  const question = quiz.currentQuestion;
  if (!question) {
    return (
      <Screen>
        <ErrorState message="No quiz questions available." onRetry={reload} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <StudyProgressBar label={quiz.progressLabel} />

      <View style={styles.questionCard}>
        <Text style={styles.label}>Question</Text>
        <Text style={styles.prompt}>{question.prompt}</Text>
      </View>

      <View style={styles.options}>
        {question.options.map((option, index) => (
          <QuizOptionButton
            key={`${question.id}-${index}`}
            label={option}
            onPress={() => quiz.selectOption(option)}
            disabled={quiz.selectedOption !== null}
            state={getOptionState(option, quiz.selectedOption, question.correctAnswer)}
          />
        ))}
      </View>

      {quiz.selectedOption ? (
        <View style={styles.footer}>
          <Text style={styles.feedback}>
            {quiz.selectedOption === question.correctAnswer ? 'Correct!' : 'Not quite — see the green answer.'}
          </Text>
          <Button
            label={quiz.isSaving ? 'Saving...' : quiz.answers.length === quiz.total ? 'See results' : 'Next question'}
            onPress={quiz.goNext}
          />
        </View>
      ) : (
        <Text style={styles.hint}>Choose the best answer.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  prompt: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 28,
  },
  options: {
    gap: spacing.sm,
  },
  footer: {
    gap: spacing.sm,
  },
  feedback: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
