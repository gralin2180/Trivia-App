import { FunctionsHttpError } from '@supabase/supabase-js';

import { getAiApiUrl, refreshAiApiUrl } from '@/lib/remoteConfig';
import { supabase } from '@/lib/supabase';
import type { GenerateDeckOptions } from '@/types/generate';

export type GenerateDeckResult = {
  deckId: string | null;
  cardCount: number;
  error: string | null;
};

function friendlyClientError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('429') || lower.includes('quota') || lower.includes('rate limit')) {
    return 'Free AI daily limit reached. Wait a few hours, or add a free Groq key.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network request failed')) {
    return 'Could not reach the AI server. It may be offline — try again in a moment.';
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
  accessToken: string,
  baseUrl: string,
): Promise<GenerateDeckResult> {
  const base = baseUrl.replace(/\/$/, '');
  const response = await fetch(`${base}/generate-deck`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      // Skips the ngrok free-tier interstitial page on tunnelled hosts.
      'ngrok-skip-browser-warning': 'true',
    },
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

  return {
    deckId: String(data.deckId),
    cardCount: Number(data.cardCount ?? data.cards?.length ?? 0),
    error: null,
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

/**
 * Prefers the self-hosted Python AI pipeline when a URL is available (either
 * published in Supabase or baked in at build time), then falls back to the
 * Supabase Edge Function.
 */
export async function generateDeckFromTopic(
  options: GenerateDeckOptions,
): Promise<GenerateDeckResult> {
  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    const anonymous = await supabase.auth.signInAnonymously();
    session = anonymous.data.session;
  }

  if (!session?.access_token) {
    return {
      deckId: null,
      cardCount: 0,
      error:
        'Create a free account to generate decks. (Or enable Anonymous sign-ins in Supabase Auth for full try-before-signup.)',
    };
  }

  const apiUrl = await getAiApiUrl();

  if (apiUrl) {
    const token = session.access_token;
    const attempt = async (url: string): Promise<GenerateDeckResult> => {
      try {
        return await generateViaPythonApi(options, token, url);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { deckId: null, cardCount: 0, error: friendlyClientError(message) };
      }
    };

    let result = await attempt(apiUrl);

    // A connection failure usually means the self-hosted API moved to a new
    // tunnel URL, so re-read the published URL and retry before falling back.
    if (result.error?.toLowerCase().includes('could not reach the ai server')) {
      const freshUrl = await refreshAiApiUrl();
      if (freshUrl && freshUrl !== apiUrl) {
        result = await attempt(freshUrl);
      }
    }

    if (!result.error && result.deckId) {
      return result;
    }

    // If Python is down / misconfigured, try Edge Function next
    if (result.error && !result.error.toLowerCase().includes('beginner-level')) {
      const fallback = await generateViaEdgeFunction(options);
      if (!fallback.error && fallback.deckId) {
        return fallback;
      }
      return result.error ? result : fallback;
    }

    return result;
  }

  return generateViaEdgeFunction(options);
}
