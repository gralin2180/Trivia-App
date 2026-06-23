import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, spacing } from '@/constants/theme';

type OptionChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionChip({ label, selected, onPress }: OptionChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelSelected: {
    color: colors.primary,
  },
});
