import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { fonts, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import {
  dismissRevisionNudgeToday,
  shouldShowRevisionNudge,
  type LastStudiedTopic,
} from '@/lib/weakPoints';

type Props = {
  onQuiz: (deckId: string) => void;
  onStudy: (deckId: string) => void;
};

/** Homepage prompt: quiz yourself on yesterday’s / last topic. */
export function RevisionNudge({ onQuiz, onStudy }: Props) {
  const { colors } = useTheme();
  const [topic, setTopic] = useState<LastStudiedTopic | null>(null);

  useEffect(() => {
    void shouldShowRevisionNudge().then(setTopic);
  }, []);

  if (!topic) return null;

  async function dismiss() {
    await dismissRevisionNudgeToday();
    setTopic(null);
  }

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border }]}>
      <Text style={[styles.badge, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
        REVISION
      </Text>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>
        Quiz yourself on {topic.title}?
      </Text>
      <Text style={[styles.meta, { color: colors.textMuted, fontFamily: fonts.body }]}>
        You studied this recently — a quick quiz locks it in for tomorrow.
      </Text>
      <View style={styles.actions}>
        <Button label="Take a quiz" onPress={() => onQuiz(topic.deckId)} />
        <Button label="Study again" onPress={() => onStudy(topic.deckId)} variant="secondary" />
      </View>
      <Pressable onPress={() => void dismiss()} hitSlop={8}>
        <Text style={[styles.dismiss, { color: colors.textSecondary, fontFamily: fonts.body }]}>
          Not now
        </Text>
      </Pressable>
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
    lineHeight: 20,
  },
  actions: {
    gap: spacing.sm,
  },
  dismiss: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
