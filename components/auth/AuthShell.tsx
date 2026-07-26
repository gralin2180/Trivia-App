import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { brand } from '@/constants/brand';
import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const { colors } = useTheme();

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <LinearGradient colors={[...colors.heroGradient]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
              <Text style={[styles.logoLetter, { color: colors.textOnPrimary, fontFamily: fonts.display }]}>
                A
              </Text>
            </View>
            <Text style={[styles.brand, { color: colors.primary, fontFamily: fonts.display }]}>
              {brand.name}
            </Text>
            <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
              {subtitle}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {children}
          </View>

          <View style={styles.footer}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  brandBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoLetter: {
    fontSize: 28,
  },
  brand: {
    fontSize: fontSize.sm,
    letterSpacing: 3,
  },
  title: {
    fontSize: fontSize.xl,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  footer: {
    alignItems: 'center',
  },
});
