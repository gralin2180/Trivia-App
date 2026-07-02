import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, game, spacing } from '@/constants/theme';

type HeartsBarProps = {
  hearts: number;
  maxHearts?: number;
};

export function HeartsBar({ hearts, maxHearts = game.maxHearts }: HeartsBarProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxHearts }).map((_, i) => (
        <Text key={i} style={[styles.heart, i >= hearts && styles.heartEmpty]}>
          {i < hearts ? '❤️' : '🖤'}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  heart: {
    fontSize: fontSize.lg,
  },
  heartEmpty: {
    opacity: 0.35,
  },
});
