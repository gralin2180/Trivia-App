import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { colors, fontSize } from '@/constants/theme';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen>
      <Text style={styles.title}>Deck Detail</Text>
      <Text style={styles.note}>Deck ID: {id ?? 'unknown'}</Text>
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
