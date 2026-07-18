import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ConfettiOverlay } from '@/components/ui/ConfettiOverlay';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontSize, gradients, radius, spacing } from '@/constants/theme';
import { getLevelInfo, getQuizXpEarned } from '@/lib/gamification';
import { playSound } from '@/lib/sounds';
import type { QuizAnswer } from '@/lib/quiz';

type QuizResultsProps = {
  deckTitle: string;
  score: number;
  total: number;
  answers: QuizAnswer[];
  levelUp?: boolean;
  xpBefore?: number;
  timed?: boolean;
  practice?: boolean;
  onRetry: () => void;
  onDone: () => void;
};

export function QuizResults({
  deckTitle,
  score,
  total,
  answers,
  levelUp = false,
  xpBefore = 0,
  timed = false,
  practice = false,
  onRetry,
  onDone,
}: QuizResultsProps) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const xpEarned = getQuizXpEarned(score, total, { timed });
  const isPerfect = score === total && total > 0;
  const showConfetti = isPerfect || levelUp;
  const [confettiVisible, setConfettiVisible] = useState(showConfetti);
  const newLevel = getLevelInfo(xpBefore + xpEarned).level;

  useEffect(() => {
    if (levelUp) {
      playSound('levelUp');
    } else if (isPerfect) {
      playSound('perfect');
    } else {
      playSound('complete');
    }
  }, [isPerfect, levelUp]);

  return (
    <View style={styles.wrapper}>
      <ConfettiOverlay
        visible={confettiVisible}
        onFinish={() => setConfettiVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isPerfect ? ['#1A3D0A', '#0D2812'] : [...gradients.hero]}
          style={styles.summaryCard}
        >
          <Text style={styles.celebration}>
            {levelUp ? '⬆️' : isPerfect ? '🏆' : percent >= 70 ? '🎉' : '💪'}
          </Text>
          <Text style={styles.title}>
            {levelUp ? 'LEVEL UP!' : isPerfect ? 'PERFECT!' : 'Quiz Complete!'}
          </Text>
          <Text style={styles.subtitle}>{deckTitle}</Text>
          {timed ? (
            <Text style={styles.modeNote}>⏱️ Timed bonus XP applied</Text>
          ) : null}
          {practice ? (
            <Text style={styles.modeNote}>🛡️ Practice mode — no hearts lost</Text>
          ) : null}

          {levelUp ? (
            <View style={styles.levelUpBanner}>
              <Text style={styles.levelUpText}>You reached Level {newLevel}!</Text>
            </View>
          ) : null}

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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
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
  modeNote: {
    fontSize: fontSize.sm,
    color: colors.xp,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  levelUpBanner: {
    backgroundColor: colors.secondary + '33',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.secondary,
    marginTop: spacing.xs,
  },
  levelUpText: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: fontSize.md,
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
