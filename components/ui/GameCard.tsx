import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, gradients, radius, spacing, shadows } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'highlight' | 'quest';
};

export function GameCard({ children, onPress, style, variant = 'default' }: Props) {
  const gradientColors =
    variant === 'highlight'
      ? gradients.purple
      : variant === 'quest'
        ? ['#2A2040', '#1A2235']
        : gradients.card;

  const borderColor =
    variant === 'highlight'
      ? colors.secondary
      : variant === 'quest'
        ? colors.warning
        : colors.border;

  const content = (
    <LinearGradient
      colors={[...gradientColors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor }, style]}
    >
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    ...shadows.card,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
});
