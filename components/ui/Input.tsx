import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, fontSize, spacing } from '@/constants/theme';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },

  label: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 4,
    letterSpacing: 0.3,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,

    backgroundColor: colors.surface,

    borderRadius: 18,

    paddingHorizontal: spacing.lg,
    paddingVertical: 16,

    fontSize: fontSize.md,
    color: colors.text,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 3,
  },

  inputError: {
    borderColor: colors.error,
  },

  error: {
    marginTop: 2,
    marginLeft: 4,

    color: colors.error,

    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});