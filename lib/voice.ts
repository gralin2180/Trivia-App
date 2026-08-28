import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { loadVoiceFeedbackEnabled } from '@/lib/settings';

let speaking = false;

export async function speakFeedback(text: string): Promise<void> {
  const enabled = await loadVoiceFeedbackEnabled();
  if (!enabled || !text.trim()) return;

  try {
    Speech.stop();
    speaking = true;
    await new Promise<void>((resolve) => {
      Speech.speak(text.trim(), {
        language: 'en-US',
        rate: Platform.OS === 'ios' ? 0.95 : 0.9,
        pitch: 1,
        onDone: () => {
          speaking = false;
          resolve();
        },
        onStopped: () => {
          speaking = false;
          resolve();
        },
        onError: () => {
          speaking = false;
          resolve();
        },
      });
    });
  } catch {
    speaking = false;
  }
}

export function stopSpeaking(): void {
  if (speaking || Platform.OS === 'web') {
    try {
      Speech.stop();
    } catch {
      // ignore
    }
    speaking = false;
  }
}
