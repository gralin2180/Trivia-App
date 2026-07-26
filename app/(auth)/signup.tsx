import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth/AuthShell';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup() {
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(email.trim(), password);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess('Account created! Redirecting to sign in…');
    setTimeout(() => router.replace('/(auth)/login'), 1600);
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start a streak. Learn any topic in minutes."
      footer={
        <Text style={styles.footer}>
          Already learning?{' '}
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
          </Link>
        </Text>
      }
    >
      {!isConfigured ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
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
        autoComplete="new-password"
        placeholder="At least 6 characters"
      />
      <Input
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="Repeat password"
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
      {success ? (
        <View style={styles.successBox}>
          <Text style={styles.success}>{success}</Text>
        </View>
      ) : null}

      <Button
        label={isSubmitting ? 'Creating…' : 'Get started'}
        onPress={handleSignup}
        disabled={isSubmitting}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
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
    backgroundColor: colors.errorBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.errorDark,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: colors.successBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.successDark,
  },
  success: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  link: {
    color: colors.primary,
    fontWeight: '800',
  },
});
