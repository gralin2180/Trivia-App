/**
 * Built-in free models (OpenRouter :free pool) + access modes.
 * OpenCode-style picker: users pick a model; the API falls through a wide list.
 */

export type AiAccessMode = 'builtin' | 'device_key' | 'local_ollama';

export type BuiltinModel = {
  id: string;
  label: string;
  blurb: string;
  /** OpenRouter model id, or `openrouter/free` for auto-rotate. */
  openRouterId: string;
  /** Shown in the picker badge. */
  tier: 'free' | 'fast' | 'quality';
};

/** Free models included with ACUMEN — same pool OpenCode surfaces via OpenRouter. */
export const BUILTIN_FREE_MODELS: BuiltinModel[] = [
  {
    id: 'auto',
    label: 'Auto (best free)',
    blurb: 'Rotates across healthy free models — most reliable when one is busy.',
    openRouterId: 'openrouter/free',
    tier: 'free',
  },
  {
    id: 'nemotron-lightning',
    label: 'Nemotron 3.5 Lightning',
    blurb: 'Fast NVIDIA MoE — great default for study cards.',
    openRouterId: 'nvidia/nemotron-3.5-lightning:free',
    tier: 'fast',
  },
  {
    id: 'nemotron-ultra',
    label: 'Nemotron 3 Ultra',
    blurb: 'Deep reasoning — slower, stronger quiz questions.',
    openRouterId: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    tier: 'quality',
  },
  {
    id: 'nemotron-super',
    label: 'Nemotron 3 Super',
    blurb: '120B hybrid MoE — strong judge and hard decks.',
    openRouterId: 'nvidia/nemotron-3-super-120b-a12b:free',
    tier: 'quality',
  },
  {
    id: 'nemotron-nano',
    label: 'Nemotron 3 Nano',
    blurb: 'Efficient agent model when quotas are tight.',
    openRouterId: 'nvidia/nemotron-3-nano-30b-a3b:free',
    tier: 'fast',
  },
  {
    id: 'ling-flash',
    label: 'Ling 3 Flash',
    blurb: 'Fast general instruction — good Hy-class fallback.',
    openRouterId: 'inclusionai/ling-3.0-flash:free',
    tier: 'fast',
  },
  {
    id: 'gemma-4',
    label: 'Gemma 4 31B',
    blurb: 'Google open model — balanced quality.',
    openRouterId: 'google/gemma-4-31b-it:free',
    tier: 'quality',
  },
  {
    id: 'gpt-oss-20b',
    label: 'GPT-OSS 20B',
    blurb: 'OpenAI open weights on OpenRouter free tier.',
    openRouterId: 'openai/gpt-oss-20b:free',
    tier: 'fast',
  },
  {
    id: 'laguna-code',
    label: 'Laguna S 2.1',
    blurb: 'Poolside coding agent — sharp distractors.',
    openRouterId: 'poolside/laguna-s-2.1:free',
    tier: 'quality',
  },
  {
    id: 'minimax-m27',
    label: 'MiniMax M2.7',
    blurb: 'MiniMax free tier — MiMo-class alternative.',
    openRouterId: 'minimax/minimax-m2.7:free',
    tier: 'fast',
  },
];

export const AI_ACCESS_MODES: { id: AiAccessMode; label: string; blurb: string }[] = [
  {
    id: 'builtin',
    label: 'ACUMEN free pool',
    blurb: 'No setup — uses our shared OpenRouter / Groq fallbacks (demo quota).',
  },
  {
    id: 'device_key',
    label: 'Your API key',
    blurb: 'Runs on your OpenRouter, Groq, Gemini, or OpenAI quota — no shared limit.',
  },
  {
    id: 'local_ollama',
    label: 'Local Ollama',
    blurb: 'If the API host runs Ollama, OSS models work with zero cloud keys.',
  },
];

const PREFERRED_MODEL_KEY = 'ai_preferred_model_v1';
const PREFERRED_MODE_KEY = 'ai_access_mode_v1';

export function modelById(id: string): BuiltinModel | undefined {
  return BUILTIN_FREE_MODELS.find((m) => m.id === id);
}

export function defaultPreferredModelId(): string {
  return 'auto';
}

export async function loadPreferredModelId(): Promise<string> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  const raw = await AsyncStorage.getItem(PREFERRED_MODEL_KEY);
  if (raw && modelById(raw)) return raw;
  return defaultPreferredModelId();
}

export async function savePreferredModelId(id: string): Promise<void> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  await AsyncStorage.setItem(PREFERRED_MODEL_KEY, id);
}

export async function loadAccessMode(): Promise<AiAccessMode> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  const raw = await AsyncStorage.getItem(PREFERRED_MODE_KEY);
  if (raw === 'device_key' || raw === 'local_ollama' || raw === 'builtin') return raw;
  return 'builtin';
}

export async function saveAccessMode(mode: AiAccessMode): Promise<void> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  await AsyncStorage.setItem(PREFERRED_MODE_KEY, mode);
}

/** OpenRouter id sent to the Python API. */
export async function resolvePreferredOpenRouterId(): Promise<string> {
  const id = await loadPreferredModelId();
  return modelById(id)?.openRouterId ?? 'openrouter/free';
}
