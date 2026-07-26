import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { fonts, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.message, { color: colors.textMuted, fontFamily: fonts.body }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  message: {
    fontSize: fontSize.md,
  },
});
