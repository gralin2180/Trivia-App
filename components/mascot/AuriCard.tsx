import { StyleSheet, Text, View } from 'react-native';

import { AssistantAvatar } from '@/components/mascot/AssistantAvatar';
import type { MascotMood } from '@/components/mascot/AuriMascot';
import { useAssistant } from '@/contexts/AssistantContext';
import { fonts, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  mood?: MascotMood;
  size?: number;
  showLabel?: boolean;
};

/** Compact assistant face for dialogue headers / settings. */
export function AuriCard({ mood = 'idle', size = 56, showLabel = false }: Props) {
  const { colors } = useTheme();
  const { assistant } = useAssistant();

  return (
    <View style={styles.wrap}>
      <AssistantAvatar size={size} mood={mood} quiet />
      {showLabel ? (
        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: fonts.bodyBold }]}>
          {assistant.name}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: fontSize.xs,
  },
});
