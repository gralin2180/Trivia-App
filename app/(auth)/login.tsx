import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth/AuthShell';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isConfigured, continueAsGuest, isGuest } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    }
  }

  async function handleGuest() {
    setError(null);
    setIsSubmitting(true);
    const guestError = await continueAsGuest();
    setIsSubmitting(false);
    if (guestError) {
      setError(guestError);
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pick up your streak — or keep exploring as a guest."
      footer={
        <Text style={[styles.footer, { color: colors.textMuted, fontFamily: fonts.body }]}>
          No account?{' '}
          <Link href="/(auth)/signup" style={[styles.link, { color: colors.primary }]}>
            Sign up free
          </Link>
        </Text>
      }
    >
      {!isConfigured ? (
        <View style={[styles.banner, { backgroundColor: colors.warning }]}>
          <Text style={[styles.bannerText, { fontFamily: fonts.body }]}>
            Add your Supabase keys to a `.env` file, then restart the app.
          </Text>
        </View>
      ) : null}

      <SocialAuthButtons onError={setError} />

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        placeholder="Your password"
      />

      {error ? (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.errorBg, borderColor: colors.errorDark },
          ]}
        >
          <Text style={[styles.error, { color: colors.error, fontFamily: fonts.body }]}>{error}</Text>
        </View>
      ) : null}

      <Button
        label={isSubmitting ? 'Signing in…' : 'Sign in'}
        onPress={handleLogin}
        disabled={isSubmitting}
      />

      {!isGuest ? (
        <Pressable onPress={handleGuest} disabled={isSubmitting} style={styles.guestLink}>
          <Text style={[styles.guestText, { color: colors.textMuted, fontFamily: fonts.bodyMedium }]}>
            Continue without an account
          </Text>
        </Pressable>
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bannerText: {
    fontSize: fontSize.sm,
    color: '#1A1200',
    fontWeight: '600',
    lineHeight: 20,
  },
  errorBox: {
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
  },
  error: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.md,
  },
  link: {
    fontWeight: '800',
  },
  guestLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  guestText: {
    fontSize: fontSize.sm,
  },
});