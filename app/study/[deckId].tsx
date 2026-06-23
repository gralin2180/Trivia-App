import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Flashcard } from '@/components/study/Flashcard';
import { StudyProgressBar } from '@/components/study/StudyProgressBar';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, spacing } from '@/constants/theme';
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
    return (
      <Screen style={styles.completeScreen}>
        <View style={styles.completeCard}>
          <Text style={styles.completeTitle}>Session complete</Text>
          <Text style={styles.completeSubtitle}>{deck.title}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{study.stats.correct}</Text>
              <Text style={styles.statLabel}>Got it</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{study.stats.wrong}</Text>
              <Text style={styles.statLabel}>Review again</Text>
            </View>
          </View>
          <Text style={styles.note}>
            Wrong cards were re-queued this session. Correct answers schedule easier reviews later.
          </Text>
          <Button label="Back to deck" onPress={() => router.back()} />
          <Button label="Study again" onPress={study.reset} variant="secondary" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <StudyProgressBar label={study.progressLabel} />

      {study.currentCard ? (
        <Text style={styles.difficulty}>
          Level: {difficultyLabel(study.currentCard.difficulty)}
        </Text>
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
          <Button
            label="Got it wrong"
            onPress={study.markWrong}
            variant="secondary"
          />
          <Button label="Got it right" onPress={study.markCorrect} />
        </View>
      ) : (
        <Text style={styles.instruction}>Flip the card before marking your answer.</Text>
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
  actions: {
    gap: spacing.sm,
  },
  instruction: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  difficulty: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  completeScreen: {
    justifyContent: 'center',
  },
  completeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  completeTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  note: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
});
