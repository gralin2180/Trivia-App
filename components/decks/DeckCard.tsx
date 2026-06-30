import { Pressable, StyleSheet, Text, View } from "react-native";

import { XPBar } from "@/components/ui/XPBar";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import type { DeckWithCardCount } from "@/types/database";

type DeckCardProps = {
  deck: DeckWithCardCount;
  onPress: () => void;
};

function getEmoji(title: string) {
  const t = title.toLowerCase();

  if (t.includes("doctor") || t.includes("medical")) return "🩺";
  if (t.includes("poker")) return "🎰";
  if (t.includes("history")) return "📜";
  if (t.includes("space")) return "🚀";
  if (t.includes("science")) return "🧪";
  if (t.includes("code") || t.includes("program")) return "💻";
  if (t.includes("music")) return "🎵";
  if (t.includes("cat")) return "🐱";
  if (t.includes("dog")) return "🐶";

  return "🧠";
}

export function DeckCard({ deck, onPress }: DeckCardProps) {
  const progress = 0.65;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.top}>

        <View style={styles.left}>
          <Text style={styles.emoji}>
            {getEmoji(deck.title)}
          </Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {deck.title}
            </Text>

            {deck.description ? (
              <Text style={styles.description}>
                {deck.description}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            Beginner
          </Text>
        </View>

      </View>

      <View style={styles.progress}>
        <XPBar progress={progress} />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.cards}>
          {deck.card_count} cards
        </Text>

        <Text style={styles.continue}>
          ▶ Continue
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },

  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },

  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  left: {
    flexDirection: "row",
    flex: 1,
    gap: spacing.md,
  },

  emoji: {
    fontSize: 34,
  },

  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "800",
  },

  description: {
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },

  badge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  badgeText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: fontSize.xs,
  },

  progress: {
    marginTop: 2,
  },

  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cards: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },

  continue: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },

});