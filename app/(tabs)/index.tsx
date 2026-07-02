import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DeckCard } from '@/components/decks/DeckCard';
import { StatCard } from '@/components/home/StatCard';
import { TopicSearch } from '@/components/home/TopicSearch';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, spacing } from '@/constants/theme';
import { useDecks } from '@/hooks/useDecks';
import { useProgress } from '@/hooks/useProgress';
import { HeroCard } from '@/components/home/HeroCard';
import { ContinueLearning } from '@/components/home/ContinueLearning';
import { DailyQuest } from '@/components/home/DailyQuest';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { decks, isLoading, error, fromCache, reload } = useDecks();
  const { progress } = useProgress(user?.id);

  const displayName = user?.email?.split('@')[0] ?? 'Player';

  function getDeckProgress(deckId: string) {
    const item = progress.deckProgress.find((d) => d.deckId === deckId);
    return item ? item.percent / 100 : 0;
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeroCard
          name={displayName}
          streak={progress.streak}
          levelInfo={progress.levelInfo}
        />

        {progress.continueDeck ? (
          <ContinueLearning
            topic={progress.continueDeck.deckTitle}
            progress={progress.continueDeck.percent}
            onPress={() => router.push(`/deck/${progress.continueDeck!.deckId}`)}
          />
        ) : null}

        <DailyQuest cardsStudied={progress.dailyCardsStudied} goal={progress.dailyGoal} />

        <TopicSearch />

        <OfflineBanner visible={fromCache} />

        <View style={styles.statsRow}>
          <StatCard label="Decks" value={decks.length} icon="🃏" accent={colors.secondary} />
          <StatCard label="Streak" value={progress.streak} icon="🔥" accent={colors.streak} />
          <StatCard label="XP" value={progress.xp} icon="⭐" accent={colors.xp} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ Quick start</Text>
            <Link href="/(tabs)/decks" asChild>
              <Button label="All" onPress={() => {}} variant="secondary" style={styles.smallButton} />
            </Link>
          </View>

          {decks.length === 0 ? (
            <EmptyState
              title="No decks yet"
              message="Generate your first deck with a topic above!"
              actionLabel="Retry"
              onAction={reload}
            />
          ) : (
            <View style={styles.deckList}>
              {decks.slice(0, 2).map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  progress={getDeckProgress(deck.id)}
                  onPress={() => router.push(`/deck/${deck.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
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
  deckList: {
    gap: spacing.sm,
  },
});
