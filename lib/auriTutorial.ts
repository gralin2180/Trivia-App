import { Dimensions } from 'react-native';

import type { MascotMood } from '@/constants/auriSprites';

export type TutorialAnchor =
  | 'welcome'
  | 'search'
  | 'tabLearn'
  | 'tabDecks'
  | 'tabQuests'
  | 'tabRanks'
  | 'tabProfile';

export type TutorialStep = {
  id: string;
  anchor: TutorialAnchor;
  mood: MascotMood;
  title: string;
  body: string;
};

/** Guided tour — Auri walks to each hotspot and explains it. */
export const AURI_TUTORIAL: TutorialStep[] = [
  {
    id: 'hello',
    anchor: 'welcome',
    mood: 'wave',
    title: 'Hey — I’m Auri',
    body: 'I’m your curious cat coach. Drag me anywhere. Tap me to chat. Let’s peek around!',
  },
  {
    id: 'search',
    anchor: 'search',
    mood: 'explain',
    title: 'Build any deck',
    body: 'Type a topic up here — “photosynthesis”, “SQL joins”, whatever — then Build my deck.',
  },
  {
    id: 'learn',
    anchor: 'tabLearn',
    mood: 'explain',
    title: 'Learn home',
    body: 'This is home base. Continue lessons, weak topics, and syllabus gaps live here.',
  },
  {
    id: 'decks',
    anchor: 'tabDecks',
    mood: 'cheer',
    title: 'Your decks',
    body: 'Everything you’ve generated lands in Decks. Open one to study or quiz.',
  },
  {
    id: 'quests',
    anchor: 'tabQuests',
    mood: 'explain',
    title: 'Daily quests',
    body: 'Tiny goals, bonus XP. Check Quests when you want a nudge without the guilt trip.',
  },
  {
    id: 'ranks',
    anchor: 'tabRanks',
    mood: 'proud',
    title: 'Ranks',
    body: 'See Top minds on the leaderboard. Set a display name in Settings so you show up cute.',
  },
  {
    id: 'profile',
    anchor: 'tabProfile',
    mood: 'think',
    title: 'Profile & settings',
    body: 'Badges, stats, and the gear for themes, sound, and reminders. Tap me anytime if you’re stuck!',
  },
];

export type SpotlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Approximate hotspot rects from screen size (works before measured layout). */
export function rectForAnchor(anchor: TutorialAnchor): SpotlightRect {
  const { width: W, height: H } = Dimensions.get('window');
  const tabH = 72;
  const tabY = H - tabH - 8;
  const tabW = W / 5;

  switch (anchor) {
    case 'welcome':
      return { x: W * 0.5 - 70, y: H * 0.35, width: 140, height: 140 };
    case 'search':
      return { x: 16, y: 120, width: W - 32, height: 56 };
    case 'tabLearn':
      return { x: tabW * 0 + 4, y: tabY, width: tabW - 8, height: tabH - 8 };
    case 'tabDecks':
      return { x: tabW * 1 + 4, y: tabY, width: tabW - 8, height: tabH - 8 };
    case 'tabQuests':
      return { x: tabW * 2 + 4, y: tabY, width: tabW - 8, height: tabH - 8 };
    case 'tabRanks':
      return { x: tabW * 3 + 4, y: tabY, width: tabW - 8, height: tabH - 8 };
    case 'tabProfile':
      return { x: tabW * 4 + 4, y: tabY, width: tabW - 8, height: tabH - 8 };
    default:
      return { x: W / 2 - 40, y: H / 2 - 40, width: 80, height: 80 };
  }
}

/** Place Auri beside a spotlight without covering it. */
export function mascotSpotBeside(rect: SpotlightRect, mascotSize: number): { x: number; y: number } {
  const { width: W, height: H } = Dimensions.get('window');
  const pad = 12;
  let x = rect.x + rect.width + pad;
  let y = rect.y + rect.height / 2 - mascotSize / 2;

  if (x + mascotSize > W - 8) {
    x = Math.max(8, rect.x - mascotSize - pad);
  }
  if (y < 48) y = 48;
  if (y + mascotSize > H - 100) y = H - 100 - mascotSize;

  return { x, y };
}
