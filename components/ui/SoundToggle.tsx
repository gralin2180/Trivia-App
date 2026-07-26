import { StyleSheet, Switch, Text, View } from 'react-native';

import { fonts, fontSize, spacing } from '@/constants/theme';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { playSound } from '@/lib/sounds';

export function SoundToggle() {
  const { soundEnabled, setSoundEnabled } = useSettings();
  const { colors } = useTheme();

  function handleToggle(value: boolean) {
    setSoundEnabled(value);
    if (value) {
      playSound('correct');
    }
  }

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bodyBold }]}>
          Sound effects
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
          Correct answers, level-ups, and celebrations
        </Text>
      </View>
      <Switch
        value={soundEnabled}
        onValueChange={handleToggle}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={soundEnabled ? colors.primary : colors.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  textWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.md,
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
});
