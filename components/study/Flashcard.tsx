import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, gradients, radius, spacing } from '@/constants/theme';

type FlashcardProps = {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
};

export function Flashcard({ front, back, isFlipped, onFlip }: FlashcardProps) {
  return (
    <Pressable onPress={onFlip} style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      <LinearGradient
        colors={isFlipped ? ['#1A2840', '#243049'] : [...gradients.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.labelBadge}>
          <Text style={styles.label}>{isFlipped ? '💡 Answer' : '❓ Question'}</Text>
        </View>
        <Text style={styles.text}>{isFlipped ? back : front}</Text>
        <Text style={styles.hint}>
          {isFlipped ? 'Tap to flip back' : 'Tap to reveal answer'}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  card: {
    minHeight: 200,
    maxHeight: 320,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.borderLight,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  labelBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 28,
    textAlign: 'center',
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
