import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MascotHost } from '@/components/mascot/MascotHost';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ApiKeysProvider } from '@/contexts/ApiKeysContext';
import { AssistantProvider } from '@/contexts/AssistantContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MascotProvider } from '@/contexts/MascotContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useAppFonts } from '@/hooks/useAppFonts';
import { hydrateRemoteConfig } from '@/lib/remoteConfig';
import { scheduleStreakReminders } from '@/lib/streakReminders';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

void hydrateRemoteConfig();

function RootLayoutNav() {
  const { canUseApp, isGuest, session, isLoading, user } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!canUseApp) return;
    void scheduleStreakReminders();
  }, [canUseApp, user?.id]);

  const currentRoot = segments[0] as string | undefined;
  // Study and quiz are focus modes — no floating cat over the cards.
  const focusMode = currentRoot === 'study' || currentRoot === 'quiz';

  useEffect(() => {
    if (isLoading) return;

    const root = segments[0] as string | undefined;
    const authScreen = segments[1] as string | undefined;
    const inAuthGroup = root === '(auth)';
    const inAuthCallback = root === 'auth';
    const inOnboarding = authScreen === 'onboarding';
    const upgradingGuest =
      isGuest && (authScreen === 'login' || authScreen === 'signup');
    const inProtectedArea =
      root === '(tabs)' ||
      root === 'deck' ||
      root === 'study' ||
      root === 'quiz' ||
      root === 'generate' ||
      root === 'badges' ||
      root === 'leaderboard' ||
      root === 'settings' ||
      root === 'api-keys' ||
      root === 'subscribe';

    if (!canUseApp && inProtectedArea) {
      router.replace('/(auth)/onboarding' as Href);
      return;
    }

    // Fully signed-in users leave auth; guests/anonymous may upgrade via login/signup.
    if (session && inAuthGroup && !inOnboarding && !isGuest) {
      router.replace('/(tabs)');
    }

    if (!session && isGuest && inAuthGroup && !inOnboarding && !upgradingGuest) {
      router.replace('/(tabs)');
    }

    if ((session || isGuest) && inAuthCallback) {
      router.replace('/(tabs)');
    }
  }, [canUseApp, isGuest, session, isLoading, segments, router]);

  if (isLoading) {
    return <LoadingScreen message="Starting ACUMEN..." />;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={colors.statusBar} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="generate" options={{ headerShown: true, title: 'Create deck' }} />
        <Stack.Screen name="deck/[id]" options={{ headerShown: true, title: 'Deck Detail' }} />
        <Stack.Screen name="study/[deckId]" options={{ headerShown: true, title: 'Study' }} />
        <Stack.Screen name="quiz/[deckId]" options={{ headerShown: true, title: 'Quiz' }} />
        <Stack.Screen name="badges" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="api-keys" />
        <Stack.Screen name="subscribe" />
      </Stack>
      <MascotHost hidden={focusMode} />
    </View>
  );
}

function FontGate({ children }: { children: React.ReactNode }) {
  useAppFonts();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemeProvider>
          <FontGate>
            <AuthProvider>
              <ApiKeysProvider>
                <AssistantProvider>
                  <MascotProvider>
                    <RootLayoutNav />
                  </MascotProvider>
                </AssistantProvider>
              </ApiKeysProvider>
            </AuthProvider>
          </FontGate>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
