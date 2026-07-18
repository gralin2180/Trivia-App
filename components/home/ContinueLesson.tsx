import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { colors, fontSize, spacing } from '@/constants/theme';

type ContinueLessonProps = {
  topic: string;
  progress: number;
  onPress: () => void;
};

export function ContinueLesson({ topic, progress, onPress }: ContinueLessonProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.badge}>NEXT LESSON</Text>
      <Text style={styles.title} numberOfLines={1}>
        {topic}
      </Text>
      <Text style={styles.meta}>{progress}% complete</Text>
      <Button label="Continue" onPress={onPress} icon="▶️" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary + '66',
    padding: spacing.md,
    gap: spacing.xs,
  },
  badge: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: fontSize.xs,
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: fontSize.lg,
  },
  meta: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
});
