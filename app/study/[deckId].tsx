import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Flashcard } from '@/components/study/Flashcard';
import { StudyProgressBar } from '@/components/study/StudyProgressBar';
import { Button } from '@/components/ui/Button';
import { ConfettiOverlay } from '@/components/ui/ConfettiOverlay';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, gradients, radius, spacing } from '@/constants/theme';
import { didLevelUp, getLevelInfo, getStudyXpEarned } from '@/lib/gamification';
import { difficultyLabel } from '@/lib/cards';
import { useDeck } from '@/hooks/useDeck';
import { useProgress } from '@/hooks/useProgress';
import { useStudySession } from '@/hooks/useStudySession';
import { playSound } from '@/lib/sounds';

export default function StudyScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { user } = useAuth();
  const { deck, isLoading, error, reload } = useDeck(deckId);
  const { progress } = useProgress(user?.id);
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
      <StudyCompleteView
        deckTitle={deck.title}
        correct={study.stats.correct}
        wrong={study.stats.wrong}
        xpBefore={progress.xp}
        onBack={() => router.back()}
        onReset={study.reset}
      />
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
      </ScrollView>
    </Screen>
  );
}

type StudyCompleteViewProps = {
  deckTitle: string;
  correct: number;
  wrong: number;
  xpBefore: number;
  onBack: () => void;
  onReset: () => void;
};

function StudyCompleteView({
  deckTitle,
  correct,
  wrong,
  xpBefore,
  onBack,
  onReset,
}: StudyCompleteViewProps) {
  const totalReviewed = correct + wrong;
  const xpEarned = getStudyXpEarned(totalReviewed);
  const levelUp = didLevelUp(xpBefore, xpEarned);
  const newLevel = getLevelInfo(xpBefore + xpEarned).level;
  const [confettiVisible, setConfettiVisible] = useState(levelUp);

  useEffect(() => {
    if (levelUp) {
      playSound('levelUp');
    } else {
      playSound('complete');
    }
  }, [levelUp]);

  return (
    <Screen style={styles.completeScreen}>
      <ScrollView
        contentContainerStyle={styles.completeScroll}
        showsVerticalScrollIndicator={false}
      >
        <ConfettiOverlay
          visible={confettiVisible}
          onFinish={() => setConfettiVisible(false)}
        />

        <LinearGradient colors={[...gradients.hero]} style={styles.completeCard}>
          <Text style={styles.celebration}>{levelUp ? '⬆️' : '🎉'}</Text>
          <Text style={styles.completeTitle}>
            {levelUp ? 'LEVEL UP!' : 'Session Complete!'}
          </Text>
          <Text style={styles.completeSubtitle}>{deckTitle}</Text>

          {levelUp ? (
            <View style={styles.levelUpBanner}>
              <Text style={styles.levelUpText}>You reached Level {newLevel}!</Text>
            </View>
          ) : null}

          <View style={styles.xpBanner}>
            <Text style={styles.xpText}>+{xpEarned} XP earned!</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, styles.statCorrect]}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statValue}>{correct}</Text>
              <Text style={styles.statLabel}>Got it!</Text>
            </View>
            <View style={[styles.statBox, styles.statWrong]}>
              <Text style={styles.statEmoji}>🔄</Text>
              <Text style={styles.statValue}>{wrong}</Text>
              <Text style={styles.statLabel}>Review again</Text>
            </View>
          </View>

          <Text style={styles.note}>
            Wrong cards were re-queued. Keep your streak alive! 🔥
          </Text>

          <Button label="Back to deck" onPress={onBack} icon="🏠" />
          <Button label="Study again" onPress={onReset} variant="secondary" icon="🔄" />
        </LinearGradient>
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
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  completeScroll: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  completeCard: {
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
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
  levelUpBanner: {
    backgroundColor: colors.secondary + '33',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  levelUpText: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: fontSize.md,
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
