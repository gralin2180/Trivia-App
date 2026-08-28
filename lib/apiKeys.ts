import AsyncStorage from '@react-native-async-storage/async-storage';

export type AiProviderId = 'openrouter' | 'groq' | 'openai' | 'gemini';

export type AiProvider = {
  id: AiProviderId;
  label: string;
  blurb: string;
  /** Where the user creates the key. */
  consoleUrl: string;
  /** Typical key prefix, used for a soft format warning only. */
  prefix: string;
  free: boolean;
};

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    blurb: 'Free-model pool (Nemotron, Llama, and more). Best quality for study + quiz cards.',
    consoleUrl: 'https://openrouter.ai/keys',
    prefix: 'sk-or-',
    free: true,
  },
  {
    id: 'groq',
    label: 'Groq',
    blurb: 'Free tier, fastest fallback when OpenRouter is busy.',
    consoleUrl: 'https://console.groq.com/keys',
    prefix: 'gsk_',
    free: true,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    blurb: 'Paid. Highest quality cards for hard, exam-style decks.',
    consoleUrl: 'https://platform.openai.com/api-keys',
    prefix: 'sk-',
    free: false,
  },
    {
      id: 'gemini',
      label: 'Google Gemini',
      blurb: 'Generous free tier from Google AI Studio (keys start with AIza or AQ.).',
      consoleUrl: 'https://aistudio.google.com/app/apikey',
      prefix: 'AQ.',
      free: true,
    },
  ];

export type ApiKeyMap = Partial<Record<AiProviderId, string>>;

const keyStorageKey = (id: AiProviderId) => `ai_api_key_${id}_v1`;
const BANNER_DISMISSED_KEY = 'api_key_banner_dismissed_v1';

export async function loadApiKeys(): Promise<ApiKeyMap> {
  const entries = await Promise.all(
    AI_PROVIDERS.map(async (provider) => {
      const value = await AsyncStorage.getItem(keyStorageKey(provider.id));
      return [provider.id, value?.trim() || undefined] as const;
    }),
  );

  const map: ApiKeyMap = {};
  for (const [id, value] of entries) {
    if (value) map[id] = value;
  }
  return map;
}

export async function saveApiKey(id: AiProviderId, value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(keyStorageKey(id));
    return;
  }
  await AsyncStorage.setItem(keyStorageKey(id), trimmed);
}

export async function removeApiKey(id: AiProviderId): Promise<void> {
  await AsyncStorage.removeItem(keyStorageKey(id));
}

/** Show only the tail so a key is recognisable without being readable. */
export function maskApiKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-4)}`;
}

export function looksLikeValidKey(id: AiProviderId, value: string): boolean {
  const provider = AI_PROVIDERS.find((p) => p.id === id);
  const trimmed = value.trim();
  if (trimmed.length < 12) return false;
  if (!provider) return true;
  if (id === 'gemini') {
    return trimmed.startsWith('AIza') || trimmed.startsWith('AQ.');
  }
  if (id === 'openrouter') {
    return trimmed.startsWith('sk-or-') || trimmed.startsWith('sk-');
  }
  return trimmed.startsWith(provider.prefix);
}

export async function loadApiKeyBannerDismissed(): Promise<boolean> {
  return (await AsyncStorage.getItem(BANNER_DISMISSED_KEY)) === 'true';
}

export async function saveApiKeyBannerDismissed(): Promise<void> {
  await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
}
