import { StyleSheet, Text, View } from "react-native";

import { GameCard } from "@/components/ui/GameCard";
import { colors, fontSize, radius, spacing } from "@/constants/theme";

export function DailyQuest() {
  const progress = 6;
  const total = 10;

  return (
    <GameCard>
      <Text style={styles.badge}>⚔ DAILY QUEST</Text>

      <Text style={styles.title}>
        Study 10 cards
      </Text>

      <Text style={styles.reward}>
        Reward: ⭐ +150 XP
      </Text>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${(progress / total) * 100}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.progress}>
        {progress} / {total} completed
      </Text>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  badge: {
    color: colors.warning,
    fontWeight: "700",
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },

  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "800",
  },

  reward: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.warning,
    borderRadius: radius.pill,
  },

  progress: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontWeight: "600",
  },
});