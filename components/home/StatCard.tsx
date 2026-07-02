import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/constants/theme';

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: string;
  accent?: string;
};

export function StatCard({ label, value, icon, accent = colors.secondary }: StatCardProps) {
  return (
    <View style={[styles.card, { borderColor: accent + '44' }]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    padding: spacing.md,
    gap: spacing.xs,
    minWidth: 90,
    alignItems: 'center',
  },
  icon: {
    fontSize: fontSize.lg,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
});
