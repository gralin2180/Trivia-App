import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { QuizOptionButton } from '@/components/quiz/QuizOptionButton';
import { QuizResults } from '@/components/quiz/QuizResults';
import { StudyProgressBar } from '@/components/study/StudyProgressBar';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { HeartsBar } from '@/components/ui/HeartsBar';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, game, spacing } from '@/constants/theme';
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

  const [hearts, setHearts] = useState(game.maxHearts);
  const [combo, setCombo] = useState(0);
  const lastAnswerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!quiz.selectedOption || !quiz.currentQuestion) return;
    if (lastAnswerRef.current === quiz.selectedOption) return;
    lastAnswerRef.current = quiz.selectedOption;

    const isCorrect = quiz.selectedOption === quiz.currentQuestion.correctAnswer;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        isCorrect
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    }
    if (isCorrect) {
      setCombo((c) => c + 1);
    } else {
      setHearts((h) => Math.max(0, h - 1));
      setCombo(0);
    }
  }, [quiz.selectedOption, quiz.currentQuestion]);

  useEffect(() => {
    if (quiz.phase === 'quiz' && quiz.currentIndex === 0 && !quiz.selectedOption) {
      setHearts(game.maxHearts);
      setCombo(0);
      lastAnswerRef.current = null;
    }
  }, [quiz.phase, quiz.currentIndex, quiz.selectedOption]);

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
      <View style={styles.topBar}>
        <HeartsBar hearts={hearts} />
        {combo >= 2 ? (
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>🔥 {combo}x combo!</Text>
          </View>
        ) : (
          <View />
        )}
      </View>

      <StudyProgressBar label={quiz.progressLabel} />

      <View style={styles.questionCard}>
        <Text style={styles.label}>Question</Text>
        <Text style={styles.prompt}>{question.prompt}</Text>
      </View>

      <View style={styles.options}>
        {question.options.map((option, index) => (
          <QuizOptionButton
            key={`${question.id}-${index}`}
            index={index}
            label={option}
            onPress={() => quiz.selectOption(option)}
            disabled={quiz.selectedOption !== null}
            state={getOptionState(option, quiz.selectedOption, question.correctAnswer)}
          />
        ))}
      </View>

      {quiz.selectedOption ? (
        <View style={styles.footer}>
          <Text
            style={[
              styles.feedback,
              quiz.selectedOption === question.correctAnswer
                ? styles.feedbackCorrect
                : styles.feedbackWrong,
            ]}
          >
            {quiz.selectedOption === question.correctAnswer
              ? combo >= 2
                ? `🔥 ${combo}x combo! Amazing!`
                : '✅ Correct! Nice one!'
              : '❌ Not quite — check the green answer.'}
          </Text>
          <Button
            label={
              quiz.isSaving
                ? 'Saving...'
                : quiz.answers.length === quiz.total
                  ? 'See results 🏆'
                  : 'Next question →'
            }
            onPress={quiz.goNext}
          />
        </View>
      ) : (
        <Text style={styles.hint}>Pick the best answer!</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comboBadge: {
    backgroundColor: colors.streak + '33',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.streak,
  },
  comboText: {
    color: colors.streak,
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  prompt: {
    fontSize: fontSize.lg,
    fontWeight: '700',
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
    textAlign: 'center',
    fontWeight: '700',
  },
  feedbackCorrect: {
    color: colors.success,
  },
  feedbackWrong: {
    color: colors.error,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
});
