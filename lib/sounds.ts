import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export type SoundName = 'correct' | 'wrong' | 'levelUp' | 'perfect' | 'complete';

const SOUND_URLS: Record<SoundName, string> = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  perfect: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  complete: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
};

let soundEnabled = true;
const players = new Map<SoundName, AudioPlayer>();

export function setGlobalSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function playSound(name: SoundName) {
  if (!soundEnabled) return;

  try {
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(SOUND_URLS[name]);
      players.set(name, player);
    }
    player.seekTo(0);
    player.play();
  } catch {
    // Ignore playback errors (e.g. web autoplay restrictions).
  }
}
