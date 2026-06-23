import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { colors, fontSize, spacing } from '@/constants/theme';
import type { QuizAnswer } from '@/lib/quiz';

type QuizResultsProps = {
  deckTitle: string;
  score: number;
  total: number;
  answers: QuizAnswer[];
  onRetry: () => void;
  onDone: () => void;
};

export function QuizResults({ deckTitle, score, total, answers, onRetry, onDone }: QuizResultsProps) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryCard}>
        <Text style={styles.title}>Quiz complete</Text>
        <Text style={styles.subtitle}>{deckTitle}</Text>
        <Text style={styles.score}>
          {score} / {total}
        </Text>
        <Text style={styles.percent}>{percent}% correct</Text>
      </View>

      <Text style={styles.reviewTitle}>Review answers</Text>
      <View style={styles.reviewList}>
        {answers.map((answer, index) => (
          <View key={`${answer.questionId}-${index}`} style={styles.reviewItem}>
            <Text style={styles.question}>{index + 1}. {answer.prompt}</Text>
            <Text style={[styles.answerLine, answer.isCorrect ? styles.correct : styles.wrong]}>
              Your answer: {answer.selected}
            </Text>
            {!answer.isCorrect ? (
              <Text style={styles.correctLine}>Correct: {answer.correctAnswer}</Text>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Try again" onPress={onRetry} />
        <Button label="Back to deck" onPress={onDone} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  score: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  percent: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  reviewTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  reviewList: {
    gap: spacing.sm,
  },
  reviewItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  question: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  answerLine: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  correct: {
    color: colors.success,
  },
  wrong: {
    color: colors.error,
  },
  correctLine: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.sm,
  },
});
