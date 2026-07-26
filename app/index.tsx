import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { loadOnboardingComplete } from '@/lib/settings';

export default function Index() {
  const { canUseApp, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const stop = setTimeout(() => {
      if (alive) setOnboardingDone(false);
    }, 1000);
    loadOnboardingComplete()
      .then((done) => {
        if (alive) setOnboardingDone(done);
      })
      .catch(() => {
        if (alive) setOnboardingDone(false);
      })
      .finally(() => clearTimeout(stop));
    return () => {
      alive = false;
      clearTimeout(stop);
    };
  }, []);

  if (isLoading || onboardingDone === null) {
    return <LoadingScreen message="Starting ACUMEN..." />;
  }

  if (canUseApp) {
    return <Redirect href="/(tabs)" />;
  }

  if (!onboardingDone) {
    return <Redirect href={'/(auth)/onboarding' as Href} />;
  }

  return <Redirect href="/(auth)/login" />;
}
