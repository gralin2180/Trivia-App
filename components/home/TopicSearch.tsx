import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const SUGGESTED_TOPICS = ['AI at uni', 'Data literacy', 'Cyber basics', 'Medicine', 'Coding', 'Finance'];

export function TopicSearch() {
  const router = useRouter();
  const { colors } = useTheme();
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function handleContinue(selectedTopic?: string) {
    const trimmed = (selectedTopic ?? topic).trim();
    if (!trimmed) {
      setMessage('Type a topic you want to learn.');
      return;
    }

    setMessage(null);
    router.push({
      pathname: '/generate',
      params: { topic: trimmed },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
        Learn anything.
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
        Pick a topic — ACUMEN builds your deck.
      </Text>

      <View style={styles.chips}>
        {SUGGESTED_TOPICS.map((t) => (
          <Pressable
            key={t}
            style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleContinue(t)}
          >
            <Text style={[styles.chipText, { color: colors.text, fontFamily: fonts.bodyMedium }]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Custom topic"
        value={topic}
        onChangeText={setTopic}
        placeholder="e.g. Roman Empire, jazz theory…"
        onSubmitEditing={() => handleContinue()}
        returnKeyType="go"
      />
      <Button label="Build my deck" onPress={() => handleContinue()} />
      {message ? (
        <Text style={[styles.error, { color: colors.error, fontFamily: fonts.body }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.display,
    lineHeight: 42,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: fontSize.sm,
  },
  error: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
