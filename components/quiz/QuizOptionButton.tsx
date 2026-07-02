import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { OPTION_LETTERS } from '@/lib/gamification';

type QuizOptionButtonProps = {
  label: string;
  index: number;
  onPress: () => void;
  disabled?: boolean;
  state?: 'default' | 'correct' | 'wrong' | 'muted';
};

export function QuizOptionButton({
  label,
  index,
  onPress,
  disabled = false,
  state = 'default',
}: QuizOptionButtonProps) {
  const letter = OPTION_LETTERS[index] ?? String(index + 1);
  const isCorrect = state === 'correct';
  const isWrong = state === 'wrong';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        isCorrect && styles.correct,
        isWrong && styles.wrong,
        state === 'muted' && styles.muted,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.letterBadge,
          isCorrect && styles.letterCorrect,
          isWrong && styles.letterWrong,
        ]}
      >
        <Text
          style={[
            styles.letter,
            (isCorrect || isWrong) && styles.letterActive,
          ]}
        >
          {isCorrect ? '✓' : isWrong ? '✗' : letter}
        </Text>
      </View>
      <Text
        style={[
          styles.label,
          (isCorrect || isWrong) && styles.labelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderBottomWidth: 4,
    borderBottomColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  correct: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
    borderBottomColor: colors.successDark,
  },
  wrong: {
    backgroundColor: colors.errorBg,
    borderColor: colors.error,
    borderBottomColor: colors.errorDark,
  },
  muted: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 2,
  },
  letterBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  letterCorrect: {
    backgroundColor: colors.success,
    borderColor: colors.successDark,
  },
  letterWrong: {
    backgroundColor: colors.error,
    borderColor: colors.errorDark,
  },
  letter: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.textMuted,
  },
  letterActive: {
    color: '#FFFFFF',
  },
  label: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    fontWeight: '600',
  },
  labelActive: {
    fontWeight: '700',
  },
});
