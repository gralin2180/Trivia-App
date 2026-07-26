import { Image, StyleSheet, Text, View } from 'react-native';

import { AURI_FRAMES, MOOD_LABEL, type MascotMood } from '@/constants/auriSprites';
import { fonts, radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  mood?: MascotMood;
  size?: number;
  showLabel?: boolean;
};

/**
 * Passport-style face card — dedicated headshot, not a zoomed full-body sprite.
 */
export function AuriCard({ mood = 'idle', size = 56, showLabel = false }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View
        style={[
          styles.frame,
          {
            width: size,
            height: size,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceHighlight,
            borderColor: colors.primary,
          },
        ]}
      >
        <Image
          source={AURI_FRAMES.face}
          resizeMode="cover"
          style={{ width: size, height: size }}
        />
      </View>
      {showLabel ? (
        <Text
          numberOfLines={1}
          style={[styles.label, { color: colors.textMuted, fontFamily: fonts.body }]}
        >
          {MOOD_LABEL[mood]}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
  },
});
