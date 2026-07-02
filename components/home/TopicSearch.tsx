import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

const SUGGESTED_TOPICS = ['🩺 Medicine', '🎰 Poker', '🚀 Space', '📜 History', '💻 Coding'];

export function TopicSearch() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function handleContinue(selectedTopic?: string) {
    const trimmed = (selectedTopic ?? topic).trim().replace(/^[\p{Emoji}\s]+/u, '');
    if (!trimmed) {
      setMessage('Type a topic you want to learn!');
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
      <Text style={styles.emoji}>✨</Text>
      <Text style={styles.title}>What do you want to learn?</Text>
      <Text style={styles.subtitle}>Pick a topic or type your own — we'll build a deck!</Text>

      <View style={styles.chips}>
        {SUGGESTED_TOPICS.map((t) => (
          <Pressable
            key={t}
            style={styles.chip}
            onPress={() => handleContinue(t)}
          >
            <Text style={styles.chipText}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Custom topic"
        value={topic}
        onChangeText={setTopic}
        placeholder="e.g. Roman Empire, jazz music..."
        onSubmitEditing={() => handleContinue()}
        returnKeyType="go"
      />
      <Button label="Let's go!" onPress={() => handleContinue()} icon="🎯" />
      {message ? <Text style={styles.error}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  chipText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.error,
    lineHeight: 20,
  },
});
