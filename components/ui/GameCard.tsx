import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";

import { colors, radius, spacing, shadows } from "@/constants/theme";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
};

export function GameCard({ children, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    padding: spacing.lg,

    borderWidth: 1,
    borderColor: colors.border,

    ...shadows.card,
  },

  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
});