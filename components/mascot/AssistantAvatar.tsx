import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AuriMascot, type GazeDir, type MascotMood } from '@/components/mascot/AuriMascot';
import { ASSISTANTS, getAssistant, type AssistantId } from '@/constants/assistants';
import { useAssistant } from '@/contexts/AssistantContext';

type Props = {
  size?: number;
  mood?: MascotMood;
  gaze?: GazeDir;
  quiet?: boolean;
  /** Override stored preference (e.g. settings picker preview). */
  assistantId?: AssistantId;
};

/**
 * Renders the selected AI assistant. Cat uses full Auri sprites;
 * dog / icon / robot use placeholder badge art until real assets ship.
 */
export function AssistantAvatar({
  size = 96,
  mood = 'idle',
  gaze = 'forward',
  quiet = false,
  assistantId,
}: Props) {
  const { assistantId: storedId } = useAssistant();
  const id = assistantId ?? storedId;
  const meta = getAssistant(id);

  if (id === 'cat') {
    return <AuriMascot size={size} mood={mood} gaze={gaze} quiet={quiet} />;
  }

  const iconSize = Math.round(size * 0.48);
  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: meta.accent + '33',
          borderColor: meta.accent,
        },
      ]}
    >
      <Ionicons name={meta.icon} size={iconSize} color={meta.accent} />
    </View>
  );
}

export function AssistantOptionPreview({ id, size = 56 }: { id: AssistantId; size?: number }) {
  return <AssistantAvatar assistantId={id} size={size} quiet />;
}

export { ASSISTANTS };
