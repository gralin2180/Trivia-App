import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fontSize, spacing } from '@/constants/theme';
import { getOAuthRedirectUri, type SocialProvider } from '@/lib/auth/oauth';

type SocialAuthButtonsProps = {
  onError: (message: string) => void;
};

export function SocialAuthButtons({ onError }: SocialAuthButtonsProps) {
  const { signInWithProvider } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  async function handleProvider(provider: SocialProvider) {
    setLoadingProvider(provider);
    const error = await signInWithProvider(provider);
    setLoadingProvider(null);

    if (error) {
      onError(error);
    }
  }

  return (
    <View style={styles.container}>
      <Button
        label={loadingProvider === 'google' ? 'Opening Google...' : 'Continue with Google'}
        onPress={() => handleProvider('google')}
        variant="secondary"
        style={styles.button}
      />
      {(Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') && (
        <Button
          label={loadingProvider === 'apple' ? 'Opening Apple...' : 'Continue with Apple'}
          onPress={() => handleProvider('apple')}
          variant="secondary"
          style={styles.button}
        />
      )}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or use email</Text>
        <View style={styles.dividerLine} />
      </View>
      {__DEV__ ? (
        <Text style={styles.devHint} selectable>
          Dev redirect URL (add in Supabase): {getOAuthRedirectUri()}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  button: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  devHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
