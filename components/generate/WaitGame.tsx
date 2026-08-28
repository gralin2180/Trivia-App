import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, fontSize, radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type Obstacle = { x: number; w: number; h: number };

const GAME_H = 220;
const PLAYER = 22;
const GRAVITY = 0.55;
const JUMP = -8.6;
const GROUND = 18;

/**
 * Original tap-to-hop runner for the generate wait. Not Flappy Bird / Chrome dino.
 */
export function WaitGame() {
  const { colors } = useTheme();
  const [width, setWidth] = useState(320);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [alive, setAlive] = useState(true);
  const [tick, setTick] = useState(0);

  const state = useRef({
    y: GAME_H - GROUND - PLAYER,
    vy: 0,
    obstacles: [] as Obstacle[],
    spawn: 0,
    dist: 0,
    speed: 4.2,
    dead: false,
    score: 0,
  });

  const reset = useCallback(() => {
    state.current = {
      y: GAME_H - GROUND - PLAYER,
      vy: 0,
      obstacles: [{ x: 280, w: 18, h: 34 }],
      spawn: 70,
      dist: 0,
      speed: 4.2,
      dead: false,
      score: 0,
    };
    setAlive(true);
    setScore(0);
  }, []);

  const jump = useCallback(() => {
    const s = state.current;
    if (s.dead) {
      reset();
      return;
    }
    const floor = GAME_H - GROUND - PLAYER;
    if (s.y >= floor - 1) {
      s.vy = JUMP;
    }
  }, [reset]);

  useEffect(() => {
    let frame = 0;
    let last = Date.now();
    const loop = () => {
      const now = Date.now();
      const dt = Math.min(2.2, (now - last) / 16.67);
      last = now;
      const s = state.current;
      if (!s.dead) {
        const floor = GAME_H - GROUND - PLAYER;
        s.vy += GRAVITY * dt;
        s.y = Math.min(floor, s.y + s.vy * dt);
        if (s.y >= floor) {
          s.y = floor;
          s.vy = 0;
        }
        s.speed = Math.min(8.2, 4.2 + s.dist / 1400);
        s.spawn -= dt;
        if (s.spawn <= 0) {
          const h = 26 + Math.floor(Math.random() * 28);
          s.obstacles.push({ x: width + 10, w: 16 + Math.floor(Math.random() * 10), h });
          s.spawn = 55 + Math.random() * 50;
        }
        const next: Obstacle[] = [];
        const px = 44;
        for (const ob of s.obstacles) {
          ob.x -= s.speed * dt;
          if (ob.x + ob.w < -20) continue;
          const py = s.y;
          const hit =
            px < ob.x + ob.w &&
            px + PLAYER > ob.x &&
            py + PLAYER > GAME_H - GROUND - ob.h;
          if (hit) {
            s.dead = true;
            setAlive(false);
            setBest((b) => Math.max(b, s.score));
            break;
          }
          next.push(ob);
        }
        s.obstacles = next;
        s.dist += s.speed * dt;
        const nextScore = Math.floor(s.dist / 8);
        if (nextScore !== s.score) {
          s.score = nextScore;
          setScore(nextScore);
        }
      }
      setTick((n) => n + 1);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [width]);

  const s = state.current;
  void tick;

  return (
    <View style={styles.wrap}>
      <View style={styles.hud}>
        <Text style={[styles.hudText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
          Hop  ·  {score}
        </Text>
        <Text style={[styles.hudMuted, { color: colors.textMuted, fontFamily: fonts.body }]}>
          best {best}  ·  tap to jump
        </Text>
      </View>
      <Pressable
        onPress={jump}
        onLayout={(e) => setWidth(Math.max(240, e.nativeEvent.layout.width))}
        style={[
          styles.field,
          { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
        ]}
      >
        <View style={[styles.sky, { backgroundColor: colors.glowPrimary }]} />
        <View style={[styles.ground, { backgroundColor: colors.primary, height: GROUND }]} />
        <View
          style={[
            styles.player,
            {
              left: 44,
              top: s.y,
              backgroundColor: colors.primary,
              borderColor: colors.primaryLight,
            },
          ]}
        />
        {s.obstacles.map((ob, i) => (
          <View
            key={`${ob.x}-${i}`}
            style={[
              styles.ob,
              {
                left: ob.x,
                width: ob.w,
                height: ob.h,
                bottom: GROUND,
                backgroundColor: colors.secondary,
              },
            ]}
          />
        ))}
        {!alive ? (
          <View style={styles.over}>
            <Text style={[styles.overTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
              Ouch — {score}
            </Text>
            <Text style={[styles.overHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
              Tap to hop again
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  hudText: { fontSize: fontSize.md },
  hudMuted: { fontSize: fontSize.sm },
  field: {
    height: GAME_H,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  sky: { position: 'absolute', top: 18, right: 28, width: 36, height: 36, borderRadius: 18, opacity: 0.45 },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  player: {
    position: 'absolute',
    width: PLAYER,
    height: PLAYER,
    borderRadius: 7,
    borderWidth: 2,
  },
  ob: { position: 'absolute', borderRadius: 3 },
  over: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    gap: 4,
  },
  overTitle: { fontSize: fontSize.lg },
  overHint: { fontSize: fontSize.sm },
});
