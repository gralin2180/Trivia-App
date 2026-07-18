import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatCard } from '@/components/home/StatCard';
import { Button } from '@/components/ui/Button';
import { GameCard } from '@/components/ui/GameCard';
import { Screen } from '@/components/ui/Screen';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { XPBar } from '@/components/ui/XPBar';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useProgress } from '@/hooks/useProgress';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { progress } = useProgress(user?.id);

  const displayName = user?.email?.split('@')[0] ?? 'Learner';

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#2A1F5E', '#1A2235']} style={styles.avatarCard}>
          <Text style={styles.avatar}>🧠</Text>
          <Text style={styles.playerName}>{displayName}</Text>
          <Text style={styles.playerLevel}>Level {progress.levelInfo.level} Learner</Text>
          <View style={styles.xpWrap}>
            <XPBar progress={progress.levelInfo.progress} height={10} />
            <Text style={styles.xpText}>
              {progress.levelInfo.xpInLevel} / {progress.levelInfo.xpToNextLevel} XP
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard label="Streak" value={progress.streak} icon="🔥" accent={colors.streak} />
          <StatCard label="Cards" value={progress.cardsStudied} icon="🃏" accent={colors.secondary} />
          <StatCard label="Quizzes" value={progress.quizzesTaken} icon="🏆" accent={colors.xp} />
        </View>

        <SoundToggle />

        <GameCard>
          <Text style={styles.emailLabel}>Signed in as</Text>
          <Text style={styles.email} numberOfLines={2}>
            {user?.email ?? 'Unknown user'}
          </Text>
        </GameCard>

        <Button label="Sign Out" onPress={signOut} variant="secondary" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
    paddingBottom: 100,
  },
  avatarCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: colors.secondary + '44',
  },
  avatar: {
    fontSize: 56,
    marginBottom: spacing.xs,
  },
  playerName: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'capitalize',
  },
  playerLevel: {
    fontSize: fontSize.sm,
    color: colors.xp,
    fontWeight: '700',
  },
  xpWrap: {
    width: '100%',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  xpText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emailLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  email: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
});
