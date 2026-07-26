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
  themes,
  type ThemeColors,
  type VisualThemeId,
} from '@/constants/theme';
import { loadVisualTheme, saveVisualTheme } from '@/lib/settings';

type ThemeContextValue = {
  themeId: VisualThemeId;
  colors: ThemeColors;
  setThemeId: (id: VisualThemeId) => void;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<VisualThemeId>('dusk');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVisualTheme().then((id) => {
      setThemeIdState(id);
      setIsLoading(false);
    });
  }, []);

  const setThemeId = useCallback((id: VisualThemeId) => {
    setThemeIdState(id);
    void saveVisualTheme(id);
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      colors: themes[themeId],
      setThemeId,
      isLoading,
    }),
    [themeId, setThemeId, isLoading],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
