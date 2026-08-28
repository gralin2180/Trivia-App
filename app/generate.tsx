import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { OptionChip } from '@/components/generate/OptionChip';
import { WaitGame } from '@/components/generate/WaitGame';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { generateDeckFromTopic } from '@/lib/ai/generateDeck';
import {
  bumpGuestDeckGens,
  guestGensRemaining,
  guestNeedsSubscription,
  GUEST_FREE_DECK_LIMIT,
} from '@/lib/guestLimits';
import { bumpQuestProgress } from '@/lib/quests';
import { getSyllabusGap } from '@/lib/syllabusGaps';
import type { DifficultyLevel, StudyMode } from '@/types/generate';

export default function GenerateSetupScreen() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const params = useLocalSearchParams<{ topic?: string; gapId?: string }>();
  const gap = useMemo(() => {
    const id = Array.isArray(params.gapId) ? params.gapId[0] : params.gapId;
    return id ? getSyllabusGap(id) : undefined;
  }, [params.gapId]);

  const topic = (gap?.topic ?? params.topic ?? '').trim();

  const [mode, setMode] = useState<StudyMode>('study');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [customPrompt, setCustomPrompt] = useState(gap?.deckPrompt ?? '');
  const [teachPrompt, setTeachPrompt] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guestLeft, setGuestLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isGuest) {
      setGuestLeft(null);
      return;
    }
    void guestGensRemaining().then(setGuestLeft);
  }, [isGuest]);

  async function handleGenerate() {
    if (!topic) {
      setIsError(true);
      setMessage('No topic provided. Go back to Home and enter what you want to learn.');
      return;
    }

    if (isGuest && (await guestNeedsSubscription())) {
      router.push('/subscribe');
      return;
    }

    setIsLoading(true);
    setMessage('Taking time to plan facts, then write cards. Hop while you wait.');
    setIsError(false);

    const promptParts = [
      customPrompt.trim(),
      mode === 'study' && teachPrompt.trim()
        ? `Teach style for study notes: ${teachPrompt.trim()}`
        : '',
    ].filter(Boolean);

    const result = await generateDeckFromTopic({
      topic,
      mode,
      difficulty,
      customPrompt: promptParts.length ? promptParts.join('\n\n') : undefined,
    });

    setIsLoading(false);

    if (result.error || !result.deckId) {
      setIsError(true);
      setMessage(result.error ?? 'Could not generate deck.');
      return;
    }

    void bumpQuestProgress('generate');

    let hitLimit = false;
    // Reused library decks are free — don't burn a guest generation.
    if (isGuest && !result.reused) {
      const gens = await bumpGuestDeckGens();
      const left = Math.max(0, GUEST_FREE_DECK_LIMIT - gens);
      setGuestLeft(left);
      hitLimit = gens >= GUEST_FREE_DECK_LIMIT;
    }

    if (mode === 'quiz') {
      router.replace(`/quiz/${result.deckId}`);
    } else {
      router.replace(`/study/${result.deckId}`);
    }

    if (hitLimit) {
      setTimeout(() => router.push('/subscribe'), 600);
    }
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

  if (isLoading) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.waitWrap}>
          <Text style={styles.eyebrow}>STILL THINKING</Text>
          <Text style={styles.topicTitle}>{gap?.title ?? topic}</Text>
          <Text style={styles.subtitle}>
            Planning facts, then writing questions. Tap the lane to hop while you wait.
          </Text>
          <WaitGame />
          {message ? (
            <Text style={[styles.message, isError && styles.errorText]}>{message}</Text>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>{gap ? 'Syllabus gap' : 'Your topic'}</Text>
          <Text style={styles.topicTitle}>{gap?.title ?? topic}</Text>
          {gap ? (
            <>
              <Text style={styles.subtitle}>{gap.lagSummary}</Text>
              <View style={styles.statList}>
                {gap.stats.map((stat) => (
                  <Text key={stat} style={styles.statLine}>
                    • {stat}
                  </Text>
                ))}
              </View>
              <Text style={styles.bridgeTitle}>Bridge skills</Text>
              {gap.bridgeSkills.map((skill) => (
                <Text key={skill} style={styles.statLine}>
                  → {skill}
                </Text>
              ))}
            </>
          ) : (
            <Text style={styles.subtitle}>Choose how you want to learn, then generate your deck.</Text>
          )}
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
          <Text style={styles.sectionTitle}>3. Custom prompt {gap ? '(pre-filled)' : '(optional)'}</Text>
          <Text style={styles.hint}>
            {gap
              ? 'Tweak this prompt so the deck focuses on the exact gap you care about.'
              : 'Add extra instructions so the AI makes better cards for you.'}
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

        {mode === 'study' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. How should the AI teach? (optional)</Text>
            <Text style={styles.hint}>
              Study mode shows bullet notes first. Tell the AI how to teach — tone, depth, examples.
            </Text>
            <TextInput
              value={teachPrompt}
              onChangeText={setTeachPrompt}
              placeholder='e.g. "Use short bullets and real-world examples" or "Socratic — hint, don’t spoil"'
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={styles.textArea}
              editable={!isLoading}
            />
          </View>
        ) : null}

        <Button
          label={gap ? 'Build bridge deck' : 'Generate deck'}
          onPress={handleGenerate}
        />

        {isGuest && guestLeft != null ? (
          <Text style={styles.guestQuota}>
            {guestLeft === 0
              ? 'Free guest decks used up — create an account to continue.'
              : `${guestLeft} free guest deck${guestLeft === 1 ? '' : 's'} left`}
          </Text>
        ) : null}

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
  statList: { gap: 4, marginTop: spacing.xs },
  statLine: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
  bridgeTitle: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
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
  guestQuota: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
  },
  waitWrap: {
    padding: spacing.md,
    gap: spacing.md,
    flex: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
});
