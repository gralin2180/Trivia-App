import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatsCharts } from '@/components/progress/StatsCharts';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { chartColors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgress } from '@/hooks/useProgress';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { displayName } = useSettings();
  const { colors } = useTheme();
  const { progress } = useProgress(user?.id);

  const name =
    displayName ||
    (isGuest ? 'Guest explorer' : user?.email?.split('@')[0]) ||
    'Learner';

  const unlocked = progress.achievements.filter((a) => a.unlocked);
  const lockedPreview = progress.achievements.filter((a) => !a.unlocked).slice(0, 2);
  const badgeRow = [...unlocked, ...lockedPreview].slice(0, 8);

  return (
    <Screen style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={[styles.kicker, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
            PROFILE
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            style={[styles.gearBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text
              style={[styles.avatarLetter, { color: colors.textOnPrimary, fontFamily: fonts.display }]}
            >
              {(name[0] ?? 'A').toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.text, fontFamily: fonts.display }]}>{name}</Text>
          <Text style={[styles.level, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Level {progress.levelInfo.level} · {progress.xp} XP
          </Text>
          <ProgressBar
            progress={progress.levelInfo.progress}
            height={8}
            gradient={colors.primaryGradient}
            style={styles.xpBar}
          />
        </View>

        {/* Badges under name */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
              Badges
            </Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted, fontFamily: fonts.body }]}>
              {unlocked.length}/{progress.achievements.length}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgeRow}
          >
            {badgeRow.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: badge.unlocked ? chartColors.amber : colors.border,
                    opacity: badge.unlocked ? 1 : 0.55,
                  },
                ]}
              >
                <Text style={styles.badgeIcon}>{badge.unlocked ? badge.icon : '🔒'}</Text>
                <Text
                  style={[styles.badgeLabel, { color: colors.text, fontFamily: fonts.bodyMedium }]}
                  numberOfLines={1}
                >
                  {badge.label}
                </Text>
              </View>
            ))}
          </ScrollView>
          <Pressable onPress={() => router.push('/badges')} hitSlop={8}>
            <Text style={[styles.link, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
              See all badges →
            </Text>
          </Pressable>
        </View>

        {/* Stats inline */}
        <View style={styles.kpiRow}>
          <GlassCard accent="amber" style={styles.kpi}>
            <Ionicons name="flame-outline" size={16} color={chartColors.amber} />
            <Text style={[styles.kpiValue, { color: chartColors.amber, fontFamily: fonts.display }]}>
              {progress.streak}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontFamily: fonts.body }]}>
              streak
            </Text>
          </GlassCard>
          <GlassCard accent="cyan" style={styles.kpi}>
            <Ionicons name="layers-outline" size={16} color={chartColors.cyan} />
            <Text style={[styles.kpiValue, { color: chartColors.cyan, fontFamily: fonts.display }]}>
              {progress.cardsStudied}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontFamily: fonts.body }]}>
              cards
            </Text>
          </GlassCard>
          <GlassCard accent="pink" style={styles.kpi}>
            <Ionicons name="flash-outline" size={16} color={chartColors.pink} />
            <Text style={[styles.kpiValue, { color: chartColors.pink, fontFamily: fonts.display }]}>
              {progress.quizzesTaken}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontFamily: fonts.body }]}>
              quizzes
            </Text>
          </GlassCard>
        </View>

        <StatsCharts progress={progress} />

        <View style={[styles.section, styles.padH]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            Recent quizzes
          </Text>
          {progress.recentQuizzes.length === 0 ? (
            <EmptyState
              title="No quizzes yet"
              message="Run a practice or timed quiz to light up your trend line."
            />
          ) : (
            progress.recentQuizzes.slice(0, 4).map((quiz) => {
              const pct =
                quiz.totalQuestions > 0
                  ? Math.round((quiz.score / quiz.totalQuestions) * 100)
                  : 0;
              return (
                <View key={quiz.id} style={[styles.quizRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.quizInfo}>
                    <Text
                      style={[styles.quizTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
                    >
                      {quiz.deckTitle}
                    </Text>
                    <Text
                      style={[
                        styles.quizDate,
                        { color: colors.textSecondary, fontFamily: fonts.body },
                      ]}
                    >
                      {formatDate(quiz.completedAt)} · {quiz.score}/{quiz.totalQuestions}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.quizScore,
                      {
                        color: pct >= 70 ? chartColors.mint : chartColors.pink,
                        fontFamily: fonts.displayBold,
                      },
                    ]}
                  >
                    {pct}%
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Leaderboard at the end */}
        <Pressable
          onPress={() => router.push('/(tabs)/leaderboard')}
          style={[styles.leaderRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: chartColors.pink + '22' }]}>
            <Ionicons name="trophy-outline" size={20} color={chartColors.pink} />
          </View>
          <View style={styles.menuText}>
            <Text style={[styles.menuLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              Leaderboard
            </Text>
            <Text style={[styles.menuHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
              See how you rank among Top minds
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        {isGuest ? (
          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.guestLink}>
            <Text style={[styles.guestText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
              Create account to sync ranks →
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg,
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  kicker: { fontSize: fontSize.xs, letterSpacing: 1.4 },
  gearBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarLetter: { fontSize: 28 },
  name: { fontSize: fontSize.xl, textTransform: 'capitalize' },
  level: { fontSize: fontSize.sm },
  xpBar: { marginTop: spacing.sm, width: '100%' },
  section: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  padH: { paddingHorizontal: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: fontSize.lg },
  sectionMeta: { fontSize: fontSize.sm },
  badgeRow: { gap: spacing.sm },
  badgeChip: {
    width: 104,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  badgeIcon: { fontSize: 22 },
  badgeLabel: { fontSize: fontSize.xs, textAlign: 'center' },
  link: { fontSize: fontSize.sm },
  kpiRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  kpi: { flex: 1, gap: 4, alignItems: 'flex-start' },
  kpiValue: { fontSize: fontSize.xl },
  kpiLabel: { fontSize: fontSize.xs },
  quizRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  quizInfo: { flex: 1, gap: 2 },
  quizTitle: { fontSize: fontSize.md },
  quizDate: { fontSize: fontSize.sm },
  quizScore: { fontSize: fontSize.lg },
  leaderRow: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, gap: 2 },
  menuLabel: { fontSize: fontSize.md },
  menuHint: { fontSize: fontSize.sm },
  guestLink: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  guestText: { fontSize: fontSize.sm, textAlign: 'center' },
});
