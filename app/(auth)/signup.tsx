import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, fontSize } from '@/constants/theme';

export default function SignupScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Sign Up</Text>
      <Text style={styles.note}>Auth UI will be built in Phase 6.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  note: {
    marginTop: 8,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
