import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';

type OnboardingTipProps = {
  onDismiss: () => void;
};

export function OnboardingTip({ onDismiss }: OnboardingTipProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.emoji}>👋</Text>
        <View style={styles.copy}>
          <Text style={styles.title}>Quick tip</Text>
          <Text style={styles.body}>
            Pick a topic to start — we’ll build a deck so you can study or quiz right away.
          </Text>
        </View>
      </View>
      <Pressable onPress={onDismiss} style={styles.button}>
        <Text style={styles.buttonText}>Got it</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.secondary + '22',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.secondary + '66',
    padding: spacing.md,
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 28,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.md,
  },
  body: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
});
