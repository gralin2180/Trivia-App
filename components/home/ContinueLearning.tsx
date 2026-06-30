import { StyleSheet, Text, View } from "react-native";

import { GameCard } from "@/components/ui/GameCard";
import { Button } from "@/components/ui/Button";
import { colors, fontSize, spacing } from "@/constants/theme";

type Props = {
  topic: string;
  progress: number;
  onPress?: () => void;
};

export function ContinueLearning({
  topic,
  progress,
  onPress,
}: Props) {
  return (
    <GameCard>

      <Text style={styles.badge}>
        Continue Learning
      </Text>

      <Text style={styles.title}>
        {topic}
      </Text>

      <Text style={styles.subtitle}>
        {progress}% completed
      </Text>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress}%`,
            },
          ]}
        />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button
            label="Resume"
            onPress={onPress ?? (() => {})}
        />
      </View>

    </GameCard>
  );
}

const styles = StyleSheet.create({
  badge: {
    color: colors.primary,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },

  title: {
    color: colors.text,
    fontWeight: "800",
    fontSize: fontSize.lg,
  },

  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
});