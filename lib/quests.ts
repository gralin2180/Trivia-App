import AsyncStorage from '@react-native-async-storage/async-storage';

import { game } from '@/constants/theme';

const QUESTS_KEY = 'daily_quests_v1';

export type QuestKind = 'study' | 'quiz' | 'timed' | 'generate' | 'streak';

export type DailyQuest = {
  id: string;
  kind: QuestKind;
  title: string;
  hint: string;
  target: number;
  progress: number;
  xp: number;
  claimed: boolean;
};

type QuestsState = {
  dateKey: string;
  quests: DailyQuest[];
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function buildQuests(): DailyQuest[] {
  return [
    {
      id: 'study_3',
      kind: 'study',
      title: 'Study 3 cards',
      hint: 'Flip through any deck',
      target: 3,
      progress: 0,
      xp: 40,
      claimed: false,
    },
    {
      id: 'quiz_1',
      kind: 'quiz',
      title: 'Finish a quiz',
      hint: 'Practice or classic quiz',
      target: 1,
      progress: 0,
      xp: 60,
      claimed: false,
    },
    {
      id: 'timed_1',
      kind: 'timed',
      title: 'Race the clock',
      hint: 'Complete one Timed run',
      target: 1,
      progress: 0,
      xp: 80,
      claimed: false,
    },
    {
      id: 'generate_1',
      kind: 'generate',
      title: 'Build a deck',
      hint: 'Generate any new topic',
      target: 1,
      progress: 0,
      xp: game.xpPerDailyQuest / 3,
      claimed: false,
    },
  ];
}

async function readState(): Promise<QuestsState> {
  const raw = await AsyncStorage.getItem(QUESTS_KEY);
  const key = todayKey();
  if (!raw) {
    const fresh = { dateKey: key, quests: buildQuests() };
    await AsyncStorage.setItem(QUESTS_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw) as QuestsState;
    if (parsed.dateKey !== key) {
      const fresh = { dateKey: key, quests: buildQuests() };
      await AsyncStorage.setItem(QUESTS_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch {
    const fresh = { dateKey: key, quests: buildQuests() };
    await AsyncStorage.setItem(QUESTS_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

async function writeState(state: QuestsState) {
  await AsyncStorage.setItem(QUESTS_KEY, JSON.stringify(state));
}

export async function loadDailyQuests(): Promise<DailyQuest[]> {
  const state = await readState();
  return state.quests;
}

export async function bumpQuestProgress(kind: QuestKind, amount = 1): Promise<DailyQuest[]> {
  const state = await readState();
  state.quests = state.quests.map((q) => {
    if (q.kind !== kind || q.claimed) return q;
    return {
      ...q,
      progress: Math.min(q.target, q.progress + amount),
    };
  });
  await writeState(state);
  return state.quests;
}

export async function claimQuest(id: string): Promise<{ quests: DailyQuest[]; xpEarned: number }> {
  const state = await readState();
  let xpEarned = 0;
  state.quests = state.quests.map((q) => {
    if (q.id !== id || q.claimed || q.progress < q.target) return q;
    xpEarned = q.xp;
    return { ...q, claimed: true };
  });
  await writeState(state);
  return { quests: state.quests, xpEarned };
}

export function questCompletion(quests: DailyQuest[]) {
  const done = quests.filter((q) => q.progress >= q.target).length;
  return { done, total: quests.length };
}
