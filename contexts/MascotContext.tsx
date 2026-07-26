import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Dimensions } from 'react-native';

import type { MascotMood } from '@/constants/auriSprites';
import { useTheme } from '@/contexts/ThemeContext';
import {
  AURI_TUTORIAL,
  mascotSpotBeside,
  rectForAnchor,
  type TutorialStep,
} from '@/lib/auriTutorial';
import {
  answerCoachQuestion,
  buildSessionGreeting,
  COACH_TOPICS,
  type SessionGreeting,
  type SessionGreetingStats,
} from '@/lib/mascotCoach';
import {
  loadMascotIntroSeen,
  loadMascotPosition,
  saveMascotIntroSeen,
  saveMascotPosition,
} from '@/lib/settings';

export const MASCOT_SIZE_SMALL = 104;
export const MASCOT_SIZE_BIG = 148;

export type DialoguePayload = {
  title?: string;
  body: string;
  mood?: MascotMood;
  choices?: { id: string; label: string }[];
  primaryLabel?: string;
  onPrimary?: () => void;
};

type MascotContextValue = {
  position: { x: number; y: number };
  setPosition: (pos: { x: number; y: number }, persist?: boolean) => void;
  mascotSize: number;
  isEnlarged: boolean;
  isTalking: boolean;
  isTutorial: boolean;
  mood: MascotMood;
  dialogue: DialoguePayload | null;
  tutorialStep: TutorialStep | null;
  tutorialIndex: number;
  spotlight: ReturnType<typeof rectForAnchor> | null;
  introPending: boolean;
  /** True once mascot prefs (intro seen, position) have loaded. */
  isReady: boolean;
  /** Full-screen open-app welcome (blocks Learn until dismissed). */
  sessionGreeting: SessionGreeting | null;
  greetingStep: number;
  isSessionGreeting: boolean;
  openChat: () => void;
  closeDialogue: () => void;
  enlarge: () => void;
  shrink: () => void;
  toggleEnlarge: () => void;
  /** Open-app greeting: motivation → stats, then reveal Learn. */
  startSessionGreeting: (stats: SessionGreetingStats) => void;
  advanceSessionGreeting: () => void;
  dismissSessionGreeting: () => void;
  startTutorial: () => void;
  nextTutorialStep: () => Promise<void>;
  skipTutorial: () => Promise<void>;
  askQuick: (text: string) => void;
  celebrate: (message?: string) => void;
  markIntroSeen: () => Promise<void>;
  setUserDragging: (dragging: boolean) => void;
};

const MascotContext = createContext<MascotContextValue | null>(null);

function defaultPos() {
  const { width, height } = Dimensions.get('window');
  return { x: width - MASCOT_SIZE_SMALL - 12, y: height - MASCOT_SIZE_SMALL - 150 };
}

export function MascotProvider({ children }: { children: ReactNode }) {
  const { themeId, setThemeId } = useTheme();
  const [position, setPositionState] = useState(defaultPos);
  const [isEnlarged, setEnlarged] = useState(false);
  const [mood, setMood] = useState<MascotMood>('idle');
  const [dialogue, setDialogue] = useState<DialoguePayload | null>(null);
  const [introPending, setIntroPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [tutorialIndex, setTutorialIndex] = useState(-1);
  const [userDragging, setUserDragging] = useState(false);
  const [sessionGreeting, setSessionGreeting] = useState<SessionGreeting | null>(null);
  const [greetingStep, setGreetingStep] = useState(0);

  const moodRef = useRef(mood);
  const dialogueRef = useRef(dialogue);
  const tutorialRef = useRef(tutorialIndex);
  const draggingRef = useRef(false);
  const positionRef = useRef(position);
  const lastChatPromptRef = useRef(-1);

  moodRef.current = mood;
  dialogueRef.current = dialogue;
  tutorialRef.current = tutorialIndex;
  draggingRef.current = userDragging;
  positionRef.current = position;

  const isTutorial = tutorialIndex >= 0 && tutorialIndex < AURI_TUTORIAL.length;
  const tutorialStep = isTutorial ? AURI_TUTORIAL[tutorialIndex] : null;
  const isSessionGreeting = sessionGreeting != null;
  const isTalking = dialogue != null || isTutorial || isSessionGreeting;
  const spotlight = tutorialStep ? rectForAnchor(tutorialStep.anchor) : null;
  const mascotSize = isEnlarged || isTutorial ? MASCOT_SIZE_BIG : MASCOT_SIZE_SMALL;

  useEffect(() => {
    Promise.all([loadMascotIntroSeen(), loadMascotPosition()]).then(([seen, savedPos]) => {
      setIntroPending(!seen);
      if (savedPos) setPositionState(savedPos);
      setReady(true);
    });
  }, []);

  const setPosition = useCallback((pos: { x: number; y: number }, persist = true) => {
    const { width, height } = Dimensions.get('window');
    const clamped = {
      x: Math.max(4, Math.min(width - MASCOT_SIZE_BIG - 4, pos.x)),
      y: Math.max(40, Math.min(height - MASCOT_SIZE_BIG - 20, pos.y)),
    };
    setPositionState(clamped);
    positionRef.current = clamped;
    if (persist) void saveMascotPosition(clamped);
  }, []);

  const busy = useCallback(() => {
    return (
      dialogueRef.current != null ||
      tutorialRef.current >= 0 ||
      draggingRef.current ||
      sessionGreeting != null
    );
  }, [sessionGreeting]);

  // Idle cat traits (no roaming).
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        if (busy()) {
          schedule();
          return;
        }

        const roll = Math.random();
        if (roll < 0.4) {
          setMood('lick');
          setTimeout(() => {
            if (!busy() && moodRef.current === 'lick') setMood('idle');
          }, 3000);
        } else if (roll < 0.7) {
          setMood('beckon');
          setTimeout(() => {
            if (!busy() && moodRef.current === 'beckon') setMood('idle');
          }, 2400);
        } else if (roll < 0.9) {
          setMood('wave');
          setTimeout(() => {
            if (!busy() && moodRef.current === 'wave') setMood('idle');
          }, 2000);
        }
        schedule();
      }, 8000 + Math.random() * 8000);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [ready, busy]);

  const closeDialogue = useCallback(() => {
    setDialogue(null);
    if (!isTutorial) {
      setEnlarged(false);
      setMood('idle');
    }
  }, [isTutorial]);

  const enlarge = useCallback(() => {
    setEnlarged(true);
    setMood('wave');
  }, []);

  const shrink = useCallback(() => {
    setEnlarged(false);
    if (!isTalking) setMood('idle');
  }, [isTalking]);

  const toggleEnlarge = useCallback(() => {
    setEnlarged((v) => {
      const next = !v;
      setMood(next ? 'wave' : 'idle');
      return next;
    });
  }, []);

  const openChat = useCallback(() => {
    const themeSuggestion =
      themeId === 'dusk'
        ? { id: 'light', label: 'Try light theme' }
        : { id: 'dark', label: 'Try dark theme' };
    const prompts = [
      `What are you curious about? Try “${themeId === 'dusk' ? 'light' : 'dark'} theme”, quests, or ask how to build a deck.`,
      'Need a study nudge? I can explain quizzes, streaks, quests, themes, or help you get started.',
      'Ask away — I can change the look, find your next challenge, or point you toward a new topic.',
      'What should we explore today? Ask about learning, XP, daily goals, ranks, or your app settings.',
    ];
    let promptIndex = Math.floor(Math.random() * prompts.length);
    if (prompts.length > 1 && promptIndex === lastChatPromptRef.current) {
      promptIndex = (promptIndex + 1) % prompts.length;
    }
    lastChatPromptRef.current = promptIndex;

    const rotatingChoices = [
      { id: 'start', label: 'How do I start?' },
      { id: 'quests', label: 'Daily quests?' },
      { id: 'study-quiz', label: 'Study or quiz?' },
      { id: 'streaks', label: 'How do streaks work?' },
      { id: 'ranks', label: 'Show leaderboard' },
    ];
    const firstChoice = rotatingChoices[Math.floor(Math.random() * rotatingChoices.length)];

    setEnlarged(true);
    setMood('wave');
    setDialogue({
      title: 'Auri',
      body: prompts[promptIndex],
      choices: [
        firstChoice,
        themeSuggestion,
        { id: 'tour', label: 'Show me around' },
      ],
      primaryLabel: 'Got it',
    });
    setTimeout(() => setMood('explain'), 900);
  }, [themeId]);

  const askQuick = useCallback(
    (text: string) => {
      const topic = COACH_TOPICS.find((t) => t.id === text || t.title === text);
      const result = topic ? { answer: topic.answer } : answerCoachQuestion(text);

      if (result.action?.type === 'setTheme') {
        setThemeId(result.action.theme);
      }

      setEnlarged(true);
      setMood('think');
      setDialogue({
        title: 'Auri',
        body: result.answer,
        primaryLabel: 'Got it',
        choices: [
          { id: 'start', label: 'How do I start?' },
          { id: 'theme', label: 'Themes' },
          { id: 'tour', label: 'Tour again' },
        ],
      });
      setTimeout(() => setMood('explain'), 650);
    },
    [setThemeId],
  );

  const celebrate = useCallback((message?: string) => {
    setEnlarged(true);
    setMood('cheer');
    setDialogue({
      title: 'Nice work!',
      body: message ?? 'That’s the streak I like to see. Want to keep the momentum going?',
      primaryLabel: 'Thanks!',
    });
    setTimeout(() => setMood('proud'), 1800);
  }, []);

  const applyTutorialStep = useCallback(
    (index: number) => {
      const step = AURI_TUTORIAL[index];
      if (!step) return;
      const rect = rectForAnchor(step.anchor);
      setPosition(mascotSpotBeside(rect, MASCOT_SIZE_BIG), false);
      setEnlarged(true);
      setMood(step.mood);
      setDialogue({
        title: step.title,
        body: step.body,
        primaryLabel: index >= AURI_TUTORIAL.length - 1 ? 'Finish' : 'Next',
      });
    },
    [setPosition],
  );

  const startTutorial = useCallback(() => {
    setTutorialIndex(0);
    applyTutorialStep(0);
  }, [applyTutorialStep]);

  const dismissSessionGreeting = useCallback(() => {
    setSessionGreeting(null);
    setGreetingStep(0);
    setEnlarged(false);
    setMood('idle');
  }, []);

  const advanceSessionGreeting = useCallback(() => {
    if (!sessionGreeting) return;
    if (greetingStep < 1) {
      setGreetingStep(1);
      setMood('proud');
      return;
    }
    dismissSessionGreeting();
  }, [sessionGreeting, greetingStep, dismissSessionGreeting]);

  const startSessionGreeting = useCallback((stats: SessionGreetingStats) => {
    if (tutorialRef.current >= 0) return;
    const greeting = buildSessionGreeting(stats);
    setDialogue(null);
    setGreetingStep(0);
    setSessionGreeting(greeting);
    setMood('wave');
    setTimeout(() => setMood('cheer'), 700);
  }, []);

  const skipTutorial = useCallback(async () => {
    setTutorialIndex(-1);
    setDialogue(null);
    setEnlarged(false);
    setMood('idle');
    setIntroPending(false);
    await saveMascotIntroSeen();
  }, []);

  const nextTutorialStep = useCallback(async () => {
    const next = tutorialIndex + 1;
    if (next >= AURI_TUTORIAL.length) {
      setTutorialIndex(-1);
      setIntroPending(false);
      await saveMascotIntroSeen();
      setEnlarged(true);
      setMood('cheer');
      setDialogue({
        title: 'You’re all set!',
        body: 'Drag me anywhere. Tap me when you need a tip. I’ll be right here.',
        primaryLabel: 'Thanks Auri',
      });
      setTimeout(() => setMood('proud'), 1700);
      return;
    }
    setTutorialIndex(next);
    applyTutorialStep(next);
  }, [tutorialIndex, applyTutorialStep]);

  const markIntroSeen = useCallback(async () => {
    setIntroPending(false);
    await saveMascotIntroSeen();
  }, []);

  const value = useMemo(
    () => ({
      position,
      setPosition,
      mascotSize,
      isEnlarged,
      isTalking,
      isTutorial,
      mood,
      dialogue,
      tutorialStep,
      tutorialIndex,
      spotlight,
      introPending: ready && introPending,
      isReady: ready,
      sessionGreeting,
      greetingStep,
      isSessionGreeting,
      openChat,
      closeDialogue,
      enlarge,
      shrink,
      toggleEnlarge,
      startSessionGreeting,
      advanceSessionGreeting,
      dismissSessionGreeting,
      startTutorial,
      nextTutorialStep,
      skipTutorial,
      askQuick,
      celebrate,
      markIntroSeen,
      setUserDragging,
    }),
    [
      position,
      setPosition,
      mascotSize,
      isEnlarged,
      isTalking,
      isTutorial,
      mood,
      dialogue,
      tutorialStep,
      tutorialIndex,
      spotlight,
      ready,
      introPending,
      sessionGreeting,
      greetingStep,
      isSessionGreeting,
      openChat,
      closeDialogue,
      enlarge,
      shrink,
      toggleEnlarge,
      startSessionGreeting,
      advanceSessionGreeting,
      dismissSessionGreeting,
      startTutorial,
      nextTutorialStep,
      skipTutorial,
      askQuick,
      celebrate,
      markIntroSeen,
    ],
  );

  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>;
}

export function useMascot() {
  const context = useContext(MascotContext);
  if (!context) {
    throw new Error('useMascot must be used within MascotProvider');
  }
  return context;
}
