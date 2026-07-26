import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'purple';
  style?: ViewStyle;
  icon?: string;
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
  icon,
  disabled = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const { hapticsEnabled } = useSettings();

  function handlePress() {
    if (hapticsEnabled && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }

  if (variant === 'primary') {
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
          colors={[...colors.primaryGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.row}>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <Text style={[styles.label, { color: colors.textOnPrimary, fontFamily: fonts.bodyBold }]}>
              {label}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    variant === 'secondary'
      ? colors.surfaceHighlight
      : variant === 'purple'
        ? colors.secondary
        : colors.error;
  const fg =
    variant === 'secondary'
      ? colors.text
      : variant === 'purple'
        ? colors.textOnPrimary
        : '#FFFFFF';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles.alt,
        { backgroundColor: bg },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text
          style={[
            styles.label,
            {
              color: fg,
              fontFamily: fonts.bodyBold,
              textTransform: variant === 'secondary' ? 'none' : 'uppercase',
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  alt: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: fontSize.md,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  icon: {
    fontSize: fontSize.lg,
  },
});
