import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, fontSize, spacing } from '@/constants/theme';

export function TopicSearch() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function handleContinue() {
    const trimmed = topic.trim();
    if (!trimmed) {
      setMessage('Type a topic you want to learn, like "doctor" or "Roman Empire".');
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
      <Text style={styles.title}>What do you want to learn?</Text>
      <Text style={styles.subtitle}>
        Enter a topic, then choose study or quiz mode and difficulty.
      </Text>
      <Input
        label="Topic"
        value={topic}
        onChangeText={setTopic}
        placeholder="e.g. doctor, Japanese history, poker..."
        onSubmitEditing={handleContinue}
        returnKeyType="go"
      />
      <Button label="Continue" onPress={handleContinue} />
      {message ? <Text style={styles.error}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.error,
    lineHeight: 20,
  },
});
