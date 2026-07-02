import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedArea =
      segments[0] === '(tabs)' ||
      segments[0] === 'deck' ||
      segments[0] === 'study' ||
      segments[0] === 'quiz' ||
      segments[0] === 'generate';

    if (!session && inProtectedArea) {
      router.replace('/(auth)/login');
      return;
    }

    if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return <LoadingScreen message="Checking session..." />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="generate" options={{ headerShown: true, title: 'Create deck' }} />
        <Stack.Screen name="deck/[id]" options={{ headerShown: true, title: 'Deck Detail' }} />
        <Stack.Screen name="study/[deckId]" options={{ headerShown: true, title: 'Study' }} />
        <Stack.Screen name="quiz/[deckId]" options={{ headerShown: true, title: 'Quiz' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
