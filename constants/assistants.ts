import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type AssistantId = 'cat' | 'dog' | 'icon' | 'robot';

export type AssistantOption = {
  id: AssistantId;
  label: string;
  blurb: string;
  /** Placeholder until real art ships. */
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: string;
  /** Display name in dialogue. */
  name: string;
};

export const ASSISTANTS: AssistantOption[] = [
  {
    id: 'cat',
    label: 'Cat (Auri)',
    blurb: 'Curious cat coach — full animated sprites.',
    icon: 'paw',
    accent: '#2DD4BF',
    name: 'Auri',
  },
  {
    id: 'dog',
    label: 'Dog',
    blurb: 'Loyal study buddy (placeholder art for now).',
    icon: 'happy-outline',
    accent: '#F59E0B',
    name: 'Buddy',
  },
  {
    id: 'icon',
    label: 'Simple icon',
    blurb: 'Minimal mark — less character, same coaching.',
    icon: 'sparkles-outline',
    accent: '#60A5FA',
    name: 'Guide',
  },
  {
    id: 'robot',
    label: 'Robot',
    blurb: 'Friendly bot tutor (placeholder art for now).',
    icon: 'hardware-chip-outline',
    accent: '#A78BFA',
    name: 'Byte',
  },
];

export function getAssistant(id: AssistantId): AssistantOption {
  return ASSISTANTS.find((a) => a.id === id) ?? ASSISTANTS[0];
}
