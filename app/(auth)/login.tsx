import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn, isConfigured } = useAuth();
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

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue studying.</Text>
          </View>

          {!isConfigured ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Add your Supabase keys to a `.env` file, then restart the dev server.
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={isSubmitting ? 'Signing in...' : 'Sign in with email'}
              onPress={handleLogin}
              variant="secondary"
            />
          </View>

          <Text style={styles.footer}>
            No account?{' '}
            <Link href="/(auth)/signup" style={styles.link}>
              Sign up
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  banner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: spacing.md,
  },
  bannerText: {
    fontSize: fontSize.sm,
    color: '#92400E',
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
