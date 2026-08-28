import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getAssistant, type AssistantId, type AssistantOption } from '@/constants/assistants';
import { loadAssistantId, saveAssistantId } from '@/lib/settings';

type AssistantContextValue = {
  assistantId: AssistantId;
  assistant: AssistantOption;
  isLoading: boolean;
  setAssistantId: (id: AssistantId) => Promise<void>;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [assistantId, setId] = useState<AssistantId>('cat');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadAssistantId().then((id) => {
      setId(id);
      setIsLoading(false);
    });
  }, []);

  const setAssistantId = useCallback(async (id: AssistantId) => {
    setId(id);
    await saveAssistantId(id);
  }, []);

  const value = useMemo<AssistantContextValue>(
    () => ({
      assistantId,
      assistant: getAssistant(assistantId),
      isLoading,
      setAssistantId,
    }),
    [assistantId, isLoading, setAssistantId],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider');
  return ctx;
}
