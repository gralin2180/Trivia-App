import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { QuizOptionButton } from '@/components/quiz/QuizOptionButton';
import { QuizResults } from '@/components/quiz/QuizResults';
import { StudyProgressBar } from '@/components/study/StudyProgressBar';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { HeartsBar } from '@/components/ui/HeartsBar';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, game, spacing } from '@/constants/theme';
import { didLevelUp, getQuizXpEarned } from '@/lib/gamification';
import { useDeck } from '@/hooks/useDeck';
import { useProgress } from '@/hooks/useProgress';
import { useQuiz } from '@/hooks/useQuiz';
import { playSound } from '@/lib/sounds';

type QuizMode = 'normal' | 'practice' | 'timed';

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

function parseMode(value: string | string[] | undefined): QuizMode {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'practice' || raw === 'timed') return raw;
  return 'normal';
}

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ deckId: string; mode?: string }>();
  const mode = parseMode(params.mode);
  const { user } = useAuth();
  const { deck, isLoading, error, reload } = useDeck(params.deckId);
  const { progress } = useProgress(user?.id);
  const quiz = useQuiz(params.deckId, deck?.cards ?? [], user?.id, mode);

  const [hearts, setHearts] = useState(game.maxHearts);
  const [combo, setCombo] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(game.timedSecondsPerQuestion);
  const lastAnswerRef = useRef<string | null>(null);
  const timedOutRef = useRef(false);

  const isPractice = mode === 'practice';
  const isTimed = mode === 'timed';

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
    playSound(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setCombo((c) => c + 1);
    } else {
      if (!isPractice) setHearts((h) => Math.max(0, h - 1));
      setCombo(0);
    }
  }, [quiz.selectedOption, quiz.currentQuestion, isPractice]);

  useEffect(() => {
    if (quiz.phase === 'quiz' && quiz.currentIndex === 0 && !quiz.selectedOption) {
      setHearts(game.maxHearts);
      setCombo(0);
      lastAnswerRef.current = null;
      timedOutRef.current = false;
      setSecondsLeft(game.timedSecondsPerQuestion);
    }
  }, [quiz.phase, quiz.currentIndex, quiz.selectedOption]);

  // Reset timer each question in timed mode
  useEffect(() => {
    if (!isTimed || quiz.phase !== 'quiz' || quiz.selectedOption) return;
    timedOutRef.current = false;
    setSecondsLeft(game.timedSecondsPerQuestion);
  }, [isTimed, quiz.phase, quiz.currentIndex, quiz.selectedOption, quiz.currentQuestion?.id]);

  useEffect(() => {
    if (!isTimed || quiz.phase !== 'quiz' || quiz.selectedOption || !quiz.currentQuestion) {
      return;
    }

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!timedOutRef.current && !quiz.selectedOption) {
            timedOutRef.current = true;
            // Force a "wrong" empty selection by picking a wrong option
            const wrong =
              quiz.currentQuestion!.options.find(
                (opt) => opt !== quiz.currentQuestion!.correctAnswer,
              ) ?? quiz.currentQuestion!.options[0];
            quiz.selectOption(wrong);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [
    isTimed,
    quiz.phase,
    quiz.selectedOption,
    quiz.currentQuestion,
    quiz.currentIndex,
    quiz,
  ]);

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
    const xpEarned = getQuizXpEarned(quiz.score, quiz.total, { timed: isTimed });
    const levelUp = didLevelUp(progress.xp, xpEarned);

    return (
      <Screen style={styles.screen}>
        <QuizResults
          deckTitle={deck.title}
          score={quiz.score}
          total={quiz.total}
          answers={quiz.answers}
          levelUp={levelUp}
          xpBefore={progress.xp}
          timed={isTimed}
          practice={isPractice}
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          {isPractice ? (
            <View style={styles.modeChip}>
              <Text style={styles.modeChipText}>🛡️ Practice · no hearts</Text>
            </View>
          ) : (
            <HeartsBar hearts={hearts} />
          )}
          {isTimed ? (
            <View style={[styles.timerChip, secondsLeft <= 3 && styles.timerUrgent]}>
              <Text style={styles.timerText}>⏱️ {secondsLeft}s</Text>
            </View>
          ) : combo >= 2 ? (
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
                : timedOutRef.current
                  ? '⏰ Time’s up!'
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
          <Text style={styles.hint}>
            {isTimed ? 'Answer before the timer hits zero!' : 'Pick the best answer!'}
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
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
  modeChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipText: {
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
  timerChip: {
    backgroundColor: colors.secondary + '33',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  timerUrgent: {
    backgroundColor: colors.error + '33',
    borderColor: colors.error,
  },
  timerText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.sm,
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
