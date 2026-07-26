import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';

type ProgressBarProps = {
  progress: number;
  height?: number;
  color?: string;
  gradient?: readonly [string, string];
  style?: ViewStyle;
};

export function ProgressBar({
  progress,
  height = 12,
  color,
  gradient,
  style,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const animated = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(progress, 1));
  const fillColor = color ?? colors.primary;

  useEffect(() => {
    Animated.spring(animated, {
      toValue: clamped,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [clamped, animated]);

  const width = animated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height, backgroundColor: colors.surfaceHighlight },
        style,
      ]}
    >
      <Animated.View style={[styles.fillWrap, { width, height, borderRadius: height }]}>
        {gradient ? (
          <LinearGradient
            colors={[...gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { borderRadius: height }]}
          />
        ) : (
          <View style={[styles.fill, { backgroundColor: fillColor, borderRadius: height }]} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fillWrap: {
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    height: '100%',
  },
});
