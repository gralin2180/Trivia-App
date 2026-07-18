import { StyleSheet, Switch, Text, View } from 'react-native';

import { GameCard } from '@/components/ui/GameCard';
import { useSettings } from '@/contexts/SettingsContext';
import { colors, fontSize, spacing } from '@/constants/theme';
import { playSound } from '@/lib/sounds';

export function SoundToggle() {
  const { soundEnabled, setSoundEnabled } = useSettings();

  function handleToggle(value: boolean) {
    setSoundEnabled(value);
    if (value) {
      playSound('correct');
    }
  }

  return (
    <GameCard>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={styles.title}>🔊 Sound effects</Text>
          <Text style={styles.subtitle}>
            Play sounds for correct answers, level-ups, and celebrations
          </Text>
        </View>
        <Switch
          value={soundEnabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.border, true: colors.primary + '88' }}
          thumbColor={soundEnabled ? colors.primary : colors.textSecondary}
        />
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  textWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
