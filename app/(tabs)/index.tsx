import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { DeckCard } from '@/components/decks/DeckCard';
import { ApiKeyPopup } from '@/components/home/ApiKeyPopup';
import { ContinueLesson } from '@/components/home/ContinueLesson';
import { RevisionNudge } from '@/components/home/RevisionNudge';
import { SyllabusGapSection } from '@/components/home/SyllabusGapSection';
import { TopicSearch } from '@/components/home/TopicSearch';
import { WeakPointPractice } from '@/components/home/WeakPointPractice';
import { WeakTopics } from '@/components/home/WeakTopics';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Screen } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { fonts, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useDecks } from '@/hooks/useDecks';
import { useProgress } from '@/hooks/useProgress';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { colors } = useTheme();
  const { decks, isLoading, error, fromCache, reload } = useDecks();
  const { progress } = useProgress(user?.id);

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

  const xpLeft = Math.max(0, progress.dailyXpGoal - progress.dailyXp);

  return (
    <Screen style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={[...colors.heroGradient]} style={styles.heroPlane}>
          <View style={styles.heroTop}>
            <Text style={[styles.brand, { color: colors.primary, fontFamily: fonts.display }]}>
              {brand.name}
            </Text>
            <View style={[styles.streakPill, { backgroundColor: colors.surface }]}>
              <Text style={[styles.streakText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                {progress.streak} day streak · {progress.dailyXp}/{progress.dailyXpGoal} XP
              </Text>
            </View>
          </View>
          <Text style={[styles.greeting, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {isGuest ? 'Exploring as guest' : 'Ready when you are'}
          </Text>
          {xpLeft > 0 ? (
            <Text style={[styles.xpHint, { color: colors.textSecondary, fontFamily: fonts.body }]}>
              {xpLeft} XP to today’s goal
            </Text>
          ) : (
            <Text style={[styles.xpHint, { color: colors.primary, fontFamily: fonts.bodyMedium }]}>
              Daily goal complete
            </Text>
          )}
        </LinearGradient>

        <View style={styles.main}>
          <ApiKeyPopup />

          <TopicSearch />

          <RevisionNudge
            onQuiz={(id) => router.push(`/quiz/${id}`)}
            onStudy={(id) => router.push(`/study/${id}`)}
          />

          <SyllabusGapSection />

          {isGuest ? (
            <Pressable onPress={() => router.push('/(auth)/login')} style={styles.guestRow}>
              <Text style={[styles.guestText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                Sign in to sync streaks across devices →
              </Text>
            </Pressable>
          ) : null}

          {progress.continueDeck ? (
            <ContinueLesson
              topic={progress.continueDeck.deckTitle}
              progress={progress.continueDeck.percent}
              onPress={() => router.push(`/deck/${progress.continueDeck!.deckId}`)}
            />
          ) : null}

          <WeakPointPractice
            userId={user?.id}
            onOpenDeck={(deckId) => router.push(`/study/${deckId}`)}
          />

          <WeakTopics
            decks={progress.weakDecks}
            onPress={(deckId) => router.push(`/deck/${deckId}`)}
          />

          <OfflineBanner visible={fromCache} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}
              >
                Your decks
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/decks')} hitSlop={8}>
                <Text style={[styles.deckCount, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                  See all
                </Text>
              </Pressable>
            </View>

            {decks.length === 0 ? (
              <EmptyState
                title="No decks yet"
                message="Pick a topic above to generate your first deck."
                actionLabel="Retry"
                onAction={reload}
              />
            ) : (
              <View style={styles.deckList}>
                {decks.slice(0, 4).map((deck) => (
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
    paddingBottom: 120,
  },
  heroPlane: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  brand: {
    fontSize: fontSize.sm,
    letterSpacing: 2.5,
  },
  streakPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: {
    fontSize: fontSize.xs,
  },
  greeting: {
    fontSize: fontSize.sm,
  },
  xpHint: {
    fontSize: fontSize.sm,
  },
  main: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    marginTop: -spacing.sm,
  },
  guestRow: {
    paddingVertical: spacing.xs,
  },
  guestText: {
    fontSize: fontSize.sm,
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
  },
  deckCount: {
    fontSize: fontSize.sm,
  },
  deckList: {
    gap: spacing.sm,
  },
});
