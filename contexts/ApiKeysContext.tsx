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
  loadApiKeyBannerDismissed,
  loadApiKeys,
  removeApiKey as removeStoredKey,
  saveApiKey as saveStoredKey,
  saveApiKeyBannerDismissed,
  type AiProviderId,
  type ApiKeyMap,
} from '@/lib/apiKeys';
import {
  defaultPreferredModelId,
  loadAccessMode,
  loadPreferredModelId,
  saveAccessMode,
  savePreferredModelId,
  type AiAccessMode,
} from '@/constants/aiModels';

type ApiKeysContextValue = {
  keys: ApiKeyMap;
  isLoading: boolean;
  hasAnyKey: boolean;
  keyCount: number;
  bannerDismissed: boolean;
  preferredModelId: string;
  accessMode: AiAccessMode;
  setKey: (id: AiProviderId, value: string) => Promise<void>;
  removeKey: (id: AiProviderId) => Promise<void>;
  dismissBanner: () => Promise<void>;
  setPreferredModelId: (id: string) => Promise<void>;
  setAccessMode: (mode: AiAccessMode) => Promise<void>;
};

const ApiKeysContext = createContext<ApiKeysContextValue | null>(null);

export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<ApiKeyMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [preferredModelId, setPreferredModelIdState] = useState(defaultPreferredModelId());
  const [accessMode, setAccessModeState] = useState<AiAccessMode>('builtin');

  useEffect(() => {
    Promise.all([
      loadApiKeys(),
      loadApiKeyBannerDismissed(),
      loadPreferredModelId(),
      loadAccessMode(),
    ]).then(([loaded, dismissed, modelId, mode]) => {
      setKeys(loaded);
      setBannerDismissed(dismissed);
      setPreferredModelIdState(modelId);
      setAccessModeState(mode);
      setIsLoading(false);
    });
  }, []);

  const setKey = useCallback(async (id: AiProviderId, value: string) => {
    const trimmed = value.trim();
    await saveStoredKey(id, trimmed);
    setKeys((prev) => {
      const next = { ...prev };
      if (trimmed) {
        next[id] = trimmed;
      } else {
        delete next[id];
      }
      return next;
    });
  }, []);

  const removeKey = useCallback(async (id: AiProviderId) => {
    await removeStoredKey(id);
    setKeys((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const dismissBanner = useCallback(async () => {
    setBannerDismissed(true);
    await saveApiKeyBannerDismissed();
  }, []);

  const setPreferredModelId = useCallback(async (id: string) => {
    await savePreferredModelId(id);
    setPreferredModelIdState(id);
  }, []);

  const setAccessMode = useCallback(async (mode: AiAccessMode) => {
    await saveAccessMode(mode);
    setAccessModeState(mode);
  }, []);

  const value = useMemo<ApiKeysContextValue>(() => {
    const keyCount = Object.keys(keys).length;
    return {
      keys,
      isLoading,
      hasAnyKey: keyCount > 0,
      keyCount,
      bannerDismissed,
      preferredModelId,
      accessMode,
      setKey,
      removeKey,
      dismissBanner,
      setPreferredModelId,
      setAccessMode,
    };
  }, [
    keys,
    isLoading,
    bannerDismissed,
    preferredModelId,
    accessMode,
    setKey,
    removeKey,
    dismissBanner,
    setPreferredModelId,
    setAccessMode,
  ]);

  return <ApiKeysContext.Provider value={value}>{children}</ApiKeysContext.Provider>;
}

export function useApiKeys() {
  const context = useContext(ApiKeysContext);
  if (!context) {
    throw new Error('useApiKeys must be used within ApiKeysProvider');
  }
  return context;
}
