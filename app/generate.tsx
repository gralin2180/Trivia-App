import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { OptionChip } from '@/components/generate/OptionChip';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { generateDeckFromTopic } from '@/lib/ai/generateDeck';
import { colors, fontSize, spacing } from '@/constants/theme';
import type { DifficultyLevel, StudyMode } from '@/types/generate';

export default function GenerateSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ topic?: string }>();
  const topic = (params.topic ?? '').trim();

  const [mode, setMode] = useState<StudyMode>('study');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [customPrompt, setCustomPrompt] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    if (!topic) {
      setIsError(true);
      setMessage('No topic provided. Go back and enter a topic first.');
      return;
    }

    setIsLoading(true);
    setMessage('Generating your deck... This may take 10–20 seconds.');
    setIsError(false);

    const result = await generateDeckFromTopic({
      topic,
      mode,
      difficulty,
      customPrompt: customPrompt.trim() || undefined,
    });

    setIsLoading(false);

    if (result.error || !result.deckId) {
      setIsError(true);
      setMessage(result.error ?? 'Could not generate deck.');
      return;
    }

    if (mode === 'quiz') {
      router.replace(`/quiz/${result.deckId}`);
      return;
    }

    router.replace(`/study/${result.deckId}`);
  }

  if (!topic) {
    return (
      <Screen>
        <View style={styles.card}>
          <Text style={styles.title}>Missing topic</Text>
          <Text style={styles.subtitle}>Go back to Home and enter what you want to learn.</Text>
          <Button label="Back to Home" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Your topic</Text>
          <Text style={styles.topicTitle}>{topic}</Text>
          <Text style={styles.subtitle}>Choose how you want to learn, then generate your deck.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Mode</Text>
          <View style={styles.row}>
            <OptionChip label="Study" selected={mode === 'study'} onPress={() => setMode('study')} />
            <OptionChip label="Quiz" selected={mode === 'quiz'} onPress={() => setMode('quiz')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Difficulty</Text>
          <View style={styles.row}>
            <OptionChip
              label="Easy"
              selected={difficulty === 'easy'}
              onPress={() => setDifficulty('easy')}
            />
            <OptionChip
              label="Medium"
              selected={difficulty === 'medium'}
              onPress={() => setDifficulty('medium')}
            />
            <OptionChip
              label="Hard"
              selected={difficulty === 'hard'}
              onPress={() => setDifficulty('hard')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Custom prompt (optional)</Text>
          <Text style={styles.hint}>
            Add extra instructions so the AI makes better cards for you.
          </Text>
          <TextInput
            value={customPrompt}
            onChangeText={setCustomPrompt}
            placeholder='e.g. "Focus on interview prep" or "Explain like I am 12"'
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            editable={!isLoading}
          />
        </View>

        <Button
          label={isLoading ? 'Generating...' : 'Generate deck'}
          onPress={handleGenerate}
        />

        {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {message ? (
          <Text style={[styles.message, isError && styles.errorText]}>{message}</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topicTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    lineHeight: 22,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.primary,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
});
