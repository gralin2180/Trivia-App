import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { createSessionFromUrl } from '@/lib/auth/oauth';
import { colors, fontSize, spacing } from '@/constants/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function finishAuth() {
      const url = await Linking.getInitialURL();
      if (!url) {
        setError('No sign-in response received.');
        return;
      }

      const authError = await createSessionFromUrl(url);
      if (authError) {
        setError(authError);
        return;
      }

      router.replace('/(tabs)');
    }

    finishAuth();
  }, [router]);

  return (
    <Screen style={styles.centered}>
      {error ? (
        <View style={styles.box}>
          <Text style={styles.title}>Sign in failed</Text>
          <Text style={styles.message}>{error}</Text>
        </View>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loading}>Finishing sign in...</Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  loading: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  box: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.error,
    lineHeight: 20,
    textAlign: 'center',
  },
});
