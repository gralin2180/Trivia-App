import { supabase } from '@/lib/supabase';

export type LeaderboardEntry = {
  id: string;
  displayName: string;
  xp: number;
  streak: number;
  isYou: boolean;
};

export async function syncProfileRank(input: {
  userId: string;
  displayName: string;
  xp: number;
  streak: number;
}): Promise<void> {
  try {
    await supabase.from('profiles').upsert({
      id: input.userId,
      display_name: input.displayName.slice(0, 24),
      xp: input.xp,
      streak: input.streak,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Table may not exist yet — leaderboard still works locally.
  }
}

export async function fetchLeaderboard(currentUserId?: string): Promise<{
  entries: LeaderboardEntry[];
  source: 'live' | 'local';
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, xp, streak')
      .order('xp', { ascending: false })
      .limit(25);

    if (error) {
      return { entries: [], source: 'local', error: error.message };
    }

    if (!data || data.length === 0) {
      return { entries: [], source: 'live', error: null };
    }

    const entries: LeaderboardEntry[] = data.map((row) => ({
      id: row.id as string,
      displayName: (row.display_name as string) || 'Learner',
      xp: Number(row.xp) || 0,
      streak: Number(row.streak) || 0,
      isYou: Boolean(currentUserId && row.id === currentUserId),
    }));

    return { entries, source: 'live', error: null };
  } catch (error) {
    return {
      entries: [],
      source: 'local',
      error: error instanceof Error ? error.message : 'Could not load leaderboard.',
    };
  }
}

/** Fallback board when profiles table is empty / unavailable. */
export function buildLocalLeaderboard(input: {
  userId?: string;
  displayName: string;
  xp: number;
  streak: number;
}): LeaderboardEntry[] {
  const you: LeaderboardEntry = {
    id: input.userId ?? 'you',
    displayName: input.displayName || 'You',
    xp: input.xp,
    streak: input.streak,
    isYou: true,
  };

  const rivals: LeaderboardEntry[] = [
    { id: 'r1', displayName: 'Nova', xp: Math.max(input.xp + 180, 420), streak: 9, isYou: false },
    { id: 'r2', displayName: 'Kai', xp: Math.max(input.xp + 60, 260), streak: 5, isYou: false },
    { id: 'r3', displayName: 'Mira', xp: Math.max(input.xp - 40, 120), streak: 3, isYou: false },
    { id: 'r4', displayName: 'Jules', xp: Math.max(input.xp - 110, 80), streak: 2, isYou: false },
  ];

  return [...rivals, you].sort((a, b) => b.xp - a.xp);
}
