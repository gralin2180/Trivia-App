import { FunctionsHttpError } from '@supabase/supabase-js';

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
    return 'Free AI daily limit reached. Wait a few hours, or add a free Groq key in Supabase secrets.';
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

  return 'Could not generate deck. Check Edge Function logs in Supabase.';
}

export async function generateDeckFromTopic(
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
