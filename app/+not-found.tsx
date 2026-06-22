import { Link, Stack } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, fontSize } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <Screen>
        <Text style={styles.title}>Screen not found</Text>
        <Link href="/" style={styles.link}>
          Go back home
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  link: {
    marginTop: 12,
    fontSize: fontSize.md,
    color: colors.primary,
  },
});
