import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AssistantAvatar } from '@/components/mascot/AssistantAvatar';
import type { GazeDir } from '@/components/mascot/AuriMascot';
import { useAssistant } from '@/contexts/AssistantContext';
import { MASCOT_SIZE_BIG, useMascot } from '@/contexts/MascotContext';

/** Free-floating Auri — drag anywhere, tap to chat. No frame. */
export function AuriFloating() {
  const {
    position,
    setPosition,
    mascotSize,
    isEnlarged,
    isTutorial,
    isTalking,
    mood,
    openChat,
    toggleEnlarge,
    setUserDragging,
  } = useMascot();
  const { assistant } = useAssistant();

  const pan = useRef(new Animated.ValueXY(position)).current;
  const grab = useRef(new Animated.Value(0)).current;
  const origin = useRef(position);
  const moved = useRef(false);
  const [curiousGlance, setCuriousGlance] = useState(false);

  useEffect(() => {
    origin.current = position;
    Animated.spring(pan, {
      toValue: position,
      friction: 8,
      tension: 90,
      useNativeDriver: false,
    }).start();
  }, [position.x, position.y, pan]);

  // Occasional curious glance toward the middle of the screen while idle.
  useEffect(() => {
    if (isTalking || isTutorial || mood !== 'idle') {
      setCuriousGlance(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setCuriousGlance(true);
        timer = setTimeout(() => {
          if (cancelled) return;
          setCuriousGlance(false);
          schedule();
        }, 2500 + Math.random() * 1500);
      }, 7000 + Math.random() * 9000);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isTalking, isTutorial, mood]);

  const gaze = useMemo((): GazeDir => {
    const { width } = Dimensions.get('window');
    const center = width / 2;
    const mascotMid = position.x + mascotSize / 2;
    // Direction of the screen center relative to her.
    const towardCenter: GazeDir =
      mascotMid < center - 40 ? 'right' : mascotMid > center + 40 ? 'left' : 'forward';

    if (isTalking || mood === 'think' || mood === 'explain') return towardCenter;
    if (curiousGlance) return towardCenter;
    return 'forward';
  }, [position.x, mascotSize, isTalking, mood, curiousGlance]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isTutorial,
        onMoveShouldSetPanResponder: (_, g) =>
          !isTutorial && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
        onPanResponderGrant: () => {
          moved.current = false;
          setUserDragging(true);
          Animated.spring(grab, { toValue: 1, friction: 6, useNativeDriver: true }).start();
        },
        onPanResponderMove: (_, g) => {
          if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) moved.current = true;
          pan.setValue({ x: origin.current.x + g.dx, y: origin.current.y + g.dy });
        },
        onPanResponderRelease: (_, g) => {
          const { width, height } = Dimensions.get('window');
          const next = {
            x: Math.max(4, Math.min(width - MASCOT_SIZE_BIG - 4, origin.current.x + g.dx)),
            y: Math.max(40, Math.min(height - MASCOT_SIZE_BIG - 20, origin.current.y + g.dy)),
          };
          origin.current = next;
          setPosition(next, true);
          setUserDragging(false);
          Animated.spring(grab, { toValue: 0, friction: 6, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => {
          setUserDragging(false);
        },
      }),
    [isTutorial, pan, grab, setPosition, setUserDragging],
  );

  function onTap() {
    if (isTutorial || moved.current) return;
    if (isEnlarged) {
      openChat();
      return;
    }
    toggleEnlarge();
    setTimeout(() => openChat(), 150);
  }

  const grabScale = grab.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          width: mascotSize,
          height: mascotSize,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...(isTutorial ? {} : panResponder.panHandlers)}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale: grabScale }] }}>
        <Pressable
          onPress={onTap}
          accessibilityLabel={`${assistant.name}, drag to move, tap to talk`}
          style={styles.hit}
        >
          <View pointerEvents="none">
            <AssistantAvatar size={mascotSize} mood={mood} gaze={gaze} />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 60,
    elevation: 60,
  },
  hit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
