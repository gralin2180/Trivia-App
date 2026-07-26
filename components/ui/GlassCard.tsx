import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type GlassCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  accent?: 'mint' | 'pink' | 'cyan' | 'amber' | 'none';
};

const ACCENT_GLOW = {
  mint: ['rgba(46, 230, 197, 0.22)', 'rgba(18, 22, 31, 0.4)'] as const,
  pink: ['rgba(255, 92, 154, 0.2)', 'rgba(18, 22, 31, 0.4)'] as const,
  cyan: ['rgba(34, 211, 238, 0.2)', 'rgba(18, 22, 31, 0.4)'] as const,
  amber: ['rgba(255, 200, 87, 0.18)', 'rgba(18, 22, 31, 0.4)'] as const,
  none: ['rgba(255,255,255,0.04)', 'rgba(18, 22, 31, 0.55)'] as const,
};

export function GlassCard({ children, style, accent = 'none' }: GlassCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.shell,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[...ACCENT_GLOW[accent]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});
