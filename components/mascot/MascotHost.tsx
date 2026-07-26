import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuriDialogue } from '@/components/mascot/AuriDialogue';
import { AuriFloating } from '@/components/mascot/AuriFloating';
import { AuriWelcomeScreen } from '@/components/mascot/AuriWelcomeScreen';
import { TutorialSpotlight } from '@/components/mascot/TutorialSpotlight';
import { useAuth } from '@/contexts/AuthContext';
import { useMascot } from '@/contexts/MascotContext';
import { useProgress } from '@/hooks/useProgress';

/** Floating Auri + welcome screen + dialogue + highlight tour. */
export function MascotHost({ showCompanion = true }: { showCompanion?: boolean }) {
  const { canUseApp, user } = useAuth();
  const { startSessionGreeting, isTutorial, isReady, isSessionGreeting } = useMascot();
  const { progress, isLoading } = useProgress(user?.id);
  const greetedThisSession = useRef(false);

  useEffect(() => {
    if (!canUseApp || !isReady || isLoading || isTutorial || greetedThisSession.current) {
      return;
    }

    const timer = setTimeout(() => {
      if (greetedThisSession.current) return;
      greetedThisSession.current = true;
      startSessionGreeting({
        streak: progress.streak,
        xp: progress.xp,
        level: progress.levelInfo.level,
        dailyCardsStudied: progress.dailyCardsStudied,
        dailyGoal: progress.dailyGoal,
        dailyXp: progress.dailyXp,
        dailyXpGoal: progress.dailyXpGoal,
        cardsStudied: progress.cardsStudied,
        quizzesTaken: progress.quizzesTaken,
        continueDeckTitle: progress.continueDeck?.deckTitle ?? null,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [canUseApp, isReady, isLoading, isTutorial, progress, startSessionGreeting]);

  if (!canUseApp) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {isSessionGreeting ? <AuriWelcomeScreen /> : null}
      {!isSessionGreeting ? (
        <>
          <TutorialSpotlight />
          {showCompanion ? <AuriFloating /> : null}
          <AuriDialogue />
        </>
      ) : null}
    </View>
  );
}
