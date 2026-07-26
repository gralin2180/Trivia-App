import { StyleSheet, View } from 'react-native';

import { useMascot } from '@/contexts/MascotContext';
import { useTheme } from '@/contexts/ThemeContext';

/** Dim overlay with a clear “hole” around the tutorial hotspot. */
export function TutorialSpotlight() {
  const { colors } = useTheme();
  const { isTutorial, spotlight } = useMascot();

  if (!isTutorial || !spotlight) return null;

  const { x, y, width, height } = spotlight;
  const pad = 6;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Four dim panels around the hole */}
      <View style={[styles.dim, { top: 0, left: 0, right: 0, height: Math.max(0, y - pad) }]} />
      <View
        style={[
          styles.dim,
          {
            top: y + height + pad,
            left: 0,
            right: 0,
            bottom: 0,
          },
        ]}
      />
      <View
        style={[
          styles.dim,
          {
            top: y - pad,
            left: 0,
            width: Math.max(0, x - pad),
            height: height + pad * 2,
          },
        ]}
      />
      <View
        style={[
          styles.dim,
          {
            top: y - pad,
            left: x + width + pad,
            right: 0,
            height: height + pad * 2,
          },
        ]}
      />

      {/* Highlight ring */}
      <View
        style={[
          styles.ring,
          {
            left: x - pad,
            top: y - pad,
            width: width + pad * 2,
            height: height + pad * 2,
            borderColor: colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(8, 12, 20, 0.62)',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2.5,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
});
