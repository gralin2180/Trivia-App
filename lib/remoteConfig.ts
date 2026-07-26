import AsyncStorage from '@react-native-async-storage/async-storage';

import { config } from '@/constants/config';
import { supabase } from '@/lib/supabase';

/**
 * The AI API is self-hosted behind a tunnel, so its public URL can change.
 * The host machine publishes the live URL into Supabase `app_config`, and the
 * app prefers that over the value baked in at build time. This keeps already
 * installed builds working when the tunnel moves.
 */
const AI_API_URL_KEY = 'ai_api_url';
const CACHE_KEY = 'remoteConfig:ai_api_url';
const FETCH_TIMEOUT_MS = 6000;

let resolvedUrl: string | null = null;
let hydration: Promise<void> | null = null;

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '');
}

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchPublishedUrl(): Promise<string> {
  if (!config.isSupabaseConfigured) return '';

  const result = await withTimeout(
    supabase.from('app_config').select('value').eq('key', AI_API_URL_KEY).maybeSingle(),
    FETCH_TIMEOUT_MS,
  );

  if (!result || result.error) return '';
  return normalize(result.data?.value as string | undefined);
}

/**
 * Loads the last known URL from disk, then refreshes from Supabase in the
 * background. Safe to call repeatedly; the work happens once per app session.
 */
export function hydrateRemoteConfig(): Promise<void> {
  if (hydration) return hydration;

  hydration = (async () => {
    const cached = normalize(await AsyncStorage.getItem(CACHE_KEY).catch(() => null));
    if (cached) resolvedUrl = cached;

    const published = await fetchPublishedUrl();
    if (published) {
      resolvedUrl = published;
      await AsyncStorage.setItem(CACHE_KEY, published).catch(() => undefined);
    }
  })();

  return hydration;
}

/**
 * Base URL for the Python AI API: the URL published by the host machine when
 * available, otherwise the one baked in at build time.
 */
export async function getAiApiUrl(): Promise<string> {
  if (!resolvedUrl) {
    await hydrateRemoteConfig();
  }
  return resolvedUrl || normalize(config.aiApiUrl);
}

/** Forces a re-read from Supabase, e.g. after a request failed to connect. */
export async function refreshAiApiUrl(): Promise<string> {
  hydration = null;
  const published = await fetchPublishedUrl();
  if (published) {
    resolvedUrl = published;
    await AsyncStorage.setItem(CACHE_KEY, published).catch(() => undefined);
  }
  return resolvedUrl || normalize(config.aiApiUrl);
}
