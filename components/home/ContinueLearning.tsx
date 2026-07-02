import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { GameCard } from '@/components/ui/GameCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontSize, spacing } from '@/constants/theme';

type Props = {
  topic: string;
  progress: number;
  onPress?: () => void;
};

export function ContinueLearning({ topic, progress, onPress }: Props) {
  return (
    <GameCard>
      <View style={styles.header}>
        <Text style={styles.badge}>▶ CONTINUE</Text>
        <Text style={styles.percent}>{progress}%</Text>
      </View>

      <Text style={styles.title}>{topic}</Text>
      <Text style={styles.subtitle}>Pick up where you left off!</Text>

      <ProgressBar progress={progress / 100} height={12} />

      <View style={styles.buttonWrap}>
        <Button label="Resume" onPress={onPress ?? (() => {})} icon="🚀" />
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badge: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
  percent: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: fontSize.lg,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.lg,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    fontSize: fontSize.sm,
  },
  buttonWrap: {
    marginTop: spacing.lg,
  },
});
