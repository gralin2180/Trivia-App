import { Pressable, StyleSheet, Text, View } from 'react-native';

import { XPBar } from '@/components/ui/XPBar';
import { colors, fontSize, radius, shadows, spacing } from '@/constants/theme';
import { getDifficultyBadge } from '@/lib/gamification';
import type { DeckWithCardCount } from '@/types/database';

type DeckCardProps = {
  deck: DeckWithCardCount;
  progress?: number;
  onPress: () => void;
};

function getEmoji(title: string) {
  const t = title.toLowerCase();

  if (t.includes('doctor') || t.includes('medical')) return '🩺';
  if (t.includes('poker')) return '🎰';
  if (t.includes('history')) return '📜';
  if (t.includes('space')) return '🚀';
  if (t.includes('science')) return '🧪';
  if (t.includes('code') || t.includes('program')) return '💻';
  if (t.includes('music')) return '🎵';
  if (t.includes('cat')) return '🐱';
  if (t.includes('dog')) return '🐶';

  return '🧠';
}

export function DeckCard({ deck, progress = 0, onPress }: DeckCardProps) {
  const percent = Math.round(progress * 100);
  const badge = getDifficultyBadge(percent);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.left}>
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{getEmoji(deck.title)}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{deck.title}</Text>
            {deck.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {deck.description}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </View>

      <View style={styles.progress}>
        <XPBar progress={progress} />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.cards}>🃏 {deck.card_count} cards</Text>
        <Text style={styles.continue}>Play ▶</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderBottomColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  pressed: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 2,
    opacity: 0.95,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  left: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.md,
  },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  description: {
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 20,
    fontSize: fontSize.sm,
  },
  badge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.secondary + '66',
  },
  badgeText: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: fontSize.xs,
  },
  progress: {
    marginTop: 2,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cards: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  continue: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
});
