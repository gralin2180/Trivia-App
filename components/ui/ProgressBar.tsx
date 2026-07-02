import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius } from '@/constants/theme';

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
  color = colors.primary,
  gradient,
  style,
}: ProgressBarProps) {
  const animated = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(progress, 1));

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
    <View style={[styles.track, { height, borderRadius: height }, style]}>
      <Animated.View style={[styles.fillWrap, { width, height, borderRadius: height }]}>
        {gradient ? (
          <LinearGradient
            colors={[...gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { borderRadius: height }]}
          />
        ) : (
          <View style={[styles.fill, { backgroundColor: color, borderRadius: height }]} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.border,
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
