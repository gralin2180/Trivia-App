import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { loadSoundEnabled, saveSoundEnabled } from '@/lib/settings';
import { setGlobalSoundEnabled } from '@/lib/sounds';

type SettingsContextValue = {
  soundEnabled: boolean;
  isLoading: boolean;
  setSoundEnabled: (enabled: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSoundEnabled().then((enabled) => {
      setSoundEnabledState(enabled);
      setGlobalSoundEnabled(enabled);
      setIsLoading(false);
    });
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    setGlobalSoundEnabled(enabled);
    saveSoundEnabled(enabled);
  }, []);

  const value = useMemo(
    () => ({ soundEnabled, isLoading, setSoundEnabled }),
    [soundEnabled, isLoading, setSoundEnabled],
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
