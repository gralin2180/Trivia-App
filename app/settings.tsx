import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';

import { ASSISTANTS, AssistantOptionPreview } from '@/components/mascot/AssistantAvatar';
import { AuriCard } from '@/components/mascot/AuriCard';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import type { AssistantId } from '@/constants/assistants';
import { brand } from '@/constants/brand';
import { fonts, fontSize, radius, spacing, themeMeta, type VisualThemeId } from '@/constants/theme';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { useAssistant } from '@/contexts/AssistantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMascot } from '@/contexts/MascotContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useProgress } from '@/hooks/useProgress';
import { playSound } from '@/lib/sounds';
import { speakFeedback } from '@/lib/voice';
import {
  cancelStreakReminders,
  loadStreakRemindersEnabled,
  saveStreakRemindersEnabled,
  scheduleStreakReminders,
} from '@/lib/streakReminders';

function SettingRow({
  label,
  hint,
  value,
  onValueChange,
  colors,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
          {label}
        </Text>
        <Text style={[styles.rowHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
          {hint}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.textSecondary}
      />
    </View>
  );
}

function VolumeControl({
  label,
  value,
  disabled,
  onChange,
  onComplete,
  colors,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  onComplete?: (v: number) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const pct = Math.round(value * 100);
  return (
    <View style={[styles.volumeBlock, { opacity: disabled ? 0.45 : 1 }]}>
      <View style={styles.volumeHeader}>
        <Text style={[styles.rowLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
          {label}
        </Text>
        <Text style={[styles.volumePct, { color: colors.primary, fontFamily: fonts.bodyMedium }]}>
          {pct}%
        </Text>
      </View>
      <View style={styles.sliderRow}>
        <Ionicons name="volume-low-outline" size={18} color={colors.textSecondary} />
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={value}
          disabled={disabled}
          onValueChange={onChange}
          onSlidingComplete={onComplete}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
        <Ionicons name="volume-high-outline" size={18} color={colors.textSecondary} />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isGuest, signOut } = useAuth();
  const { colors, themeId, setThemeId } = useTheme();
  const { openChat, startTutorial } = useMascot();
  const { assistant, assistantId, setAssistantId } = useAssistant();
  const { hasAnyKey, keyCount } = useApiKeys();
  const { progress } = useProgress(user?.id);
  const {
    soundEnabled,
    musicEnabled,
    hapticsEnabled,
    voiceFeedbackEnabled,
    sfxVolume,
    musicVolume,
    displayName,
    setSoundEnabled,
    setMusicEnabled,
    setHapticsEnabled,
    setVoiceFeedbackEnabled,
    setSfxVolume,
    setMusicVolume,
    setDisplayName,
  } = useSettings();
  const [nameDraft, setNameDraft] = useState(displayName);
  const [streakReminders, setStreakRemindersState] = useState(true);

  useEffect(() => {
    setNameDraft(displayName);
  }, [displayName]);

  useEffect(() => {
    loadStreakRemindersEnabled().then(setStreakRemindersState);
  }, []);

  async function setStreakReminders(next: boolean) {
    setStreakRemindersState(next);
    await saveStreakRemindersEnabled(next);
    if (next) {
      await scheduleStreakReminders({ streak: progress.streak });
    } else {
      await cancelStreakReminders();
    }
  }

  async function saveName() {
    await setDisplayName(nameDraft);
  }

  return (
    <Screen style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text, fontFamily: fonts.bodyMedium }]}>
            Back
          </Text>
        </Pressable>

        <Text style={[styles.kicker, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
          SETTINGS
        </Text>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
          Preferences
        </Text>

        <Pressable
          onPress={() => openChat()}
          style={[
            styles.auriCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AuriCard mood="wave" size={54} />
          <View style={styles.auriText}>
            <Text style={[styles.rowLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              Ask {assistant.name}
            </Text>
            <Text style={[styles.rowHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
              {assistant.id === 'cat' ? brand.mascot.tagline : 'Your study assistant'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => startTutorial()}
          style={[
            styles.auriCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="map-outline" size={28} color={colors.primary} />
          <View style={styles.auriText}>
            <Text style={[styles.rowLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              Replay guided tour
            </Text>
            <Text style={[styles.rowHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
              Walk the screen and highlight the main spots
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            AI assistant
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Cat uses full Auri sprites. Dog, icon, and robot are placeholders for now.
          </Text>
          <View style={styles.assistantGrid}>
            {ASSISTANTS.map((opt) => {
              const active = assistantId === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => void setAssistantId(opt.id as AssistantId)}
                  style={[
                    styles.assistantOption,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.glowPrimary : colors.surface,
                    },
                  ]}
                >
                  <AssistantOptionPreview id={opt.id} size={48} />
                  <Text
                    style={[styles.themeLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[styles.themeBlurb, { color: colors.textMuted, fontFamily: fonts.body }]}
                    numberOfLines={2}
                  >
                    {opt.blurb}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            Sound & feel
          </Text>
          <SettingRow
            label="Sound effects"
            hint="Correct answers, level-ups, celebrations"
            value={soundEnabled}
            onValueChange={(next) => {
              setSoundEnabled(next);
              if (next) playSound('correct');
            }}
            colors={colors}
          />
          <VolumeControl
            label="SFX volume"
            value={sfxVolume}
            disabled={!soundEnabled}
            onChange={setSfxVolume}
            onComplete={(v) => {
              if (soundEnabled && v > 0.01) playSound('correct');
            }}
            colors={colors}
          />
          <SettingRow
            label="Background music"
            hint="Soft loop while you learn"
            value={musicEnabled}
            onValueChange={setMusicEnabled}
            colors={colors}
          />
          <VolumeControl
            label="Music volume"
            value={musicVolume}
            disabled={!musicEnabled}
            onChange={setMusicVolume}
            colors={colors}
          />
          <SettingRow
            label="Voice feedback"
            hint="Spoken study notes and right/wrong cues (device TTS)"
            value={voiceFeedbackEnabled}
            onValueChange={(next) => {
              setVoiceFeedbackEnabled(next);
              if (next) void speakFeedback(`Hi, I'm ${assistant.name}. Voice feedback is on.`);
            }}
            colors={colors}
          />
          <SettingRow
            label="Haptics"
            hint="Light taps on buttons (native devices)"
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            Appearance
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Light, dark, or quiet minimal — tap to switch.
          </Text>
          {(Object.keys(themeMeta) as VisualThemeId[]).map((id) => {
            const active = themeId === id;
            const prefix = id === 'day' ? 'Light' : id === 'dusk' ? 'Dark' : 'Clean';
            return (
              <Pressable
                key={id}
                onPress={() => setThemeId(id)}
                style={[
                  styles.themeOption,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.glowPrimary : colors.surface,
                  },
                ]}
              >
                <View style={styles.themeRow}>
                  <View style={[styles.themeIcon, { backgroundColor: colors.background }]}>
                    <Ionicons name={themeMeta[id].icon} size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.themeLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                      {prefix} · {themeMeta[id].label}
                    </Text>
                    <Text style={[styles.themeBlurb, { color: colors.textMuted, fontFamily: fonts.body }]}>
                      {themeMeta[id].blurb}
                    </Text>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            Streak reminders
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Gentle daytime nudge + evening “don’t lose your streak” save — Duo-style, max two a day.
          </Text>
          <SettingRow
            label="Smart reminders"
            hint="Routine + save slots. Rotating messages so they stay fresh."
            value={streakReminders}
            onValueChange={(next) => {
              void setStreakReminders(next);
            }}
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            Account
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Display name on the leaderboard
          </Text>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Your name"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                fontFamily: fonts.body,
              },
            ]}
            maxLength={24}
          />
          <Button label="Save name" onPress={saveName} variant="secondary" />

          <Text style={[styles.emailLabel, { color: colors.textSecondary, fontFamily: fonts.body }]}>
            {isGuest ? 'Browsing as guest' : 'Signed in as'}
          </Text>
          <Text style={[styles.email, { color: colors.text, fontFamily: fonts.bodyBold }]}>
            {isGuest ? 'Guest explorer' : (user?.email ?? 'Unknown')}
          </Text>

          {isGuest ? (
            <Button label="Create account / Sign in" onPress={() => router.push('/(auth)/login')} />
          ) : (
            <Button
              label="Sign out"
              variant="secondary"
              onPress={async () => {
                await signOut();
                router.replace('/(auth)/login');
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            AI models
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Pick a free model (Nemotron, Gemma, …) or add your own OpenRouter / Groq key.
          </Text>
          <Pressable
            onPress={() => router.push('/api-keys')}
            style={[
              styles.auriCard,
              {
                backgroundColor: colors.surface,
                borderColor: hasAnyKey ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name={hasAnyKey ? 'sparkles' : 'sparkles-outline'}
              size={26}
              color={hasAnyKey ? colors.primary : colors.textSecondary}
            />
            <View style={styles.auriText}>
              <Text style={[styles.rowLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                {hasAnyKey ? 'Manage models & keys' : 'Select AI model'}
              </Text>
              <Text style={[styles.rowHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {hasAnyKey
                  ? `${keyCount} key${keyCount === 1 ? '' : 's'} active · stored on this device only`
                  : 'No keys yet — you’re on the shared demo quota'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            About
          </Text>
          <Text style={[styles.about, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {brand.name} · Learn anything, keep your edge.{'\n'}
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
    paddingBottom: 48,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.sm },
  kicker: { fontSize: fontSize.xs, letterSpacing: 1.4, marginTop: spacing.sm },
  title: { fontSize: fontSize.display, letterSpacing: -0.6 },
  auriCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  auriText: { flex: 1, gap: 4 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg },
  sectionHint: { fontSize: fontSize.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  rowText: { flex: 1, gap: 4 },
  rowLabel: { fontSize: fontSize.md },
  rowHint: { fontSize: fontSize.sm, lineHeight: 18 },
  volumeBlock: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volumePct: { fontSize: fontSize.sm },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  slider: { flex: 1, height: 36 },
  themeOption: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  themeIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: { fontSize: fontSize.md },
  themeBlurb: { fontSize: fontSize.sm },
  assistantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  assistantOption: {
    width: '47%',
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.md,
  },
  emailLabel: { fontSize: fontSize.sm, marginTop: spacing.sm },
  email: { fontSize: fontSize.md, marginBottom: spacing.sm },
  about: { fontSize: fontSize.sm, lineHeight: 20 },
});
