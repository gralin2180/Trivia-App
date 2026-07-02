import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Flashcard } from '@/components/study/Flashcard';
import { StudyProgressBar } from '@/components/study/StudyProgressBar';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, gradients, radius, spacing } from '@/constants/theme';
import { getStudyXpEarned } from '@/lib/gamification';
import { difficultyLabel } from '@/lib/cards';
import { useDeck } from '@/hooks/useDeck';
import { useStudySession } from '@/hooks/useStudySession';

export default function StudyScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { user } = useAuth();
  const { deck, isLoading, error, reload } = useDeck(deckId);
  const study = useStudySession(deckId, deck?.cards ?? [], user?.id);

  if (isLoading || study.phase === 'loading') {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (error || !deck) {
    return (
      <Screen>
        <ErrorState message={error ?? study.error ?? 'Deck not found.'} onRetry={reload} />
      </Screen>
    );
  }

  if (study.error) {
    return (
      <Screen>
        <ErrorState message={study.error} onRetry={reload} />
      </Screen>
    );
  }

  if (study.phase === 'complete') {
    const totalReviewed = study.stats.correct + study.stats.wrong;
    const xpEarned = getStudyXpEarned(totalReviewed);

    return (
      <Screen style={styles.completeScreen}>
        <LinearGradient colors={[...gradients.hero]} style={styles.completeCard}>
          <Text style={styles.celebration}>🎉</Text>
          <Text style={styles.completeTitle}>Session Complete!</Text>
          <Text style={styles.completeSubtitle}>{deck.title}</Text>

          <View style={styles.xpBanner}>
            <Text style={styles.xpText}>+{xpEarned} XP earned!</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, styles.statCorrect]}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statValue}>{study.stats.correct}</Text>
              <Text style={styles.statLabel}>Got it!</Text>
            </View>
            <View style={[styles.statBox, styles.statWrong]}>
              <Text style={styles.statEmoji}>🔄</Text>
              <Text style={styles.statValue}>{study.stats.wrong}</Text>
              <Text style={styles.statLabel}>Review again</Text>
            </View>
          </View>

          <Text style={styles.note}>
            Wrong cards were re-queued. Keep your streak alive! 🔥
          </Text>

          <Button label="Back to deck" onPress={() => router.back()} icon="🏠" />
          <Button label="Study again" onPress={study.reset} variant="secondary" icon="🔄" />
        </LinearGradient>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <StudyProgressBar label={study.progressLabel} />

      {study.currentCard ? (
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficulty}>
            ⚡ Level: {difficultyLabel(study.currentCard.difficulty)}
          </Text>
        </View>
      ) : null}

      {study.currentCard ? (
        <Flashcard
          front={study.currentCard.front}
          back={study.currentCard.back}
          isFlipped={study.isFlipped}
          onFlip={study.flipCard}
        />
      ) : null}

      {study.isFlipped ? (
        <View style={styles.actions}>
          <Button label="Got it wrong" onPress={study.markWrong} variant="danger" icon="😅" />
          <Button label="Got it right!" onPress={study.markCorrect} icon="🎯" />
        </View>
      ) : (
        <Text style={styles.instruction}>👆 Flip the card to check your answer</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBadge: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.warning + '66',
  },
  difficulty: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.warning,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
  instruction: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  completeScreen: {
    justifyContent: 'center',
  },
  completeCard: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  celebration: {
    fontSize: 56,
  },
  completeTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  completeSubtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  xpBanner: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.xp,
  },
  xpText: {
    color: colors.xp,
    fontWeight: '800',
    fontSize: fontSize.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  statBox: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 2,
  },
  statCorrect: {
    backgroundColor: colors.successBg,
    borderColor: colors.success + '44',
  },
  statWrong: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
  },
  statEmoji: {
    fontSize: fontSize.lg,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  note: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
});
