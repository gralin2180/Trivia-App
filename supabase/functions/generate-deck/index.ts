import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type GeneratedCard = {
  front: string;
  back: string;
  difficulty: number;
};

type AiCardsResponse = {
  cards: GeneratedCard[];
};

type DifficultyLevel = 'easy' | 'medium' | 'hard';

type NormalizedCard = {
  front: string;
  back: string;
  difficulty: number;
  order_index: number;
};

function buildSystemPrompt(difficulty: DifficultyLevel): string {
  const difficultyRule: Record<DifficultyLevel, string> = {
    easy: 'Every card MUST use difficulty: 1. Questions a complete beginner can answer.',
    medium: 'Use difficulty 2 on every card. Require understanding, not just definitions.',
    hard: 'Every card MUST use difficulty: 3. Expert-level only — no beginner trivia.',
  };

  const exampleDifficulty = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;

  return [
    `Return JSON only: {"cards":[{"front":"question","back":"answer","difficulty":${exampleDifficulty}}]}.`,
    'Exactly 10 cards.',
    'difficulty 1=easy, 2=medium, 3=hard.',
    difficultyRule[difficulty],
    'Front must be a full question (not a 2-word label). Back is a specific answer.',
  ].join(' ');
}

function buildUserPrompt(
  topic: string,
  difficulty: DifficultyLevel,
  customPrompt: string,
  mode: string,
): string {
  const difficultyGuide: Record<DifficultyLevel, string> = {
    easy:
      'BEGINNER level. Simple vocabulary, basic facts, and obvious concepts someone new to the topic can learn quickly.',
    medium:
      'INTERMEDIATE level. Application and reasoning — not just "what is X". Include how/why questions and non-obvious facts.',
    hard: [
      'ADVANCED / EXPERT level. Strict requirements:',
      '- Every card difficulty must be 3.',
      '- Target someone who already knows the basics of this topic.',
      '- Use clinical cases, mechanisms, edge cases, protocols, diagnostics, or specialist terminology.',
      '- NEVER ask trivial labels like "Doctor\'s degree", "What is a teacher", or one-word fronts.',
      '- BAD example: front="Doctor\'s degree", back="Ph.D."',
      '- GOOD example: front="Which vasopressor is first-line for septic shock after fluid resuscitation?", back="Norepinephrine"',
    ].join(' '),
  };

  const modeHint =
    mode === 'quiz'
      ? 'Cards will be used in a multiple-choice quiz — wrong answers must be plausible to an expert.'
      : 'Cards will be used for flashcard study.';

  let prompt = `Topic: ${topic}. ${difficultyGuide[difficulty]} ${modeHint}`;
  if (customPrompt.trim()) {
    prompt += ` Learner instructions: ${customPrompt.trim().slice(0, 500)}`;
  }
  return prompt;
}

function buildRetryPrompt(topic: string, difficulty: DifficultyLevel): string {
  return [
    `REGENERATE all 10 cards for topic: ${topic}.`,
    'The previous set was TOO EASY and rejected.',
    difficulty === 'hard'
      ? 'Hard means expert-only. Full-sentence questions. Mechanisms, protocols, differential diagnosis, advanced terminology. difficulty: 3 on every card.'
      : 'Medium means intermediate depth. No basic definitions. difficulty: 2 on every card.',
  ].join(' ');
}

function parseCards(content: string): NormalizedCard[] {
  const parsed = JSON.parse(content) as AiCardsResponse;

  return (parsed.cards ?? [])
    .filter((card) => card.front && card.back)
    .slice(0, 12)
    .map((card, index) => ({
      front: String(card.front).trim(),
      back: String(card.back).trim(),
      difficulty: Math.min(3, Math.max(1, Number(card.difficulty) || 1)),
      order_index: index + 1,
    }));
}

function enforceDifficulty(cards: NormalizedCard[], difficulty: DifficultyLevel): NormalizedCard[] {
  const target = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
  return cards.map((card) => ({ ...card, difficulty: target }));
}

function looksTooBasicForHard(card: NormalizedCard): boolean {
  const front = card.front.toLowerCase();
  const words = card.front.split(/\s+/).filter(Boolean);

  if (words.length <= 3 && !card.front.includes('?')) return true;
  if (/^(what is|who is|define|name the)\s/i.test(card.front) && words.length <= 5) return true;
  if (front.includes("doctor's degree") || front.includes('what does a doctor')) return true;
  if (card.back.split(/\s+/).length <= 2 && card.back.length < 20) return true;

  return false;
}

function isDeckTooEasy(cards: NormalizedCard[], difficulty: DifficultyLevel): boolean {
  if (difficulty === 'easy' || cards.length < 4) return false;

  if (difficulty === 'hard') {
    const tooBasic = cards.filter(looksTooBasicForHard).length;
    const aiMarkedEasy = cards.filter((card) => card.difficulty <= 1).length;
    if (tooBasic >= 2 || aiMarkedEasy > 4) return true;
  }

  if (difficulty === 'medium') {
    const tooBasic = cards.filter(looksTooBasicForHard).length;
    const aiMarkedEasy = cards.filter((card) => card.difficulty <= 1).length;
    if (tooBasic >= 4 || aiMarkedEasy > 6) return true;
  }

  return false;
}

function isQuotaError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('429') || lower.includes('quota') || lower.includes('rate limit') || lower.includes('resource_exhausted');
}

function friendlyAiError(message: string): string {
  if (isQuotaError(message)) {
    return 'Free AI quota used up for today. Wait a few hours, add a GROQ_API_KEY (also free), or try again tomorrow.';
  }
  return message.slice(0, 400);
}

async function generateCardsWithGroq(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const completion = await response.json();
  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned an empty response.');
  return content;
}

async function generateCardsWithGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
): Promise<string> {
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastError = 'Gemini request failed.';

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      lastError = await response.text();
      continue;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      lastError = 'Gemini returned an empty response.';
      continue;
    }

    return content;
  }

  throw new Error(lastError);
}

async function generateCards(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  keys: {
    groq?: string;
    gemini?: string;
    openai?: string;
  },
): Promise<string> {
  const attempts: Array<{ name: string; run: () => Promise<string> }> = [];

  if (keys.groq) {
    attempts.push({
      name: 'Groq',
      run: () => generateCardsWithGroq(keys.groq!, systemPrompt, userPrompt, temperature),
    });
  }
  if (keys.gemini) {
    attempts.push({
      name: 'Gemini',
      run: () => generateCardsWithGemini(keys.gemini!, systemPrompt, userPrompt, temperature),
    });
  }
  if (keys.openai) {
    attempts.push({
      name: 'OpenAI',
      run: () => generateCardsWithOpenAI(keys.openai!, systemPrompt, userPrompt, temperature),
    });
  }

  let lastError = 'No AI provider configured.';

  for (const attempt of attempts) {
    try {
      return await attempt.run();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (!isQuotaError(lastError)) {
        throw new Error(friendlyAiError(lastError));
      }
    }
  }

  throw new Error(friendlyAiError(lastError));
}

async function generateCardsWithOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI request failed: ${details}`);
  }

  const completion = await response.json();
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  return content;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const groqKey = Deno.env.get('GROQ_API_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!groqKey && !geminiKey && !openAiKey) {
      return json(
        {
          error:
            'No AI key configured. Add GROQ_API_KEY or GEMINI_API_KEY (both have free tiers) in Edge Function secrets.',
        },
        500,
      );
    }
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json({ error: 'Supabase environment variables are missing.' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'You must be signed in to generate a deck.' }, 401);
    }

    const body = await req.json();
    const { topic, difficulty = 'easy', customPrompt = '', mode = 'study' } = body;
    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return json({ error: 'Please provide a valid topic.' }, 400);
    }

    const trimmedTopic = topic.trim().slice(0, 120);
    const safeDifficulty: DifficultyLevel =
      difficulty === 'medium' || difficulty === 'hard' ? difficulty : 'easy';
    const safeCustomPrompt = typeof customPrompt === 'string' ? customPrompt : '';
    const safeMode = mode === 'quiz' ? 'quiz' : 'study';
    const systemPrompt = buildSystemPrompt(safeDifficulty);
    const userPrompt = buildUserPrompt(trimmedTopic, safeDifficulty, safeCustomPrompt, safeMode);
    const temperature = safeDifficulty === 'hard' ? 0.85 : safeDifficulty === 'medium' ? 0.75 : 0.65;
    const providerKeys = { groq: groqKey, gemini: geminiKey, openai: openAiKey };

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: 'Invalid session. Please sign in again.' }, 401);
    }

    let content = await generateCards(systemPrompt, userPrompt, temperature, providerKeys);

    let cards: NormalizedCard[];
    try {
      cards = parseCards(content);
    } catch {
      return json({ error: 'AI returned invalid JSON.' }, 502);
    }

    if (isDeckTooEasy(cards, safeDifficulty)) {
      const retryPrompt = buildRetryPrompt(trimmedTopic, safeDifficulty);
      try {
        content = await generateCards(systemPrompt, retryPrompt, 0.9, providerKeys);
        cards = parseCards(content);
      } catch {
        // Keep first attempt if retry fails to parse.
      }
    }

    if (cards.length < 4) {
      return json({ error: 'AI did not generate enough cards. Try again.' }, 502);
    }

    if (isDeckTooEasy(cards, safeDifficulty)) {
      return json(
        {
          error:
            'AI kept generating beginner-level cards. Try a custom prompt like "medical school level" or try again.',
        },
        502,
      );
    }

    cards = enforceDifficulty(cards, safeDifficulty);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: deck, error: deckError } = await adminClient
      .from('decks')
      .insert({
        title: trimmedTopic,
        description: `AI-generated ${safeDifficulty} deck for ${trimmedTopic}.`,
        category: 'AI Topics',
        topic: trimmedTopic,
        source: 'ai',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (deckError || !deck) {
      const hint = deckError?.message?.includes('column')
        ? ' Run supabase/migrations/003_ai_decks.sql in the SQL Editor.'
        : '';
      return json({ error: (deckError?.message ?? 'Could not save deck.') + hint }, 500);
    }

    const { error: cardsError } = await adminClient.from('cards').insert(
      cards.map((card) => ({
        deck_id: deck.id,
        front: card.front,
        back: card.back,
        order_index: card.order_index,
        difficulty: card.difficulty,
      })),
    );

    if (cardsError) {
      const hint = cardsError.message.includes('column')
        ? ' Run supabase/migrations/003_ai_decks.sql in the SQL Editor.'
        : '';
      return json({ error: cardsError.message + hint }, 500);
    }

    return json({ deckId: deck.id, cardCount: cards.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return json({ error: friendlyAiError(message) }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
