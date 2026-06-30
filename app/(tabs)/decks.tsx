import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DeckCard } from '@/components/decks/DeckCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Screen } from '@/components/ui/Screen';
import { colors, fontSize, spacing } from '@/constants/theme';
import { groupDecksByCategory } from '@/lib/decks';
import { useDecks } from '@/hooks/useDecks';

export default function DecksScreen() {
  const router = useRouter();
  const { decks, isLoading, error, fromCache, reload } = useDecks();
  const grouped = groupDecksByCategory(decks);
  const categories = Object.keys(grouped).sort();

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
          title="No decks found"
          message="Open Supabase → SQL Editor and run the script in supabase/schema.sql to seed sample decks."
          actionLabel="Retry"
          onAction={reload}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OfflineBanner visible={fromCache} />
        {categories.map((category) => (
          <View key={category} style={styles.section}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.deckList}>
              {grouped[category].map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
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
  section: {
    gap: spacing.md,
  },

  categoryTitle: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },

  deckList: {
    gap: spacing.md,
  },
});