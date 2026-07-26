import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { createSessionFromUrl } from '@/lib/auth/oauth';
import { colors, fontSize, spacing } from '@/constants/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const url = Linking.useURL();
  const handledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.replace('/(tabs)');
    }
  }, [session, router]);

  useEffect(() => {
    if (session) {
      return;
    }

    let cancelled = false;
    let failTimer: ReturnType<typeof setTimeout> | undefined;

    async function finishAuth(href: string) {
      if (handledRef.current || cancelled || !href.includes('auth/callback')) {
        return;
      }
      handledRef.current = true;
      if (failTimer) {
        clearTimeout(failTimer);
      }

      const authError = await createSessionFromUrl(href);
      if (cancelled) {
        return;
      }

      if (authError) {
        handledRef.current = false;
        setError(authError);
        return;
      }

      router.replace('/(tabs)');
    }

    void (async () => {
      const initial = await Linking.getInitialURL();
      const href = url ?? initial;
      if (href) {
        await finishAuth(href);
      }
    })();

    failTimer = setTimeout(() => {
      if (!handledRef.current && !cancelled) {
        setError('No sign-in response received.');
      }
    }, 2500);

    const subscription = Linking.addEventListener('url', ({ url: eventUrl }) => {
      void finishAuth(eventUrl);
    });

    return () => {
      cancelled = true;
      if (failTimer) {
        clearTimeout(failTimer);
      }
      subscription.remove();
    };
  }, [url, session, router]);

  if (session) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loading}>Signed in…</Text>
      </Screen>
    );
  }

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
