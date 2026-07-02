import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'purple';
  style?: ViewStyle;
  icon?: string;
  disabled?: boolean;
};

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
  icon,
  disabled = false,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isPurple = variant === 'purple';
  const isDanger = variant === 'danger';

  function handlePress() {
    triggerHaptic();
    onPress();
  }

  if (isPrimary) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.base,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={['#89E219', '#58CC02']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.primaryInner}>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <Text style={styles.label}>{label}</Text>
          </View>
        </LinearGradient>
        <View style={styles.primaryShadow} />
      </Pressable>
    );
  }

  const bgColor =
    variant === 'secondary'
      ? colors.surfaceLight
      : isPurple
        ? colors.secondary
        : isDanger
          ? colors.error
          : colors.surfaceLight;

  const shadowColor =
    variant === 'secondary'
      ? colors.border
      : isPurple
        ? colors.secondaryDark
        : isDanger
          ? colors.errorDark
          : colors.border;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles.altButton,
        { backgroundColor: bgColor, borderBottomColor: shadowColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.altInner}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    overflow: 'visible',
    position: 'relative',
  },
  gradient: {
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryDark,
  },
  primaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  primaryShadow: {
    position: 'absolute',
    bottom: -2,
    left: 4,
    right: 4,
    height: 4,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.sm,
    zIndex: -1,
  },
  altButton: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 4,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  altInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pressed: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 2,
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  secondaryLabel: {
    color: colors.text,
    textTransform: 'none',
    fontWeight: '700',
  },
  icon: {
    fontSize: fontSize.lg,
  },
});
