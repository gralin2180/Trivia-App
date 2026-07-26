import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { chartColors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useDecks } from '@/hooks/useDecks';
import {
  claimQuest,
  loadDailyQuests,
  questCompletion,
  type DailyQuest,
} from '@/lib/quests';

const KIND_ICON: Record<DailyQuest['kind'], keyof typeof Ionicons.glyphMap> = {
  study: 'book-outline',
  quiz: 'help-circle-outline',
  timed: 'timer-outline',
  generate: 'sparkles-outline',
  streak: 'flame-outline',
};

export default function QuestsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { decks, isLoading } = useDecks();
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const featured = decks[0];

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadDailyQuests().then((q) => {
        if (active) {
          setQuests(q);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const { done, total } = questCompletion(quests);
  const claimableXp = quests
    .filter((q) => q.progress >= q.target && !q.claimed)
    .reduce((sum, q) => sum + q.xp, 0);

  async function onClaim(id: string) {
    const result = await claimQuest(id);
    setQuests(result.quests);
  }

  return (
    <Screen style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...colors.heroGradient]} style={styles.hero}>
          <View style={styles.heroTop}>
            <Ionicons name="flag-outline" size={22} color={colors.primary} />
            <Text style={[styles.kicker, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
              DAILY QUESTS
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
            Today’s missions
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Finish goals for bonus XP. Keep the streak warm.
          </Text>
          <View style={styles.progressWrap}>
            <ProgressBar progress={total ? done / total : 0} height={8} />
            <Text style={[styles.progressLabel, { color: colors.textSecondary, fontFamily: fonts.body }]}>
              {done}/{total} complete
              {claimableXp > 0 ? ` · ${claimableXp} XP ready` : ''}
            </Text>
          </View>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <View style={styles.list}>
            {quests.map((quest) => {
              const ready = quest.progress >= quest.target;
              const pct = Math.min(1, quest.progress / quest.target);
              return (
                <View
                  key={quest.id}
                  style={[
                    styles.questCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.questIcon, { backgroundColor: colors.glowPrimary }]}>
                    <Ionicons name={KIND_ICON[quest.kind]} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.questBody}>
                    <Text
                      style={[styles.questTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
                    >
                      {quest.title}
                    </Text>
                    <Text
                      style={[styles.questHint, { color: colors.textMuted, fontFamily: fonts.body }]}
                    >
                      {quest.hint} · +{quest.xp} XP
                    </Text>
                    <ProgressBar progress={pct} height={6} style={{ marginTop: 8 }} />
                    <Text
                      style={[
                        styles.questMeta,
                        { color: colors.textSecondary, fontFamily: fonts.body },
                      ]}
                    >
                      {quest.progress}/{quest.target}
                    </Text>
                  </View>
                  {quest.claimed ? (
                    <Ionicons name="checkmark-circle" size={24} color={chartColors.mint} />
                  ) : ready ? (
                    <Pressable
                      onPress={() => onClaim(quest.id)}
                      style={[styles.claimBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text
                        style={[
                          styles.claimText,
                          { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                        ]}
                      >
                        Claim
                      </Text>
                    </Pressable>
                  ) : (
                    <Text
                      style={[styles.xpBadge, { color: colors.xp, fontFamily: fonts.bodyBold }]}
                    >
                      +{quest.xp}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
          Quick practice
        </Text>
        <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
          Practice skips hearts. Timed races the clock for bonus XP.
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !featured ? (
          <EmptyState
            title="No decks yet"
            message="Build a deck on Learn, then practice here."
            actionLabel="Go to Learn"
            onAction={() => router.push('/(tabs)')}
          />
        ) : (
          <View style={styles.modes}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/quiz/[deckId]',
                  params: { deckId: featured.id, mode: 'practice' },
                })
              }
              style={[styles.modeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.modeIcon, { backgroundColor: chartColors.cyan + '22' }]}>
                <Ionicons name="flash-outline" size={22} color={chartColors.cyan} />
              </View>
              <Text style={[styles.modeTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                Practice
              </Text>
              <Text style={[styles.modeHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
                No hearts · {featured.title}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/quiz/[deckId]',
                  params: { deckId: featured.id, mode: 'timed' },
                })
              }
              style={[styles.modeCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            >
              <View style={[styles.modeIcon, { backgroundColor: colors.glowPrimary }]}>
                <Ionicons name="timer-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.modeTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                Timed race
              </Text>
              <Text style={[styles.modeHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
                Bonus XP · beat the clock
              </Text>
            </Pressable>
          </View>
        )}

        {decks.length > 1 ? (
          <Pressable onPress={() => router.push('/(tabs)/practice')} style={styles.moreLink}>
            <Text style={[styles.moreText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
              Pick another deck →
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  content: { paddingBottom: 110, gap: spacing.md },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  kicker: { fontSize: fontSize.xs, letterSpacing: 1.4 },
  title: { fontSize: fontSize.display, letterSpacing: -0.6 },
  subtitle: { fontSize: fontSize.md, lineHeight: 22 },
  progressWrap: { marginTop: spacing.sm, gap: spacing.xs },
  progressLabel: { fontSize: fontSize.sm },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  questIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questBody: { flex: 1 },
  questTitle: { fontSize: fontSize.md },
  questHint: { fontSize: fontSize.sm, marginTop: 2 },
  questMeta: { fontSize: fontSize.xs, marginTop: 4 },
  claimBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  claimText: { fontSize: fontSize.sm },
  xpBadge: { fontSize: fontSize.sm },
  sectionTitle: {
    fontSize: fontSize.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  sectionHint: {
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xs,
  },
  modes: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  modeCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  modeTitle: { fontSize: fontSize.md },
  modeHint: { fontSize: fontSize.xs, lineHeight: 16 },
  moreLink: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  moreText: { fontSize: fontSize.sm },
});
