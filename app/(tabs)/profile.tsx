import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, fontSize } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Profile & Settings</Text>
      <Text style={styles.note}>Logout and settings come in Phase 6–7.</Text>
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
