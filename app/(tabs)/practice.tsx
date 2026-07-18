import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useDecks } from '@/hooks/useDecks';

export default function PracticeScreen() {
  const router = useRouter();
  const { decks, isLoading, error, reload } = useDecks();

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
        <View style={styles.intro}>
          <Text style={styles.title}>⚔️ Practice arena</Text>
          <Text style={styles.subtitle}>
            Practice mode has no hearts. Timed mode races the clock for bonus XP.
          </Text>
        </View>

        {decks.length === 0 ? (
          <EmptyState
            title="No decks yet"
            message="Generate a deck from Learn, then come back to practice."
            actionLabel="Retry"
            onAction={reload}
          />
        ) : (
          <View style={styles.list}>
            {decks.map((deck) => (
              <View key={deck.id} style={styles.card}>
                <Text style={styles.deckTitle} numberOfLines={1}>
                  {deck.title}
                </Text>
                <Text style={styles.meta}>{deck.card_count} cards</Text>
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.modeBtn, styles.practiceBtn]}
                    onPress={() =>
                      router.push({
                        pathname: '/quiz/[deckId]',
                        params: { deckId: deck.id, mode: 'practice' },
                      })
                    }
                  >
                    <Text style={styles.modeText}>🛡️ Practice</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modeBtn, styles.timedBtn]}
                    onPress={() =>
                      router.push({
                        pathname: '/quiz/[deckId]',
                        params: { deckId: deck.id, mode: 'timed' },
                      })
                    }
                  >
                    <Text style={styles.modeText}>⏱️ Timed</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
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
  intro: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.xl,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  deckTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.lg,
  },
  meta: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderBottomWidth: 3,
  },
  practiceBtn: {
    backgroundColor: colors.surfaceLight,
    borderBottomColor: colors.borderLight,
  },
  timedBtn: {
    backgroundColor: colors.secondary,
    borderBottomColor: colors.secondaryDark,
  },
  modeText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
});
