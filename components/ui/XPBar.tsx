import { View, StyleSheet } from "react-native";
import { colors, radius } from "@/constants/theme";

type Props = {
  progress: number; // 0 to 1
};

export function XPBar({ progress }: Props) {
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.max(0, Math.min(progress, 1)) * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});