import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuriCard } from '@/components/mascot/AuriCard';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import {
  AI_ACCESS_MODES,
  BUILTIN_FREE_MODELS,
  type AiAccessMode,
} from '@/constants/aiModels';
import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  AI_PROVIDERS,
  looksLikeValidKey,
  maskApiKey,
  type AiProvider,
  type AiProviderId,
} from '@/lib/apiKeys';

function ModelRow({
  id,
  label,
  blurb,
  tier,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  blurb: string;
  tier: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.modelRow,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.modelLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
            {label}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.glowPrimary }]}>
            <Text style={[styles.badgeText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
              {tier === 'quality' ? 'DEEP' : tier === 'fast' ? 'FAST' : 'FREE'}
            </Text>
          </View>
        </View>
        <Text style={[styles.modelBlurb, { color: colors.textMuted, fontFamily: fonts.body }]}>
          {blurb}
        </Text>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? colors.primary : colors.textSecondary}
      />
    </Pressable>
  );
}

function AccessModeRow({
  id,
  label,
  blurb,
  selected,
  onSelect,
}: {
  id: AiAccessMode;
  label: string;
  blurb: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.modeRow,
        {
          backgroundColor: selected ? colors.glowPrimary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.modeLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
        {label}
      </Text>
      <Text style={[styles.modeBlurb, { color: colors.textMuted, fontFamily: fonts.body }]}>
        {blurb}
      </Text>
    </Pressable>
  );
}

function ProviderRow({
  provider,
  savedKey,
  onSave,
  onRemove,
}: {
  provider: AiProvider;
  savedKey?: string;
  onSave: (value: string) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const isSaved = Boolean(savedKey);
  const draftLooksOff = draft.trim().length > 0 && !looksLikeValidKey(provider.id, draft);

  async function save() {
    const value = draft.trim();
    if (!value) return;
    await onSave(value);
    setDraft('');
    setIsEditing(false);
    setStatus('Saved on this device.');
  }

  async function remove() {
    await onRemove();
    setDraft('');
    setIsEditing(false);
    setStatus('Key removed.');
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isSaved ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              {provider.label}
            </Text>
            {provider.free ? (
              <View style={[styles.badge, { backgroundColor: colors.glowPrimary }]}>
                <Text style={[styles.badgeText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                  FREE TIER
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.cardBlurb, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {provider.blurb}
          </Text>
        </View>
        <Ionicons
          name={isSaved ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={isSaved ? colors.primary : colors.textSecondary}
        />
      </View>

      {isSaved && !isEditing ? (
        <View style={[styles.savedRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="key-outline" size={16} color={colors.primary} />
          <Text style={[styles.savedKey, { color: colors.text, fontFamily: fonts.body }]}>
            {maskApiKey(savedKey!)}
          </Text>
        </View>
      ) : null}

      {!isSaved || isEditing ? (
        <>
          <TextInput
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              setStatus(null);
            }}
            placeholder={`${provider.prefix}...`}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: draftLooksOff ? colors.warning : colors.border,
                color: colors.text,
                fontFamily: fonts.body,
              },
            ]}
          />
          {draftLooksOff ? (
            <Text style={[styles.warn, { color: colors.warning, fontFamily: fonts.body }]}>
              {provider.label} keys usually start with “{provider.prefix}”. Saving anyway is fine.
            </Text>
          ) : null}
        </>
      ) : null}

      {status ? (
        <Text style={[styles.status, { color: colors.primary, fontFamily: fonts.bodyMedium }]}>
          {status}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {isSaved && !isEditing ? (
          <>
            <Button label="Replace key" variant="secondary" onPress={() => setIsEditing(true)} />
            <Button label="Remove" variant="danger" onPress={remove} />
          </>
        ) : (
          <>
            <Button label="Save key" onPress={save} disabled={!draft.trim()} />
            {isSaved ? (
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => {
                  setDraft('');
                  setIsEditing(false);
                }}
              />
            ) : null}
          </>
        )}
      </View>

      <Pressable
        onPress={() => Linking.openURL(provider.consoleUrl)}
        style={styles.linkRow}
        hitSlop={8}
      >
        <Ionicons name="open-outline" size={15} color={colors.primary} />
        <Text style={[styles.link, { color: colors.primary, fontFamily: fonts.bodyMedium }]}>
          Get a {provider.label} key
        </Text>
      </Pressable>
    </View>
  );
}

export default function ApiKeysScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    keys,
    keyCount,
    hasAnyKey,
    preferredModelId,
    accessMode,
    setKey,
    removeKey,
    setPreferredModelId,
    setAccessMode,
  } = useApiKeys();

  return (
    <Screen style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text, fontFamily: fonts.bodyMedium }]}>
            Settings
          </Text>
        </Pressable>

        <Text style={[styles.kicker, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
          AI MODELS
        </Text>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
          Select model
        </Text>

        <View
          style={[
            styles.auriNote,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AuriCard mood="explain" size={54} />
          <Text style={[styles.auriText, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Pick a free model like OpenCode. If it is busy, ACUMEN walks a long fallback chain
            (Nemotron → Ling → Gemma → Groq → Ollama).
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
          Free models on ACUMEN
        </Text>
        {BUILTIN_FREE_MODELS.map((model) => (
          <ModelRow
            key={model.id}
            id={model.id}
            label={model.label}
            blurb={model.blurb}
            tier={model.tier}
            selected={preferredModelId === model.id}
            onSelect={() => void setPreferredModelId(model.id)}
          />
        ))}

        <Text style={[styles.sectionLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
          How you connect
        </Text>
        {AI_ACCESS_MODES.map((mode) => (
          <AccessModeRow
            key={mode.id}
            id={mode.id}
            label={mode.label}
            blurb={mode.blurb}
            selected={accessMode === mode.id}
            onSelect={() => void setAccessMode(mode.id)}
          />
        ))}

        <View style={[styles.noteBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.noteTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
            Not like OpenCode yet
          </Text>
          <Text style={[styles.noteBody, { color: colors.textMuted, fontFamily: fonts.body }]}>
            ChatGPT Plus “browser login” and OpenCode-only models (Hy3, Big Pickle, Muse Spark)
            need their proxy — we use OpenRouter’s free pool plus your API keys instead.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
          Add keys from popular providers
        </Text>
        <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
          {hasAnyKey
            ? `${keyCount} key${keyCount === 1 ? '' : 's'} on this device — your quota, no shared cap.`
            : 'Optional — unlock your own quota on OpenRouter, Groq, Gemini, or OpenAI.'}
        </Text>

        {AI_PROVIDERS.map((provider) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            savedKey={keys[provider.id]}
            onSave={(value) => setKey(provider.id as AiProviderId, value)}
            onRemove={() => removeKey(provider.id as AiProviderId)}
          />
        ))}

        <View style={[styles.privacy, { borderColor: colors.border }]}>
          <Text style={[styles.privacyTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
            Where your keys live
          </Text>
          <Text style={[styles.privacyBody, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Keys stay on this device and ride along with deck requests only. Model choice is saved
            locally too. Remove any time to fall back to the ACUMEN shared pool.
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
    gap: spacing.sm,
    paddingBottom: 60,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.sm },
  kicker: { fontSize: fontSize.xs, letterSpacing: 1.4, marginTop: spacing.sm },
  title: { fontSize: fontSize.display, letterSpacing: -0.6, marginBottom: spacing.xs },
  sectionLabel: { fontSize: fontSize.md, marginTop: spacing.md },
  sectionHint: { fontSize: fontSize.sm, lineHeight: 18, marginBottom: spacing.xs },
  auriNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  auriText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  modelLabel: { fontSize: fontSize.md },
  modelBlurb: { fontSize: fontSize.sm, lineHeight: 18 },
  modeRow: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  modeLabel: { fontSize: fontSize.sm },
  modeBlurb: { fontSize: fontSize.sm, lineHeight: 18 },
  noteBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  noteTitle: { fontSize: fontSize.sm },
  noteBody: { fontSize: fontSize.sm, lineHeight: 20 },
  card: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  cardTitle: { fontSize: fontSize.md },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 9, letterSpacing: 0.8 },
  cardBlurb: { fontSize: fontSize.sm, lineHeight: 18 },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  savedKey: { fontSize: fontSize.sm, letterSpacing: 1 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.md,
  },
  warn: { fontSize: fontSize.xs, lineHeight: 16 },
  status: { fontSize: fontSize.xs },
  actions: { gap: spacing.xs },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { fontSize: fontSize.sm },
  privacy: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  privacyTitle: { fontSize: fontSize.sm },
  privacyBody: { fontSize: fontSize.sm, lineHeight: 20 },
});
