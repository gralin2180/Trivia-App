import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { chartColors, fonts, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgress } from '@/hooks/useProgress';
import {
  buildLocalLeaderboard,
  fetchLeaderboard,
  syncProfileRank,
  type LeaderboardEntry,
} from '@/lib/leaderboard';

export default function LeaderboardTabScreen() {
  const { user, isGuest } = useAuth();
  const { displayName } = useSettings();
  const { colors } = useTheme();
  const { progress } = useProgress(user?.id);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [source, setSource] = useState<'live' | 'local'>('local');
  const [loading, setLoading] = useState(true);

  const name =
    displayName ||
    (isGuest ? 'Guest' : user?.email?.split('@')[0]) ||
    'You';

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setLoading(true);

        if (user?.id && !user.is_anonymous) {
          await syncProfileRank({
            userId: user.id,
            displayName: name,
            xp: progress.xp,
            streak: progress.streak,
          });
        }

        const result = await fetchLeaderboard(user?.id);
        if (!active) return;

        if (result.entries.length > 0) {
          setEntries(result.entries);
          setSource('live');
        } else {
          setEntries(
            buildLocalLeaderboard({
              userId: user?.id,
              displayName: name,
              xp: progress.xp,
              streak: progress.streak,
            }),
          );
          setSource('local');
        }
        setLoading(false);
      }

      void load();
      return () => {
        active = false;
      };
    }, [user?.id, user?.is_anonymous, name, progress.xp, progress.streak]),
  );

  const yourRank = entries.findIndex((e) => e.isYou) + 1;

  return (
    <Screen style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: chartColors.pink, fontFamily: fonts.bodyBold }]}>
          LEADERBOARD
        </Text>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
          Top minds
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
          {source === 'live'
            ? `Live ranks · you are #${yourRank || '—'}`
            : 'Practice board · set a display name in Profile → Settings'}
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <View style={styles.list}>
            {entries.map((entry, index) => {
              const rank = index + 1;
              const accent =
                rank === 1 ? 'amber' : rank === 2 ? 'cyan' : rank === 3 ? 'pink' : 'none';
              return (
                <GlassCard
                  key={entry.id}
                  accent={accent as 'amber' | 'cyan' | 'pink' | 'none'}
                  style={entry.isYou ? { borderColor: colors.primary, borderWidth: 1.5 } : undefined}
                >
                  <View style={styles.rowInner}>
                    <Text
                      style={[
                        styles.rank,
                        {
                          color:
                            rank === 1
                              ? chartColors.amber
                              : rank === 2
                                ? chartColors.cyan
                                : rank === 3
                                  ? chartColors.pink
                                  : colors.textSecondary,
                          fontFamily: fonts.displayBold,
                        },
                      ]}
                    >
                      #{rank}
                    </Text>
                    <View style={styles.info}>
                      <Text style={[styles.name, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                        {entry.displayName}
                        {entry.isYou ? ' (you)' : ''}
                      </Text>
                      <Text style={[styles.meta, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        {entry.streak} day streak
                      </Text>
                    </View>
                    <Text
                      style={[styles.xp, { color: chartColors.mint, fontFamily: fonts.displayBold }]}
                    >
                      {entry.xp.toLocaleString()} XP
                    </Text>
                  </View>
                </GlassCard>
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    paddingBottom: 100,
  },
  kicker: { fontSize: fontSize.xs, letterSpacing: 1.4 },
  title: { fontSize: fontSize.display, letterSpacing: -0.6 },
  subtitle: { fontSize: fontSize.md, lineHeight: 22 },
  list: { gap: spacing.sm, marginTop: spacing.sm },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: { width: 40, fontSize: fontSize.md },
  info: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.md },
  meta: { fontSize: fontSize.xs },
  xp: { fontSize: fontSize.sm },
});
