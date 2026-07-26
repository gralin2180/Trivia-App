import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

const MUSIC_URL = 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3';

let musicEnabled = false;
let musicVolume = 0.35;
let musicPlayer: AudioPlayer | null = null;

export function setGlobalMusicEnabled(enabled: boolean) {
  musicEnabled = enabled;
  if (!enabled) {
    stopMusic();
    return;
  }
  playMusic();
}

export function setGlobalMusicVolume(volume: number) {
  musicVolume = Math.min(1, Math.max(0, volume));
  try {
    if (musicPlayer) {
      musicPlayer.volume = musicVolume;
    }
  } catch {
    // ignore
  }
  if (musicEnabled && musicVolume > 0.01) {
    playMusic();
  } else if (musicVolume <= 0.01) {
    stopMusic();
  }
}

export function playMusic() {
  if (!musicEnabled || musicVolume <= 0.01) return;

  try {
    if (!musicPlayer) {
      musicPlayer = createAudioPlayer(MUSIC_URL);
      musicPlayer.loop = true;
    }
    musicPlayer.volume = musicVolume;
    musicPlayer.play();
  } catch {
    // Ignore autoplay / platform limits.
  }
}

export function stopMusic() {
  try {
    musicPlayer?.pause();
  } catch {
    // ignore
  }
}
