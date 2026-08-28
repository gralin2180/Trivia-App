import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  loadDisplayName,
  loadHapticsEnabled,
  loadMusicEnabled,
  loadMusicVolume,
  loadSfxVolume,
  loadSoundEnabled,
  loadVoiceFeedbackEnabled,
  saveDisplayName,
  saveHapticsEnabled,
  saveMusicEnabled,
  saveMusicVolume,
  saveSfxVolume,
  saveSoundEnabled,
  saveVoiceFeedbackEnabled,
} from '@/lib/settings';
import { setGlobalMusicEnabled, setGlobalMusicVolume } from '@/lib/music';
import { setGlobalSfxVolume, setGlobalSoundEnabled } from '@/lib/sounds';

type SettingsContextValue = {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  voiceFeedbackEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  displayName: string;
  isLoading: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setVoiceFeedbackEnabled: (enabled: boolean) => void;
  setSfxVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setDisplayName: (name: string) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [musicEnabled, setMusicEnabledState] = useState(false);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [sfxVolume, setSfxVolumeState] = useState(0.8);
  const [musicVolume, setMusicVolumeState] = useState(0.35);
  const [displayName, setDisplayNameState] = useState('');
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabledState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      loadSoundEnabled(),
      loadMusicEnabled(),
      loadHapticsEnabled(),
      loadSfxVolume(),
      loadMusicVolume(),
      loadDisplayName(),
      loadVoiceFeedbackEnabled(),
    ]).then(([sound, music, haptics, sfx, musicVol, name, voice]) => {
      setSoundEnabledState(sound);
      setGlobalSoundEnabled(sound);
      setMusicEnabledState(music);
      setSfxVolumeState(sfx);
      setGlobalSfxVolume(sfx);
      setMusicVolumeState(musicVol);
      setGlobalMusicVolume(musicVol);
      setGlobalMusicEnabled(music);
      setHapticsEnabledState(haptics);
      setDisplayNameState(name ?? '');
      setVoiceFeedbackEnabledState(voice);
      setIsLoading(false);
    });
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    setGlobalSoundEnabled(enabled);
    void saveSoundEnabled(enabled);
  }, []);

  const setMusicEnabled = useCallback((enabled: boolean) => {
    setMusicEnabledState(enabled);
    setGlobalMusicEnabled(enabled);
    void saveMusicEnabled(enabled);
  }, []);

  const setHapticsEnabled = useCallback((enabled: boolean) => {
    setHapticsEnabledState(enabled);
    void saveHapticsEnabled(enabled);
  }, []);

  const setVoiceFeedbackEnabled = useCallback((enabled: boolean) => {
    setVoiceFeedbackEnabledState(enabled);
    void saveVoiceFeedbackEnabled(enabled);
  }, []);

  const setSfxVolume = useCallback((volume: number) => {
    const next = Math.min(1, Math.max(0, volume));
    setSfxVolumeState(next);
    setGlobalSfxVolume(next);
    void saveSfxVolume(next);
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    const next = Math.min(1, Math.max(0, volume));
    setMusicVolumeState(next);
    setGlobalMusicVolume(next);
    void saveMusicVolume(next);
  }, []);

  const setDisplayName = useCallback(async (name: string) => {
    setDisplayNameState(name.trim().slice(0, 24));
    await saveDisplayName(name);
  }, []);

  const value = useMemo(
    () => ({
      soundEnabled,
      musicEnabled,
      hapticsEnabled,
      voiceFeedbackEnabled,
      sfxVolume,
      musicVolume,
      displayName,
      isLoading,
      setSoundEnabled,
      setMusicEnabled,
      setHapticsEnabled,
      setVoiceFeedbackEnabled,
      setSfxVolume,
      setMusicVolume,
      setDisplayName,
    }),
    [
      soundEnabled,
      musicEnabled,
      hapticsEnabled,
      voiceFeedbackEnabled,
      sfxVolume,
      musicVolume,
      displayName,
      isLoading,
      setSoundEnabled,
      setMusicEnabled,
      setHapticsEnabled,
      setVoiceFeedbackEnabled,
      setSfxVolume,
      setMusicVolume,
      setDisplayName,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
