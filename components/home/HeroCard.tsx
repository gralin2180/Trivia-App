import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { GameCard } from '@/components/ui/GameCard';
import { XPBar } from '@/components/ui/XPBar';
import { colors, fontSize, gradients, spacing } from '@/constants/theme';
import type { LevelInfo } from '@/lib/gamification';

type HeroCardProps = {
  name: string;
  streak: number;
  levelInfo: LevelInfo;
};

export function HeroCard({ name, streak, levelInfo }: HeroCardProps) {
  return (
    <GameCard variant="highlight">
      <View style={styles.topRow}>
        <View style={styles.streakBadge}>
          <LinearGradient
            colors={[...gradients.streak]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.streakGradient}
          >
            <Text style={styles.streakText}>🔥 {streak} day streak</Text>
          </LinearGradient>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv. {levelInfo.level}</Text>
        </View>
      </View>

      <Text style={styles.greeting}>Hey, {name}! 👋</Text>
      <Text style={styles.subtitle}>Ready to learn something new?</Text>

      <View style={styles.xpSection}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpLabel}>⭐ XP Progress</Text>
          <Text style={styles.xpValue}>
            {levelInfo.xpInLevel} / {levelInfo.xpToNextLevel}
          </Text>
        </View>
        <XPBar progress={levelInfo.progress} height={14} />
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakBadge: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  streakGradient: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  streakText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
  levelBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.xp,
  },
  levelText: {
    color: colors.xp,
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
  greeting: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  xpSection: {
    gap: spacing.xs,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    color: colors.xp,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  xpValue: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
