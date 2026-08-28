import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

const LAST_TOPIC_KEY = 'last_studied_topic_v1';
const REVISION_DISMISSED_KEY = 'revision_nudge_dismissed_day_v1';

export type LastStudiedTopic = {
  deckId: string;
  title: string;
  studiedAt: string; // ISO
};

export type WeakPointCard = {
  cardId: string;
  front: string;
  back: string;
  deckId: string;
  deckTitle: string;
};

export async function saveLastStudiedTopic(topic: LastStudiedTopic): Promise<void> {
  await AsyncStorage.setItem(LAST_TOPIC_KEY, JSON.stringify(topic));
}

export async function loadLastStudiedTopic(): Promise<LastStudiedTopic | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_TOPIC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastStudiedTopic;
    if (!parsed?.deckId || !parsed?.title) return null;
    return parsed;
  } catch {
    return null;
  }
}

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function loadRevisionNudgeDismissedToday(): Promise<boolean> {
  return (await AsyncStorage.getItem(REVISION_DISMISSED_KEY)) === dayKey();
}

export async function dismissRevisionNudgeToday(): Promise<void> {
  await AsyncStorage.setItem(REVISION_DISMISSED_KEY, dayKey());
}

/**
 * Should we nudge "quiz yourself on last topic"?
 * Yes if they studied something recently (within ~36h) and haven't dismissed today.
 */
export async function shouldShowRevisionNudge(): Promise<LastStudiedTopic | null> {
  if (await loadRevisionNudgeDismissedToday()) return null;
  const last = await loadLastStudiedTopic();
  if (!last) return null;
  const ageMs = Date.now() - new Date(last.studiedAt).getTime();
  if (ageMs < 0 || ageMs > 36 * 60 * 60 * 1000) return null;
  return last;
}

/**
 * Wrong answers from card_reviews = weak points.
 * Returns a random sample (not the same order every login).
 */
export async function fetchRandomWeakPoints(
  userId: string | undefined,
  limit = 5,
): Promise<WeakPointCard[]> {
  if (!userId) return [];

  const { data: reviews, error } = await supabase
    .from('card_reviews')
    .select('card_id, reviewed_at, cards(id, front, back, deck_id, decks(id, title))')
    .eq('user_id', userId)
    .eq('was_correct', false)
    .order('reviewed_at', { ascending: false })
    .limit(80);

  if (error || !reviews?.length) return [];

  const byCard = new Map<string, WeakPointCard>();
  for (const row of reviews as any[]) {
    const card = row.cards;
    if (!card?.id || byCard.has(card.id)) continue;
    const deck = card.decks;
    byCard.set(card.id, {
      cardId: card.id,
      front: String(card.front ?? ''),
      back: String(card.back ?? ''),
      deckId: String(card.deck_id ?? deck?.id ?? ''),
      deckTitle: String(deck?.title ?? 'Deck'),
    });
  }

  const pool = [...byCard.values()].filter((c) => c.deckId && c.front);
  // Fisher–Yates shuffle so login order stays random.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, limit);
}

/**
 * Mix: prefer wrongs, sprinkle a few recently-correct cards for spaced review.
 */
export async function fetchPracticeMix(
  userId: string | undefined,
  limit = 6,
): Promise<{ weaks: WeakPointCard[]; includeCorrectHint: boolean }> {
  const weaks = await fetchRandomWeakPoints(userId, Math.max(3, Math.ceil(limit * 0.7)));
  if (!userId || weaks.length >= limit) {
    return { weaks: weaks.slice(0, limit), includeCorrectHint: false };
  }

  const { data: corrects } = await supabase
    .from('card_reviews')
    .select('card_id, cards(id, front, back, deck_id, decks(id, title))')
    .eq('user_id', userId)
    .eq('was_correct', true)
    .order('reviewed_at', { ascending: false })
    .limit(40);

  const weakIds = new Set(weaks.map((w) => w.cardId));
  const extras: WeakPointCard[] = [];
  for (const row of (corrects as any[]) ?? []) {
    const card = row.cards;
    if (!card?.id || weakIds.has(card.id)) continue;
    extras.push({
      cardId: card.id,
      front: String(card.front ?? ''),
      back: String(card.back ?? ''),
      deckId: String(card.deck_id ?? card.decks?.id ?? ''),
      deckTitle: String(card.decks?.title ?? 'Deck'),
    });
    if (weaks.length + extras.length >= limit) break;
  }

  // Shuffle combined mix.
  const mix = [...weaks, ...extras];
  for (let i = mix.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [mix[i], mix[j]] = [mix[j], mix[i]];
  }
  return { weaks: mix.slice(0, limit), includeCorrectHint: extras.length > 0 };
}
