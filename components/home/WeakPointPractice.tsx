import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchPracticeMix, type WeakPointCard } from '@/lib/weakPoints';

type Props = {
  userId: string | undefined;
  onOpenDeck: (deckId: string) => void;
};

/**
 * Random mix of wrong answers (weak points) + some corrects.
 * Order reshuffles each load so it doesn’t lead every login.
 */
export function WeakPointPractice({ userId, onOpenDeck }: Props) {
  const { colors } = useTheme();
  const [cards, setCards] = useState<WeakPointCard[]>([]);
  const [mixed, setMixed] = useState(false);

  useEffect(() => {
    if (!userId) {
      setCards([]);
      return;
    }
    // ~75% of logins show the strip so weak points don’t lead every visit.
    const day = new Date().toISOString().slice(0, 10);
    let hash = 0;
    const seed = `${userId}:${day}`;
    for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    if (hash % 4 === 0) {
      setCards([]);
      return;
    }

    let cancelled = false;
    void fetchPracticeMix(userId, 5).then((result) => {
      if (cancelled) return;
      setCards(result.weaks);
      setMixed(result.includeCorrectHint);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId || cards.length === 0) return null;

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>
        Weak points
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
        {mixed
          ? 'Mostly missed cards, plus a few you got right — shuffled each visit.'
          : 'Cards you got wrong — shuffled so practice stays fresh.'}
      </Text>
      <View style={styles.list}>
        {cards.map((card) => (
          <Pressable
            key={card.cardId}
            onPress={() => onOpenDeck(card.deckId)}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.info}>
              <Text
                style={[styles.prompt, { color: colors.text, fontFamily: fonts.bodyBold }]}
                numberOfLines={2}
              >
                {card.front}
              </Text>
              <Text
                style={[styles.meta, { color: colors.textSecondary, fontFamily: fonts.body }]}
                numberOfLines={1}
              >
                {card.deckTitle}
              </Text>
            </View>
            <Text style={[styles.cta, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
              Review
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  prompt: {
    fontSize: fontSize.sm,
  },
  meta: {
    fontSize: fontSize.xs,
  },
  cta: {
    fontSize: fontSize.sm,
  },
});
