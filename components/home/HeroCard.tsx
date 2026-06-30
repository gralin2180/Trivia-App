import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import { GameCard } from "@/components/ui/GameCard";

type HeroCardProps = {
  name: string;
  streak: number;
};

export function HeroCard({ name, streak }: HeroCardProps) {
  return (
    <GameCard>
      <View style={styles.header}>
        <Text style={styles.streak}>🔥 {streak} Day Streak</Text>

        <Text style={styles.title}>
          Welcome back,
        </Text>

        <Text style={styles.name}>
          {name}
        </Text>

        <Text style={styles.subtitle}>
          Ready to learn something awesome today?
        </Text>
      </View>

      <View style={styles.xpContainer}>
        <View style={styles.xpFill} />
      </View>

      <Text style={styles.xpText}>
        Level 3 • 420 / 600 XP
      </Text>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },

  streak: {
    color: colors.warning,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },

  title: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },

  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },

  badge: {
    fontSize: fontSize.xs,
  },

  xpContainer: {
    marginTop: spacing.md,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },

  xpFill: {
    width: "70%",
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },

  xpText: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});