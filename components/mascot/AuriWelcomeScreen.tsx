import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssistantAvatar } from '@/components/mascot/AssistantAvatar';
import { Button } from '@/components/ui/Button';
import { brand } from '@/constants/brand';
import { fonts, fontSize, spacing } from '@/constants/theme';
import { useAssistant } from '@/contexts/AssistantContext';
import { useMascot } from '@/contexts/MascotContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Full-screen open-app greeting: centered Auri, clean backdrop, no app chrome.
 * Dismiss reveals the main Learn tab underneath.
 */
export function AuriWelcomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { sessionGreeting, greetingStep, mood, advanceSessionGreeting } = useMascot();
  const { assistant } = useAssistant();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (!sessionGreeting) return;
    fade.setValue(0);
    rise.setValue(18);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(rise, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [sessionGreeting, greetingStep, fade, rise]);

  if (!sessionGreeting) return null;

  const isStats = greetingStep >= 1;
  const title = isStats ? sessionGreeting.statsTitle : sessionGreeting.helloTitle;
  const body = isStats ? sessionGreeting.statsBody : sessionGreeting.helloBody;
  const cta = isStats ? 'Let’s learn' : 'Got it';

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <LinearGradient colors={[...colors.heroGradient]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glow, { backgroundColor: colors.glowPrimary }]} />

      <Animated.View style={[styles.stage, { opacity: fade, transform: [{ translateY: rise }] }]}>
        <AssistantAvatar size={196} mood={mood} />
        <Text style={[styles.name, { color: colors.primary, fontFamily: fonts.bodyMedium }]}>
          {assistant.name}
          {assistant.id === 'cat' ? ` · ${brand.mascot.title}` : ''}
        </Text>

        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
          {title}
        </Text>
        <Text style={[styles.body, { color: colors.textMuted, fontFamily: fonts.body }]}>
          {body}
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Button label={cta} onPress={advanceSessionGreeting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 200,
    elevation: 200,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  glow: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.35,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  name: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  title: {
    fontSize: fontSize.display,
    lineHeight: 42,
    textAlign: 'center',
    maxWidth: 340,
    marginTop: spacing.sm,
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 340,
  },
  footer: {
    paddingBottom: spacing.md,
  },
});
