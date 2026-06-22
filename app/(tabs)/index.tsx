import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, fontSize } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Home Dashboard</Text>
      <Text style={styles.note}>Main dashboard content comes in Phase 7.</Text>
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
