import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '@/constants/theme';

type FlashcardProps = {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
};

export function Flashcard({ front, back, isFlipped, onFlip }: FlashcardProps) {
  return (
    <Pressable onPress={onFlip} style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      <View style={styles.card}>
        <Text style={styles.label}>{isFlipped ? 'Answer' : 'Question'}</Text>
        <Text style={styles.text}>{isFlipped ? back : front}</Text>
        <Text style={styles.hint}>{isFlipped ? 'Tap to see question' : 'Tap to reveal answer'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  pressed: {
    opacity: 0.95,
  },
  card: {
    minHeight: 280,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  text: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 30,
    textAlign: 'center',
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
