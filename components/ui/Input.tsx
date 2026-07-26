import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.bodyMedium }]}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surface,
            color: colors.text,
            fontFamily: fonts.body,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text style={[styles.error, { color: colors.error, fontFamily: fonts.body }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.md,
  },
  error: {
    marginLeft: 2,
    fontSize: fontSize.sm,
  },
});
