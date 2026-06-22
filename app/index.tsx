import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { config } from '@/constants/config';
import { colors, fontSize, spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>Trivia Flashcards</Text>
        <Text style={styles.subtitle}>
          Study with flashcards, quiz yourself, and track progress.
        </Text>
        <Text style={styles.phase}>Phase 1: Project scaffold is ready.</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Supabase status</Text>
        <Text style={styles.statusText}>
          {config.isSupabaseConfigured
            ? 'Environment variables detected.'
            : 'Not configured yet — copy .env.example to .env in Phase 5.'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Link href="/(auth)/login" asChild>
          <Button label="Go to Login (preview)" onPress={() => {}} />
        </Link>
        <Link href="/(tabs)" asChild>
          <Button label="Go to App Tabs (preview)" onPress={() => {}} variant="secondary" />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  hero: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    lineHeight: 24,
  },
  phase: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statusTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
