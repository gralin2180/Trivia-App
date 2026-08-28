import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { config } from '@/constants/config';
import { signInWithSocialProvider, type SocialProvider } from '@/lib/auth/oauth';
import { loadGuestMode, saveGuestMode } from '@/lib/settings';
import { supabase } from '@/lib/supabase';

type AuthResult = {
  error: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  isGuest: boolean;
  /** Signed in OR exploring as guest */
  canUseApp: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithProvider: (provider: SocialProvider) => Promise<string | null>;
  continueAsGuest: () => Promise<string | null>;
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
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Hard ceiling so the splash never sticks on web
    const hardStop = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 1200);

    async function boot() {
      try {
        const guest = await Promise.race([
          loadGuestMode(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 800)),
        ]);

        if (!config.isSupabaseConfigured) {
          if (mounted) {
            setIsGuest(guest);
            setIsLoading(false);
          }
          return;
        }

        const sessionPromise = supabase.auth.getSession();
        const timeout = new Promise<{ data: { session: null } }>((resolve) => {
          setTimeout(() => resolve({ data: { session: null } }), 1000);
        });
        const { data } = await Promise.race([sessionPromise, timeout]);
        if (!mounted) return;

        setSession(data.session);
        setIsGuest(data.session ? false : guest);
        if (data.session) {
          void saveGuestMode(false);
        }
      } catch {
        // fall through — still leave splash
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void boot();

    if (!config.isSupabaseConfigured) {
      return () => {
        mounted = false;
        clearTimeout(hardStop);
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setIsGuest(false);
        void saveGuestMode(false);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(hardStop);
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => {
      const isAnonymous = Boolean(session?.user?.is_anonymous);
      const guestLike = isGuest || isAnonymous;

      return {
      session,
      user: session?.user ?? null,
      isLoading,
      isConfigured: config.isSupabaseConfigured,
      isGuest: guestLike,
      canUseApp: Boolean(session) || isGuest,
      signIn: async (email, password) => {
        if (!config.isSupabaseConfigured) {
          return { error: 'Supabase is not configured. Add your .env file and restart the app.' };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          setIsGuest(false);
          await saveGuestMode(false);
        }
        return { error: error ? mapAuthError(error.message) : null };
      },
      signUp: async (email, password) => {
        if (!config.isSupabaseConfigured) {
          return { error: 'Supabase is not configured. Add your .env file and restart the app.' };
        }

        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error ? mapAuthError(error.message) : null };
      },
      signInWithProvider: async (provider) => {
        if (!config.isSupabaseConfigured) {
          return 'Supabase is not configured. Add your .env file and restart the app.';
        }

        const error = await signInWithSocialProvider(provider);
        if (!error) {
          setIsGuest(false);
          await saveGuestMode(false);
        }
        return error;
      },
      continueAsGuest: async () => {
        // Prefer local guest immediately so onboarding never hangs waiting on network.
        setIsGuest(true);
        await saveGuestMode(true);

        if (config.isSupabaseConfigured) {
          try {
            const anon = supabase.auth.signInAnonymously();
            const timeout = new Promise<{ data: { session: null }; error: { message: string } }>(
              (resolve) =>
                setTimeout(
                  () => resolve({ data: { session: null }, error: { message: 'timeout' } }),
                  4000,
                ),
            );
            const result = (await Promise.race([anon, timeout])) as {
              data: { session: Session | null };
              error: { message: string } | null;
            };
            // Keep guest mode even if anonymous auth succeeds — free-gen limits still apply.
            if (result.error || !result.data.session) {
              // Local guest + X-Acumen-Guest-Id path still works for generation.
            }
          } catch {
            // stay as local guest
          }
        }

        return null;
      },
      signOut: async () => {
        setIsGuest(false);
        await saveGuestMode(false);
        if (config.isSupabaseConfigured) {
          await supabase.auth.signOut();
        } else {
          setSession(null);
        }
      },
    };
    },
    [session, isLoading, isGuest],
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
