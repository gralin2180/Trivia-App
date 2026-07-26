import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuriMascot } from '@/components/mascot/AuriMascot';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ONBOARDING_LINES } from '@/lib/mascotCoach';
import { saveOnboardingComplete } from '@/lib/settings';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { continueAsGuest } = useAuth();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const current = ONBOARDING_LINES[index];
  const isLast = index >= ONBOARDING_LINES.length - 1;

  async function finish(path: '/(tabs)' | '/(auth)/login' | '/(auth)/signup') {
    if (busy) return;
    setBusy(true);
    try {
      await saveOnboardingComplete();
      if (path === '/(tabs)') {
        // Don't block forever on anonymous auth — local guest is enough to enter
        await Promise.race([
          continueAsGuest(),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      }
      router.replace(path);
    } catch {
      router.replace(path);
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (busy) return;
    if (!isLast) {
      setIndex((i) => Math.min(i + 1, ONBOARDING_LINES.length - 1));
    }
  }

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <LinearGradient colors={[...colors.heroGradient]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glow, { backgroundColor: colors.glowPrimary }]} />

      <View style={styles.topBar}>
        <Text style={[styles.brand, { color: colors.primary, fontFamily: fonts.display }]}>
          {brand.name}
        </Text>
        <Pressable onPress={() => finish('/(tabs)')} disabled={busy} hitSlop={12}>
          <Text style={[styles.skip, { color: colors.textSecondary, fontFamily: fonts.bodyMedium }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      <View style={styles.mascotStage}>
        <AuriMascot size={168} mood={current.mood} />
        <Text style={[styles.mascotLabel, { color: colors.primary, fontFamily: fonts.bodyMedium }]}>
          {brand.mascot.name} · {brand.mascot.title}
        </Text>
      </View>

      <View style={styles.slide}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
          {current.title}
        </Text>
        <Text style={[styles.body, { color: colors.textMuted, fontFamily: fonts.body }]}>
          {current.body}
        </Text>
      </View>

      <View style={styles.dots}>
        {ONBOARDING_LINES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? colors.primary : colors.borderLight,
                width: i === index ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        {isLast ? (
          <>
            <Button
              label={busy ? 'Opening…' : 'Create free account'}
              onPress={() => finish('/(auth)/signup')}
              disabled={busy}
            />
            <Button
              label={busy ? 'Starting…' : 'Try ACUMEN as guest'}
              onPress={() => finish('/(tabs)')}
              variant="secondary"
              disabled={busy}
            />
            <Pressable
              onPress={() => finish('/(auth)/login')}
              disabled={busy}
              style={styles.signInLink}
            >
              <Text
                style={[styles.signInText, { color: colors.textMuted, fontFamily: fonts.bodyMedium }]}
              >
                I already have an account
              </Text>
            </Pressable>
          </>
        ) : (
          <Button label="Continue" onPress={next} disabled={busy} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  glow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  brand: {
    fontSize: fontSize.sm,
    letterSpacing: 3,
  },
  skip: {
    fontSize: fontSize.sm,
  },
  mascotStage: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  mascotLabel: {
    fontSize: fontSize.sm,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.display,
    lineHeight: 46,
    maxWidth: 320,
    textAlign: 'center',
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: 24,
    maxWidth: 340,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: radius.pill,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  signInText: {
    fontSize: fontSize.sm,
  },
});
