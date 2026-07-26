import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { AuriEffects } from '@/components/mascot/AuriEffects';
import {
  frameForMood,
  resolveDisplayMood,
  type GazeDir,
  type MascotMood,
} from '@/constants/auriSprites';

export type { MascotMood, GazeDir };

type AuriProps = {
  size?: number;
  mood?: MascotMood;
  quiet?: boolean;
  /** Look toward a side of the screen with head + eyes (not a tilt). */
  gaze?: GazeDir;
};

/**
 * Auri sprite player.
 * Blink = idle ↔ idleBlink (same body). Gaze = head-turn poses toward screen center.
 */
export function AuriMascot({
  size = 96,
  mood = 'idle',
  quiet = false,
  gaze = 'forward',
}: AuriProps) {
  const [blinking, setBlinking] = useState(false);
  const displayMood = resolveDisplayMood(mood, gaze);
  // Don't blink over a gaze pose — eyes are part of that drawing.
  const frame = frameForMood(displayMood, displayMood === 'idle' && blinking);

  const [layers, setLayers] = useState({ front: frame, back: frame });
  const fade = useRef(new Animated.Value(1)).current;

  const bob = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const nod = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (frame === layers.front) return;

    // Idle blink snaps — same silhouette.
    if (displayMood === 'idle') {
      fade.setValue(1);
      setLayers({ front: frame, back: frame });
      return;
    }

    setLayers((prev) => ({ front: frame, back: prev.front }));
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setLayers({ front: frame, back: frame });
    });
  }, [frame, layers.front, fade, displayMood]);

  useEffect(() => {
    if (displayMood !== 'idle') {
      setBlinking(false);
      return;
    }

    let cancelled = false;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let scheduleTimer: ReturnType<typeof setTimeout> | undefined;

    const blinkOnce = (then?: () => void) => {
      if (cancelled) return;
      setBlinking(true);
      openTimer = setTimeout(() => {
        setBlinking(false);
        then?.();
      }, 120 + Math.random() * 40);
    };

    const schedule = () => {
      scheduleTimer = setTimeout(() => {
        if (Math.random() < 0.28) {
          blinkOnce(() => setTimeout(() => blinkOnce(schedule), 140));
        } else {
          blinkOnce(schedule);
        }
      }, 2200 + Math.random() * 2800);
    };

    schedule();
    return () => {
      cancelled = true;
      if (openTimer) clearTimeout(openTimer);
      if (scheduleTimer) clearTimeout(scheduleTimer);
    };
  }, [displayMood]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  useEffect(() => {
    hop.stopAnimation();
    sway.stopAnimation();
    nod.stopAnimation();
    pulse.stopAnimation();
    hop.setValue(0);
    sway.setValue(0);
    nod.setValue(0);
    pulse.setValue(0);

    if (quiet) return;

    const animations: Animated.CompositeAnimation[] = [];
    const animMood = displayMood === 'gazeLeft' || displayMood === 'gazeRight' ? 'idle' : mood;

    if (animMood === 'cheer') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(hop, {
              toValue: 1,
              duration: 260,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(hop, {
              toValue: 0,
              duration: 240,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.delay(90),
          ]),
        ),
      );
    }

    if (animMood === 'wave' || animMood === 'beckon') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(sway, {
              toValue: 1,
              duration: 240,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(sway, {
              toValue: -1,
              duration: 240,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ),
      );
    }

    if (animMood === 'lick') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(nod, {
              toValue: 1,
              duration: 320,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(nod, {
              toValue: 0,
              duration: 320,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ),
      );
    }

    if (animMood === 'explain') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(nod, {
              toValue: 1,
              duration: 420,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(nod, {
              toValue: 0,
              duration: 420,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.delay(260),
          ]),
        ),
      );
    }

    if (animMood === 'think') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(sway, {
              toValue: 0.4,
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(sway, {
              toValue: -0.2,
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ),
      );
    }

    if (animMood === 'proud') {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 1,
              duration: 700,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 0,
              duration: 700,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ),
      );
    }

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [mood, displayMood, quiet, hop, sway, nod, pulse]);

  const breatheY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.02] });
  const hopY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.15] });
  const nodY = nod.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.025] });
  const translateY = Animated.add(Animated.add(breatheY, hopY), nodY);

  const scaleX = Animated.multiply(
    bob.interpolate({ inputRange: [0, 1], outputRange: [1, 1.01] }),
    Animated.add(
      hop.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1.04, 0.98, 0.95] }),
      pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.04] }),
    ),
  );
  const scaleY = Animated.multiply(
    bob.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }),
    Animated.add(
      hop.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.96, 1.02, 1.05] }),
      pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.05] }),
    ),
  );

  const rotate = Animated.add(
    sway.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] }),
    nod.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }),
  ).interpolate({ inputRange: [-12, 12], outputRange: ['-12deg', '12deg'] });

  return (
    <View
      pointerEvents="none"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ translateY }, { scaleX }, { scaleY }, { rotate }],
        }}
      >
        <Animated.Image
          source={layers.back}
          resizeMode="contain"
          style={{
            position: 'absolute',
            width: size,
            height: size,
            opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          }}
        />
        <Animated.Image
          source={layers.front}
          resizeMode="contain"
          style={{ position: 'absolute', width: size, height: size, opacity: fade }}
        />
      </Animated.View>

      {quiet ? null : <AuriEffects mood={mood} size={size} />}
    </View>
  );
}
