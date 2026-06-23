import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, spacing } from '@/constants/theme';

type QuizOptionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  state?: 'default' | 'correct' | 'wrong' | 'muted';
};

export function QuizOptionButton({
  label,
  onPress,
  disabled = false,
  state = 'default',
}: QuizOptionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        state === 'correct' && styles.correct,
        state === 'wrong' && styles.wrong,
        state === 'muted' && styles.muted,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          (state === 'correct' || state === 'wrong') && styles.labelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  correct: {
    backgroundColor: '#DCFCE7',
    borderColor: colors.success,
  },
  wrong: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.error,
  },
  muted: {
    opacity: 0.55,
  },
  pressed: {
    borderColor: colors.primary,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  labelActive: {
    fontWeight: '600',
  },
});
