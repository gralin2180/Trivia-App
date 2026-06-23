import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Screen } from '@/components/ui/Screen';
import { colors, fontSize, spacing } from '@/constants/theme';
import { useDeck } from '@/hooks/useDeck';

export default function DeckDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deck, isLoading, error, fromCache, reload } = useDeck(id);

  if (isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (error || !deck) {
    return (
      <Screen>
        <ErrorState message={error ?? 'Deck not found.'} onRetry={reload} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OfflineBanner visible={fromCache} />
        <View style={styles.header}>
          <Text style={styles.category}>{deck.category}</Text>
          <Text style={styles.title}>{deck.title}</Text>
          {deck.description ? <Text style={styles.description}>{deck.description}</Text> : null}
          <Text style={styles.meta}>{deck.cards.length} flashcards</Text>
        </View>

        <View style={styles.actions}>
          <Button label="Study flashcards" onPress={() => router.push(`/study/${deck.id}`)} />
          <Button
            label="Take a quiz"
            onPress={() => router.push(`/quiz/${deck.id}`)}
            variant="secondary"
          />
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
  header: {
    gap: spacing.sm,
  },
  category: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    lineHeight: 22,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.sm,
  },
});
