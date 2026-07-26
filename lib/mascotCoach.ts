import type { VisualThemeId } from '@/constants/theme';

export type CoachTopic = {
  id: string;
  title: string;
  answer: string;
};

export type CoachAction =
  | { type: 'setTheme'; theme: VisualThemeId }
  | { type: 'openSettings' }
  | { type: 'openQuests' }
  | { type: 'openRanks' }
  | { type: 'openLearn' };

export type CoachResult = {
  answer: string;
  action?: CoachAction;
};

export const COACH_TOPICS: CoachTopic[] = [
  {
    id: 'start',
    title: 'How do I start?',
    answer:
      'Go to Learn, type any topic (or tap a chip), then hit Build my deck. From there you can study cards or quiz yourself.',
  },
  {
    id: 'study-quiz',
    title: 'Study vs Quiz?',
    answer:
      'Study flips cards at your pace. Quiz tests you with choices and XP. Practice skips hearts; Timed races the clock for bonus XP.',
  },
  {
    id: 'quests',
    title: 'Daily quests?',
    answer:
      'Open Quests in the bottom menu. Finish today’s goals for bonus XP — study, quiz, or keep your streak alive.',
  },
  {
    id: 'streaks',
    title: 'What are streaks?',
    answer:
      'Learn a little each day and your streak grows. I’ll nudge you with gentle reminders so you don’t lose it — like a friendly coach, not a nag.',
  },
  {
    id: 'theme',
    title: 'Change theme',
    answer:
      'Say “light”, “dark”, or “minimal” and I’ll switch it — or open Settings (gear on Profile) anytime.',
  },
  {
    id: 'ranks',
    title: 'Leaderboard?',
    answer:
      'Tap Ranks in the bottom menu for Top minds. Set a display name in Settings so you show up nicely.',
  },
  {
    id: 'guest',
    title: 'Need an account?',
    answer:
      'Nope — try first. Sign in when you want streaks and ranks synced across devices.',
  },
];

export const ONBOARDING_LINES = [
  {
    title: 'Mrrp — I’m Auri',
    body: 'Your curious cat coach. Type any topic and I’ll help turn curiosity into a deck.',
    mood: 'wave' as const,
  },
  {
    title: 'Learn your way',
    body: 'Study calmly, chase quests for XP, and keep a streak — without the guilt trip.',
    mood: 'explain' as const,
  },
  {
    title: 'I’m free-range',
    body: 'Inside the app, drag me anywhere. Tap me to chat — I’ll also walk you through a quick tour.',
    mood: 'think' as const,
  },
];

/** Snapshot used for the open-app greeting (motivation → stats). */
export type SessionGreetingStats = {
  streak: number;
  xp: number;
  level: number;
  dailyCardsStudied: number;
  dailyGoal: number;
  dailyXp: number;
  dailyXpGoal: number;
  cardsStudied: number;
  quizzesTaken: number;
  continueDeckTitle?: string | null;
};

export type SessionGreeting = {
  helloTitle: string;
  helloBody: string;
  statsTitle: string;
  statsBody: string;
};

const HELLO_LINES = [
  'Hey — you’re here. That already counts. Let’s make today a little sharper.',
  'Mrrp! Fresh session energy. One focused block beats a perfect plan you never start.',
  'Welcome back. Curiosity called — and you answered. I’m proud of that.',
  'Hi again. Small steps stack. We’ll keep it kind and keep it moving.',
  'You showed up. That’s the hard part. I’ll help with the rest.',
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** Build a two-beat open-app greeting: motivation, then relevant stats. */
export function buildSessionGreeting(stats: SessionGreetingStats): SessionGreeting {
  const helloBody = pick(HELLO_LINES);
  const dailyLeft = Math.max(0, stats.dailyGoal - stats.dailyCardsStudied);
  const dailyDone = stats.dailyCardsStudied >= stats.dailyGoal && stats.dailyGoal > 0;
  const xpLeft = Math.max(0, stats.dailyXpGoal - stats.dailyXp);

  let statsBody: string;

  if (stats.streak <= 0 && stats.cardsStudied <= 0) {
    statsBody =
      'Fresh start: 0-day streak, Level 1. Build one tiny deck or study a few cards — I’ll cheer the first spark.';
  } else if (stats.streak <= 0) {
    statsBody = `You’re Level ${stats.level} with ${stats.xp} XP and ${stats.cardsStudied} cards studied — but the streak is cold. One session today lights it again.`;
  } else if (dailyDone) {
    statsBody = `${stats.streak}-day streak · Level ${stats.level} · ${stats.xp} XP. Daily goal already hit (${stats.dailyCardsStudied}/${stats.dailyGoal}). Keep the glow — a quest or quick quiz still stacks XP.`;
  } else if (stats.streak >= 7) {
    statsBody = `On fire: ${stats.streak}-day streak · Level ${stats.level} · ${stats.xp} XP. ${dailyLeft} card${dailyLeft === 1 ? '' : 's'} left for today’s goal${stats.continueDeckTitle ? ` — “${stats.continueDeckTitle}” is waiting` : ''}.`;
  } else if (stats.continueDeckTitle) {
    statsBody = `${stats.streak}-day streak · Level ${stats.level} · ${stats.xp} XP. Daily ${stats.dailyCardsStudied}/${stats.dailyGoal} cards (${xpLeft} XP to daily XP goal). Jump back into “${stats.continueDeckTitle}”.`;
  } else {
    statsBody = `${stats.streak}-day streak · Level ${stats.level} · ${stats.xp} XP · ${stats.quizzesTaken} quiz${stats.quizzesTaken === 1 ? '' : 'zes'}. Daily progress ${stats.dailyCardsStudied}/${stats.dailyGoal} cards — ${dailyLeft || 'a few'} to go. You’ve got this.`;
  }

  return {
    helloTitle: pick(['Hey from Auri', 'Auri checking in', 'Welcome back', 'Mrrp — you’re here']),
    helloBody,
    statsTitle: pick(['Your pulse', 'Quick glance', 'Here’s where you stand']),
    statsBody,
  };
}

function includesAny(q: string, words: string[]) {
  return words.some((w) => q.includes(w));
}

/** Smarter keyword coach — can also perform simple actions (theme switch). */
export function answerCoachQuestion(input: string): CoachResult {
  const q = input.trim().toLowerCase();

  if (!q) {
    return { answer: 'Ask me anything — themes, decks, quests, streaks, ranks, or how to start.' };
  }

  if (includesAny(q, ['light', 'day studio', 'day theme', 'bright'])) {
    return {
      answer: 'Switched to Light · Day Studio. Soft and easy on the eyes.',
      action: { type: 'setTheme', theme: 'day' },
    };
  }

  if (includesAny(q, ['minimal', 'simple', 'clean theme', 'plain'])) {
    return {
      answer: 'Switched to Minimal — clean, quiet, and focused.',
      action: { type: 'setTheme', theme: 'minimal' },
    };
  }

  if (includesAny(q, ['dark', 'neon', 'dusk', 'night mode'])) {
    return {
      answer: 'Switched to Dark · Neon Glass. Mint energy, still readable.',
      action: { type: 'setTheme', theme: 'dusk' },
    };
  }

  if (includesAny(q, ['theme', 'appearance', 'looks', 'color mode'])) {
    return {
      answer:
        'Want Light, Dark, or Minimal? Just say the word and I’ll switch — or use the gear on Profile.',
    };
  }

  if (includesAny(q, ['quest', 'daily goal', 'mission', 'challenge'])) {
    return {
      answer: COACH_TOPICS.find((t) => t.id === 'quests')!.answer,
      action: { type: 'openQuests' },
    };
  }

  if (includesAny(q, ['syllabus', 'school', 'college', 'university', 'curriculum', 'real world', 'gap'])) {
    return {
      answer:
        'On Learn, open “Syllabus vs real world.” Pick School / College / University topics (like AI on campus), read the lag stats, then build a bridge deck.',
      action: { type: 'openLearn' },
    };
  }

  if (includesAny(q, ['deck', 'topic', 'generat', 'learn', 'build', 'create', 'start', 'begin', 'how do i'])) {
    return {
      answer: COACH_TOPICS[0].answer,
      action: { type: 'openLearn' },
    };
  }

  if (includesAny(q, ['quiz', 'study', 'practice', 'timed', 'heart', 'card'])) {
    return { answer: COACH_TOPICS[1].answer };
  }

  if (includesAny(q, ['streak', 'remind', 'notification', 'duo', 'miss a day'])) {
    return { answer: COACH_TOPICS.find((t) => t.id === 'streaks')!.answer };
  }

  if (includesAny(q, ['badge', 'achievement', 'unlock'])) {
    return {
      answer: 'Open Profile → Badges to see what you’ve unlocked. Keep learning to earn more.',
    };
  }

  if (includesAny(q, ['leader', 'rank', 'top mind', 'scoreboard', 'compete'])) {
    return {
      answer: COACH_TOPICS.find((t) => t.id === 'ranks')!.answer,
      action: { type: 'openRanks' },
    };
  }

  if (includesAny(q, ['sound', 'music', 'volume', 'sfx', 'haptic', 'setting'])) {
    return {
      answer:
        'Open Settings from the gear on Profile — sound, music volume, theme, and account live there.',
      action: { type: 'openSettings' },
    };
  }

  if (includesAny(q, ['account', 'login', 'sign', 'guest', 'sync'])) {
    return { answer: COACH_TOPICS.find((t) => t.id === 'guest')!.answer };
  }

  if (includesAny(q, ['xp', 'level', 'experience', 'points'])) {
    return {
      answer:
        'You earn XP from studying and quizzes. Daily quests give bonus XP. Level up shows on Profile.',
    };
  }

  if (includesAny(q, ['hello', 'hi', 'hey', 'sup', 'yo'])) {
    return {
      answer: 'Hey! I’m Auri. Ask about themes, decks, quests, streaks — or say “light” to switch looks.',
    };
  }

  if (includesAny(q, ['help', 'stuck', 'confused', 'what can'])) {
    return {
      answer:
        'I can switch themes, explain decks/quizzes, point you to Quests or Ranks, and walk you through streaks. What do you need?',
    };
  }

  return {
    answer: `Got it — “${input.trim()}”. Try asking about themes (light/dark/minimal), building a deck, quests, streaks, or ranks — or tap a tip below.`,
  };
}
