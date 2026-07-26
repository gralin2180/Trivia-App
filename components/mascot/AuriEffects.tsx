import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { MascotMood } from '@/constants/auriSprites';

type Props = {
  mood: MascotMood;
  size: number;
};

/** Floating mood particles around Auri — sparkles, thought dots, hearts. */
export function AuriEffects({ mood, size }: Props) {
  if (mood === 'cheer') return <Sparkles size={size} />;
  if (mood === 'proud') return <Sparkles size={size} variant="proud" />;
  if (mood === 'think') return <ThoughtDots size={size} />;
  return null;
}

function Sparkles({ size, variant = 'cheer' }: { size: number; variant?: 'cheer' | 'proud' }) {
  const specs =
    variant === 'cheer'
      ? [
          { x: 0.02, y: 0.12, delay: 0, scale: 0.22, color: '#FBBF24' },
          { x: 0.82, y: 0.06, delay: 160, scale: 0.17, color: '#2EE6C5' },
          { x: 0.9, y: 0.42, delay: 320, scale: 0.2, color: '#FF9EBB' },
          { x: -0.04, y: 0.5, delay: 480, scale: 0.15, color: '#FBBF24' },
        ]
      : [
          { x: 0.08, y: 0.06, delay: 0, scale: 0.18, color: '#FBBF24' },
          { x: 0.8, y: 0.14, delay: 300, scale: 0.15, color: '#FBBF24' },
        ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {specs.map((s, i) => (
        <Twinkle
          key={i}
          delay={s.delay}
          color={s.color}
          size={size * s.scale}
          left={size * s.x}
          top={size * s.y}
        />
      ))}
    </View>
  );
}

function Twinkle({
  delay,
  color,
  size,
  left,
  top,
}: {
  delay: number;
  color: string;
  size: number;
  left: number;
  top: number;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 420,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0.15] }),
        transform: [
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.15] }) },
          {
            rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }),
          },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.5] }) },
        ],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M12 1 L14.4 8.6 L22 11 L14.4 13.4 L12 21 L9.6 13.4 L2 11 L9.6 8.6 Z"
          fill={color}
        />
        <Circle cx="12" cy="11" r="2" fill="#FFFFFF" opacity={0.85} />
      </Svg>
    </Animated.View>
  );
}

function ThoughtDots({ size }: { size: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 1900,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: size * (0.74 + i * 0.07),
            top: size * (0.2 - i * 0.07),
            opacity: t.interpolate({
              inputRange: [0, 0.3 + i * 0.2, 0.7 + i * 0.1, 1],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {
                translateY: t.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -size * 0.08],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              width: size * (0.07 + i * 0.02),
              height: size * (0.07 + i * 0.02),
              borderRadius: 999,
              backgroundColor: '#FFFFFF',
              opacity: 0.9,
            }}
          />
        </Animated.View>
      ))}
      <Animated.View
        style={{
          position: 'absolute',
          left: size * 0.86,
          top: size * 0.02,
          opacity: t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 0.2] }),
        }}
      >
        <Text style={{ fontSize: size * 0.2, color: '#FFFFFF', fontWeight: '700' }}>?</Text>
      </Animated.View>
    </View>
  );
}
