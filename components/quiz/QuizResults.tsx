import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontSize, game, gradients, radius, spacing } from '@/constants/theme';
import { getQuizXpEarned } from '@/lib/gamification';
import type { QuizAnswer } from '@/lib/quiz';

type QuizResultsProps = {
  deckTitle: string;
  score: number;
  total: number;
  answers: QuizAnswer[];
  onRetry: () => void;
  onDone: () => void;
};

export function QuizResults({
  deckTitle,
  score,
  total,
  answers,
  onRetry,
  onDone,
}: QuizResultsProps) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const xpEarned = getQuizXpEarned(score, total);
  const isPerfect = score === total && total > 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={isPerfect ? ['#1A3D0A', '#0D2812'] : [...gradients.hero]}
        style={styles.summaryCard}
      >
        <Text style={styles.celebration}>{isPerfect ? '🏆' : percent >= 70 ? '🎉' : '💪'}</Text>
        <Text style={styles.title}>{isPerfect ? 'PERFECT!' : 'Quiz Complete!'}</Text>
        <Text style={styles.subtitle}>{deckTitle}</Text>

        <Text style={styles.score}>
          {score}/{total}
        </Text>
        <Text style={styles.percent}>{percent}% correct</Text>

        <View style={styles.xpBanner}>
          <Text style={styles.xpText}>+{xpEarned} XP earned!</Text>
        </View>

        <ProgressBar progress={percent / 100} height={10} gradient={gradients.xp} />
      </LinearGradient>

      <Text style={styles.reviewTitle}>📋 Review answers</Text>
      <View style={styles.reviewList}>
        {answers.map((answer, index) => (
          <View
            key={`${answer.questionId}-${index}`}
            style={[
              styles.reviewItem,
              answer.isCorrect ? styles.reviewCorrect : styles.reviewWrong,
            ]}
          >
            <Text style={styles.question}>
              {answer.isCorrect ? '✅' : '❌'} {index + 1}. {answer.prompt}
            </Text>
            {!answer.isCorrect ? (
              <Text style={styles.correctLine}>Answer: {answer.correctAnswer}</Text>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Try again" onPress={onRetry} icon="🔄" />
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
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  celebration: {
    fontSize: 56,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  score: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  percent: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontWeight: '600',
  },
  xpBanner: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: colors.xp,
  },
  xpText: {
    color: colors.xp,
    fontWeight: '800',
    fontSize: fontSize.md,
  },
  reviewTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  reviewList: {
    gap: spacing.sm,
  },
  reviewItem: {
    borderRadius: radius.md,
    borderWidth: 2,
    padding: spacing.md,
    gap: spacing.xs,
  },
  reviewCorrect: {
    backgroundColor: colors.successBg,
    borderColor: colors.success + '44',
  },
  reviewWrong: {
    backgroundColor: colors.errorBg,
    borderColor: colors.error + '44',
  },
  question: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  correctLine: {
    fontSize: fontSize.sm,
    color: colors.success,
    lineHeight: 20,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.sm,
  },
});
