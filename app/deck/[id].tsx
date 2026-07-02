import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, gradients, radius, spacing } from '@/constants/theme';
import { useDeck } from '@/hooks/useDeck';
import { useProgress } from '@/hooks/useProgress';

function getEmoji(title: string) {
  const t = title.toLowerCase();
  if (t.includes('doctor') || t.includes('medical')) return '🩺';
  if (t.includes('poker')) return '🎰';
  if (t.includes('history')) return '📜';
  if (t.includes('space')) return '🚀';
  return '🧠';
}

export default function DeckDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { deck, isLoading, error, fromCache, reload } = useDeck(id);
  const { progress } = useProgress(user?.id);

  const deckProgress = progress.deckProgress.find((d) => d.deckId === id);
  const percent = deckProgress?.percent ?? 0;

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

        <View style={styles.hero}>
          <Text style={styles.emoji}>{getEmoji(deck.title)}</Text>
          <Text style={styles.category}>{deck.category}</Text>
          <Text style={styles.title}>{deck.title}</Text>
          {deck.description ? <Text style={styles.description}>{deck.description}</Text> : null}
          <Text style={styles.meta}>🃏 {deck.cards.length} flashcards</Text>
        </View>

        {percent > 0 ? (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Your progress</Text>
              <Text style={styles.progressPercent}>{percent}%</Text>
            </View>
            <ProgressBar progress={percent / 100} height={12} gradient={gradients.primary} />
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Study flashcards"
            onPress={() => router.push(`/study/${deck.id}`)}
            icon="📚"
          />
          <Button
            label="Take a quiz"
            onPress={() => router.push(`/quiz/${deck.id}`)}
            variant="purple"
            icon="⚡"
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
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 56,
  },
  category: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  progressSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
  },
  progressPercent: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.primary,
  },
  actions: {
    gap: spacing.sm,
  },
});
