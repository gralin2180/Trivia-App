import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { config } from '@/constants/config';
import { supabase } from '@/lib/supabase';

type AuthResult = {
  error: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists.';
  }
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!config.isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isConfigured: config.isSupabaseConfigured,
      signIn: async (email, password) => {
        if (!config.isSupabaseConfigured) {
          return { error: 'Supabase is not configured. Add your .env file and restart the app.' };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? mapAuthError(error.message) : null };
      },
      signUp: async (email, password) => {
        if (!config.isSupabaseConfigured) {
          return { error: 'Supabase is not configured. Add your .env file and restart the app.' };
        }

        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error ? mapAuthError(error.message) : null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
