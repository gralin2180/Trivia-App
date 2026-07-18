import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AchievementsRow } from '@/components/home/AchievementsRow';
import { ContinueLesson } from '@/components/home/ContinueLesson';
import { DailyGoalRing } from '@/components/home/DailyGoalRing';
import { OnboardingTip } from '@/components/home/OnboardingTip';
import { TopicSearch } from '@/components/home/TopicSearch';
import { WeakTopics } from '@/components/home/WeakTopics';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, spacing } from '@/constants/theme';
import { useDecks } from '@/hooks/useDecks';
import { useProgress } from '@/hooks/useProgress';
import { loadOnboardingTipSeen, saveOnboardingTipSeen } from '@/lib/settings';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { decks, isLoading, error, fromCache, reload } = useDecks();
  const { progress } = useProgress(user?.id);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    loadOnboardingTipSeen().then((seen) => {
      if (!seen) setShowTip(true);
    });
  }, []);

  async function dismissTip() {
    setShowTip(false);
    await saveOnboardingTipSeen();
  }

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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DailyGoalRing
          dailyXp={progress.dailyXp}
          goalXp={progress.dailyXpGoal}
          streak={progress.streak}
        />

        {showTip ? <OnboardingTip onDismiss={dismissTip} /> : null}

        {progress.continueDeck ? (
          <ContinueLesson
            topic={progress.continueDeck.deckTitle}
            progress={progress.continueDeck.percent}
            onPress={() => router.push(`/deck/${progress.continueDeck!.deckId}`)}
          />
        ) : null}

        <TopicSearch />

        <AchievementsRow achievements={progress.achievements} />

        <WeakTopics
          decks={progress.weakDecks}
          onPress={(deckId) => router.push(`/deck/${deckId}`)}
        />

        <OfflineBanner visible={fromCache} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your decks</Text>
            <Link href="/(tabs)/decks" asChild>
              <Button label="All" onPress={() => {}} variant="secondary" style={styles.smallButton} />
            </Link>
          </View>

          {decks.length === 0 ? (
            <EmptyState
              title="No decks yet"
              message="Pick a topic above to generate your first deck!"
              actionLabel="Retry"
              onAction={reload}
            />
          ) : (
            <Text style={styles.deckHint}>
              {decks.length} deck{decks.length === 1 ? '' : 's'} ready · open Decks or tap Continue
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
    paddingBottom: 100,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  smallButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  deckHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
