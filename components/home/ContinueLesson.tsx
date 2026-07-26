import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { fonts, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type ContinueLessonProps = {
  topic: string;
  progress: number;
  onPress: () => void;
};

export function ContinueLesson({ topic, progress, onPress }: ContinueLessonProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border }]}>
      <Text style={[styles.badge, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
        CONTINUE
      </Text>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]} numberOfLines={1}>
        {topic}
      </Text>
      <Text style={[styles.meta, { color: colors.textMuted, fontFamily: fonts.body }]}>
        {progress}% complete
      </Text>
      <Button label="Continue" onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  badge: {
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: fontSize.lg,
  },
  meta: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
});
