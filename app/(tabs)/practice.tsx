import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { chartColors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useDecks } from '@/hooks/useDecks';

export default function PracticeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
    <Screen style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...colors.heroGradient]} style={styles.hero}>
          <View style={styles.heroTop}>
            <Ionicons name="flash-outline" size={22} color={colors.primary} />
            <Text style={[styles.kicker, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
              PRACTICE ARENA
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
            Sharpen up
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Pick a mode. Practice is chill. Timed pays bonus XP.
          </Text>
        </LinearGradient>

        <View style={styles.modeLegend}>
          <View style={[styles.legendChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="heart-dislike-outline" size={14} color={chartColors.cyan} />
            <Text style={[styles.legendText, { color: colors.textMuted, fontFamily: fonts.body }]}>
              Practice · no hearts
            </Text>
          </View>
          <View style={[styles.legendChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="timer-outline" size={14} color={colors.primary} />
            <Text style={[styles.legendText, { color: colors.textMuted, fontFamily: fonts.body }]}>
              Timed · race XP
            </Text>
          </View>
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
            {decks.map((deck, index) => {
              const accent =
                index % 3 === 0
                  ? chartColors.mint
                  : index % 3 === 1
                    ? chartColors.cyan
                    : chartColors.pink;
              return (
                <View
                  key={deck.id}
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.deckBadge, { backgroundColor: accent + '22' }]}>
                      <Ionicons name="albums-outline" size={18} color={accent} />
                    </View>
                    <View style={styles.cardText}>
                      <Text
                        style={[
                          styles.deckTitle,
                          { color: colors.text, fontFamily: fonts.displayBold },
                        ]}
                        numberOfLines={1}
                      >
                        {deck.title}
                      </Text>
                      <Text
                        style={[
                          styles.meta,
                          { color: colors.textSecondary, fontFamily: fonts.body },
                        ]}
                      >
                        {deck.card_count} cards ready
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      style={[
                        styles.modeBtn,
                        { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/quiz/[deckId]',
                          params: { deckId: deck.id, mode: 'practice' },
                        })
                      }
                    >
                      <Ionicons name="flash-outline" size={16} color={colors.text} />
                      <Text
                        style={[styles.modeText, { color: colors.text, fontFamily: fonts.bodyBold }]}
                      >
                        Practice
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.modeBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() =>
                        router.push({
                          pathname: '/quiz/[deckId]',
                          params: { deckId: deck.id, mode: 'timed' },
                        })
                      }
                    >
                      <Ionicons name="timer-outline" size={16} color={colors.textOnPrimary} />
                      <Text
                        style={[
                          styles.modeText,
                          { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                        ]}
                      >
                        Timed
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 100, gap: spacing.md },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  kicker: { fontSize: fontSize.xs, letterSpacing: 1.4 },
  title: { fontSize: fontSize.display, letterSpacing: -0.5 },
  subtitle: { fontSize: fontSize.md, lineHeight: 22 },
  modeLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  legendText: { fontSize: fontSize.xs },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  deckBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
  deckTitle: { fontSize: fontSize.md },
  meta: { fontSize: fontSize.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: { fontSize: fontSize.sm },
});
