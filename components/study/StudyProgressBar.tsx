import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

type StudyProgressBarProps = {
  label: string;
};

export function StudyProgressBar({ label }: StudyProgressBarProps) {
  const [current, total] = label.split('/').map((part) => Number(part.trim()));
  const progress = total > 0 ? current / total : 0;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  track: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'right',
  },
});
