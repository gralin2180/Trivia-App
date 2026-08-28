import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Home nudge about bringing your own AI key. Hidden for good once dismissed
 * with the X, and never shown to people who already added a key.
 */
export function ApiKeyPopup() {
  const router = useRouter();
  const { colors } = useTheme();
  const { hasAnyKey, isLoading, bannerDismissed, dismissBanner } = useApiKeys();

  if (isLoading || hasAnyKey || bannerDismissed) return null;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.surface, borderColor: colors.primary },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconBubble, { backgroundColor: colors.glowPrimary }]}>
          <Ionicons name="key" size={18} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bodyBold }]}>
          Add your AI key
        </Text>
        <Pressable
          onPress={() => void dismissBanner()}
          hitSlop={12}
          accessibilityLabel="Dismiss API key tip"
          style={styles.close}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={[styles.body, { color: colors.textMuted, fontFamily: fonts.body }]}>
        Free Nemotron and Gemma models are built in. Add your own OpenRouter or Groq key in
        Settings if you want your quota instead of the shared demo limit.
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push('/api-keys')}
          style={[styles.cta, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.ctaText, { color: colors.textOnPrimary, fontFamily: fonts.bodyBold }]}>
            Choose AI model
          </Text>
        </Pressable>
        <Pressable onPress={() => void dismissBanner()} style={styles.later} hitSlop={8}>
          <Text style={[styles.laterText, { color: colors.textSecondary, fontFamily: fonts.body }]}>
            Not now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: fontSize.md },
  close: { padding: 2 },
  body: { fontSize: fontSize.sm, lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cta: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  ctaText: { fontSize: fontSize.sm },
  later: { paddingVertical: 10 },
  laterText: { fontSize: fontSize.sm },
});
