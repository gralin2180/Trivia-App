import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DeckCard } from '@/components/decks/DeckCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Screen } from '@/components/ui/Screen';
import { fonts, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { groupDecksByCategory } from '@/lib/decks';
import { useDecks } from '@/hooks/useDecks';
import { useProgress } from '@/hooks/useProgress';

export default function DecksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { decks, isLoading, error, fromCache, reload } = useDecks();
  const { progress } = useProgress(user?.id);
  const grouped = groupDecksByCategory(decks);
  const categories = Object.keys(grouped).sort();

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

  if (decks.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="No decks yet"
          message="Generate your first deck from Learn."
          actionLabel="Retry"
          onAction={reload}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: colors.textMuted, fontFamily: fonts.body }]}>
          Your topics, ready to study or quiz.
        </Text>
        <OfflineBanner visible={fromCache} />
        {categories.map((category) => (
          <View key={category} style={styles.section}>
            <Text style={[styles.categoryTitle, { color: colors.textSecondary, fontFamily: fonts.bodyBold }]}>
              {category.toUpperCase()}
            </Text>
            <View style={styles.deckList}>
              {grouped[category].map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  progress={getDeckProgress(deck.id)}
                  onPress={() => router.push(`/deck/${deck.id}`)}
                />
              ))}
            </View>
          </View>
        ))}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
    paddingBottom: 100,
  },
  intro: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  section: {
    gap: spacing.sm,
  },
  categoryTitle: {
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
  },
  deckList: {
    gap: spacing.sm,
  },
});
