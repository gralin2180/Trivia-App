import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontSize, gradients, spacing } from '@/constants/theme';

type StudyProgressBarProps = {
  label: string;
};

export function StudyProgressBar({ label }: StudyProgressBarProps) {
  const [current, total] = label.split('/').map((part) => Number(part.trim()));
  const progress = total > 0 ? current / total : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <ProgressBar progress={progress} height={14} gradient={gradients.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '800',
  },
});
