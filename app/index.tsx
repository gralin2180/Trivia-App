import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Starting app..." />;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
