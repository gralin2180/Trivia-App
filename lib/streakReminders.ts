import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_ENABLED_KEY = 'streak_reminders_enabled_v1';
const LAST_TEMPLATE_KEY = 'streak_reminder_last_template_v1';

/**
 * Duolingo-inspired slots:
 * - routine: gentle habit-window nudge
 * - save: loss-aversion “don’t lose your streak” evening push
 * Cap: 2/day. Rotate templates for novelty.
 */
export const ROUTINE_TEMPLATES = [
  { id: 'r1', title: 'Auri checking in', body: 'A quick session keeps your streak warm. Just a few cards?' },
  { id: 'r2', title: 'Curiosity calling', body: 'Your mind’s ready — open ACUMEN for a short learn.' },
  { id: 'r3', title: 'Tiny win time', body: 'Three minutes. One deck. That’s enough for today.' },
  { id: 'r4', title: 'Hey, learner', body: 'I saved your spot. Ready when you are.' },
];

export const SAVE_TEMPLATES = [
  { id: 's1', title: 'Don’t lose your streak', body: 'Your streak is still alive — a tiny study saves it.' },
  { id: 's2', title: 'Streak on the line', body: 'Day’s almost over. Protect what you built.' },
  { id: 's3', title: 'Auri needs you', body: 'One card before midnight. Your streak is counting on you.' },
  { id: 's4', title: 'Last call', body: 'Don’t let today’s streak slip. Open ACUMEN for a quick save.' },
];

export async function loadStreakRemindersEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(REMINDERS_ENABLED_KEY);
  if (value === null) return true;
  return value === 'true';
}

export async function saveStreakRemindersEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_ENABLED_KEY, String(enabled));
}

async function pickTemplate(pool: { id: string; title: string; body: string }[]) {
  const last = await AsyncStorage.getItem(LAST_TEMPLATE_KEY);
  const fresh = pool.filter((t) => t.id !== last);
  const list = fresh.length ? fresh : pool;
  const pick = list[Math.floor(Math.random() * list.length)];
  await AsyncStorage.setItem(LAST_TEMPLATE_KEY, pick.id);
  return pick;
}

function nextDateAt(hour: number, minute: number) {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/** Schedule routine (~afternoon) + save (~evening) local notifications. No-op on web. */
export async function scheduleStreakReminders(opts?: { streak?: number }): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const enabled = await loadStreakRemindersEnabled();
  if (!enabled) {
    await cancelStreakReminders();
    return false;
  }

  try {
    const Device = await import('expo-device');
    const Notifications = await import('expo-notifications');

    if (!Device.isDevice) return false;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const current = await Notifications.getPermissionsAsync();
    const granted =
      current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return false;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const streak = opts?.streak ?? 0;
    const routine = await pickTemplate(ROUTINE_TEMPLATES);
    const save = await pickTemplate(SAVE_TEMPLATES);
    const saveBody =
      streak > 0 ? `${save.body} You’re on a ${streak}-day streak.` : save.body;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: routine.title,
        body: routine.body,
        data: { slot: 'routine' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextDateAt(17, 30),
      },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: save.title,
        body: saveBody,
        data: { slot: 'save' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextDateAt(21, 0),
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function cancelStreakReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Device = await import('expo-device');
    const Notifications = await import('expo-notifications');
    if (!Device.isDevice) return false;
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}
