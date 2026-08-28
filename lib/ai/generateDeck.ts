import { FunctionsHttpError } from '@supabase/supabase-js';

import { loadApiKeys, type ApiKeyMap } from '@/lib/apiKeys';
import { resolvePreferredOpenRouterId, loadAccessMode } from '@/constants/aiModels';
import { saveDeckDetailToCache } from '@/lib/cache/deckCache';
import { decodeCardBack } from '@/lib/cardPayload';
import { getGuestDeviceId } from '@/lib/guestLimits';
import { registerGuestDeckId } from '@/lib/ownDecks';
import { getAiApiUrl, refreshAiApiUrl } from '@/lib/remoteConfig';
import { supabase } from '@/lib/supabase';
import type { Card } from '@/types/database';
import type { GenerateDeckOptions } from '@/types/generate';

export type GenerateDeckResult = {
  deckId: string | null;
  cardCount: number;
  error: string | null;
  /** True when we returned an existing public deck instead of calling the LLM. */
  reused?: boolean;
};

function friendlyClientError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('429') || lower.includes('quota') || lower.includes('rate limit')) {
    return 'Shared AI daily limit reached. Add your own free key in Settings → AI API keys to keep generating.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network request failed')) {
    return 'Could not reach the AI server. It may be offline — try again in a moment.';
  }
  if (lower.includes('free guest generations used up') || lower.includes('create a free account')) {
    return 'You’ve used your 3 free guest decks. Create a free account or sign in to keep generating.';
  }
  return message.length > 350 ? `${message.slice(0, 350)}...` : message;
}

async function readFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) {
        return friendlyClientError(String(body.error));
      }
    } catch {
      try {
        const text = await error.context.clone().text();
        if (text) return friendlyClientError(text.slice(0, 300));
      } catch {
        // fall through
      }
    }
  }

  if (error instanceof Error) {
    return friendlyClientError(error.message);
  }

  return 'Could not generate deck.';
}

async function generateViaPythonApi(
  options: GenerateDeckOptions,
  baseUrl: string,
  auth: { accessToken?: string; guestId?: string },
  userKeys: ApiKeyMap = {},
): Promise<GenerateDeckResult> {
  const base = baseUrl.replace(/\/$/, '');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Skips the ngrok free-tier interstitial page on tunnelled hosts.
    'ngrok-skip-browser-warning': 'true',
  };
  if (auth.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  } else if (auth.guestId) {
    headers['X-Acumen-Guest-Id'] = auth.guestId;
  }

  // Bring-your-own-key: only when the user chose "Your API key" access mode.
  if (accessMode === 'device_key') {
    if (userKeys.openrouter) headers['X-Acumen-Openrouter-Key'] = userKeys.openrouter;
    if (userKeys.groq) headers['X-Acumen-Groq-Key'] = userKeys.groq;
    if (userKeys.openai) headers['X-Acumen-Openai-Key'] = userKeys.openai;
    if (userKeys.gemini) headers['X-Acumen-Gemini-Key'] = userKeys.gemini;
  }
  if (preferredOpenRouterId) headers['X-Acumen-Preferred-Model'] = preferredOpenRouterId;
  if (accessMode) headers['X-Acumen-Access-Mode'] = accessMode;

  const response = await fetch(`${base}/generate-deck`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      topic: options.topic,
      difficulty: options.difficulty,
      customPrompt: options.customPrompt ?? '',
      mode: options.mode,
      useWebContext: true,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data?.detail ?? data?.error ?? `AI API error (${response.status})`;
    return { deckId: null, cardCount: 0, error: friendlyClientError(String(detail)) };
  }

  if (!data?.deckId) {
    return { deckId: null, cardCount: 0, error: 'Deck was not created by AI API.' };
  }

  const deckId = String(data.deckId);

  // Cache the full deck locally so it opens instantly — and so guests (who may
  // not be able to read the deck back through Supabase RLS) can still study it.
  if (Array.isArray(data.cards) && data.cards.length > 0) {
    const now = new Date().toISOString();
    const cards: Card[] = data.cards.map((card: any, index: number) => {
      const decoded = decodeCardBack(String(card.back ?? ''));
      const distractors = Array.isArray(card.distractors)
        ? card.distractors.map((x: unknown) => String(x).trim()).filter(Boolean)
        : decoded.distractors;
      return {
        id: `${deckId}:${index + 1}`,
        deck_id: deckId,
        front: String(card.front ?? ''),
        back: decoded.answer || String(card.back ?? ''),
        order_index: Number(card.order_index ?? index + 1),
        difficulty: Number(card.difficulty ?? 1),
        created_at: now,
        distractors,
      };
    });
    const notes = Array.isArray(data.study_notes)
      ? data.study_notes.map((n: unknown) => String(n).trim()).filter(Boolean)
      : [];
    const description =
      notes.length > 0
        ? `AI-generated ${options.difficulty} deck for ${options.topic.trim()}.\n\nWhat you'll learn:\n${notes
            .map((n: string) => `• ${n}`)
            .join('\n')}`
        : `AI-generated ${options.difficulty} deck for ${options.topic.trim()}.`;
    try {
      await saveDeckDetailToCache({
        id: deckId,
        title: options.topic.trim().slice(0, 120),
        description,
        category: 'AI Topics',
        topic: options.topic.trim().slice(0, 120),
        source: 'ai',
        created_at: now,
        cards,
      });
    } catch {
      // Cache is an optimization; Supabase fetch is the source of truth.
    }
  }

  return {
    deckId,
    cardCount: Number(data.cardCount ?? data.cards?.length ?? 0),
    error: null,
    reused: Boolean(data.reused),
  };
}

async function generateViaEdgeFunction(
  options: GenerateDeckOptions,
): Promise<GenerateDeckResult> {
  const { data, error } = await supabase.functions.invoke('generate-deck', {
    body: {
      topic: options.topic,
      difficulty: options.difficulty,
      customPrompt: options.customPrompt ?? '',
      mode: options.mode,
    },
  });

  if (error) {
    const message = await readFunctionError(error);
    return { deckId: null, cardCount: 0, error: message };
  }

  if (data?.error) {
    return { deckId: null, cardCount: 0, error: friendlyClientError(String(data.error)) };
  }

  if (!data?.deckId) {
    return { deckId: null, cardCount: 0, error: 'Deck was not created.' };
  }

  return {
    deckId: data.deckId as string,
    cardCount: Number(data.cardCount ?? 0),
    error: null,
  };
}

async function ensureAccessToken(): Promise<string | null> {
  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) return session.access_token;

  try {
    const anonymous = await Promise.race([
      supabase.auth.signInAnonymously(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
    ]);
    if (anonymous && 'data' in anonymous) {
      session = anonymous.data.session;
    }
  } catch {
    // Guest header path still works without anonymous auth.
  }

  return session?.access_token ?? null;
}

/**
 * Prefers the self-hosted Python AI pipeline when a URL is available (either
 * published in Supabase or baked in at build time), then falls back to the
 * Supabase Edge Function.
 */
export async function generateDeckFromTopic(
  options: GenerateDeckOptions,
): Promise<GenerateDeckResult> {
  const accessToken = await ensureAccessToken();
  const apiUrl = await getAiApiUrl();
  const userKeys = await loadApiKeys().catch(() => ({}) as ApiKeyMap);
  const [preferredOpenRouterId, accessMode] = await Promise.all([
    resolvePreferredOpenRouterId().catch(() => 'openrouter/free'),
    loadAccessMode().catch(() => 'builtin' as const),
  ]);

  if (apiUrl) {
    const guestId = accessToken ? undefined : await getGuestDeviceId();
    const attempt = async (url: string): Promise<GenerateDeckResult> => {
      try {
        return await generateViaPythonApi(
          options,
          url,
          {
            accessToken: accessToken ?? undefined,
            guestId,
          },
          userKeys,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { deckId: null, cardCount: 0, error: friendlyClientError(message) };
      }
    };

    let result = await attempt(apiUrl);

    if (result.error?.toLowerCase().includes('could not reach the ai server')) {
      const freshUrl = await refreshAiApiUrl();
      if (freshUrl && freshUrl !== apiUrl) {
        result = await attempt(freshUrl);
      }
    }

    if (!result.error && result.deckId) {
      // Guests have no created_by on the server row, so remember ownership here.
      if (guestId) {
        void registerGuestDeckId(result.deckId);
      }
      return result;
    }

    // Edge Function needs a real session — only try when we have one.
    if (accessToken && result.error && !result.error.toLowerCase().includes('beginner-level')) {
      const fallback = await generateViaEdgeFunction(options);
      if (!fallback.error && fallback.deckId) {
        return fallback;
      }
      return result.error ? result : fallback;
    }

    return result;
  }

  if (!accessToken) {
    return {
      deckId: null,
      cardCount: 0,
      error:
        'Could not start a guest session for AI. Check that the demo API is online, then try again.',
    };
  }

  return generateViaEdgeFunction(options);
}
