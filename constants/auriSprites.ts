export type MascotMood =
  | 'idle'
  | 'wave'
  | 'think'
  | 'explain'
  | 'cheer'
  | 'proud'
  | 'lick'
  | 'beckon'
  | 'gazeLeft'
  | 'gazeRight';

/** Direction on the screen she's looking toward. */
export type GazeDir = 'left' | 'right' | 'forward';

export const AURI_FRAMES = {
  idle: require('../assets/mascot/auri-idle.png'),
  idleBlink: require('../assets/mascot/auri-idle-blink.png'),
  wave: require('../assets/mascot/auri-wave.png'),
  think: require('../assets/mascot/auri-think.png'),
  explain: require('../assets/mascot/auri-explain.png'),
  cheer: require('../assets/mascot/auri-cheer.png'),
  proud: require('../assets/mascot/auri-proud.png'),
  lick: require('../assets/mascot/auri-lick.png'),
  beckon: require('../assets/mascot/auri-beckon.png'),
  gazeLeft: require('../assets/mascot/auri-gaze-left.png'),
  gazeRight: require('../assets/mascot/auri-gaze-right.png'),
  face: require('../assets/mascot/auri-face.png'),
} as const;

export function frameForMood(mood: MascotMood, blinking = false) {
  if (mood === 'idle' && blinking) return AURI_FRAMES.idleBlink;
  return AURI_FRAMES[mood];
}

/** When idle + glancing, swap to a head-turn gaze pose. */
export function resolveDisplayMood(mood: MascotMood, gaze: GazeDir): MascotMood {
  if (gaze === 'forward') return mood;
  // Only override calm poses — keep expressive moods as-is.
  if (mood === 'idle' || mood === 'think' || mood === 'explain') {
    return gaze === 'left' ? 'gazeLeft' : 'gazeRight';
  }
  return mood;
}

export const MOOD_LABEL: Record<MascotMood, string> = {
  idle: 'Hanging out',
  wave: 'Saying hi',
  think: 'Concentrating',
  explain: 'Explaining',
  cheer: 'Celebrating',
  proud: 'Proud of you',
  lick: 'Grooming',
  beckon: 'Come here!',
  gazeLeft: 'Curious',
  gazeRight: 'Curious',
};
