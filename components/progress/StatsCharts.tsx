import type { ReactNode } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/ui/GlassCard';
import { chartColors, fonts, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { UserProgress } from '@/lib/progress';

type StatsChartsProps = {
  progress: UserProgress;
};

function Donut({
  percent,
  color,
  track,
  size = 120,
  stroke = 14,
  center,
}: {
  percent: number;
  color: string;
  track: string;
  size?: number;
  stroke?: number;
  center: ReactNode;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={cx} cy={cy} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <G transform={`rotate(-90 ${cx} ${cy})`}>
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      {center}
    </View>
  );
}

function BarPulse({
  values,
  labels,
  activeColor,
  idleColor,
  labelColor,
}: {
  values: number[];
  labels: string[];
  activeColor: string;
  idleColor: string;
  labelColor: string;
}) {
  const height = 110;
  const max = Math.max(...values, 1);

  return (
    <View style={styles.barRow}>
      {values.map((value, i) => {
        const h = Math.max(8, (value / max) * (height - 24));
        const active = value > 2;
        return (
          <View key={`${labels[i]}-${i}`} style={styles.barCol}>
            <View style={[styles.barTrack, { height }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: h,
                    backgroundColor: active ? activeColor : idleColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: labelColor }]}>{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function AreaSpark({
  points,
  color,
  width = 300,
  height = 120,
}: {
  points: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const pad = 8;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = Math.max(max - min, 1);
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = pad + i * step;
    const y = height - pad - ((p - min) / span) * (height - pad * 2);
    return { x, y };
  });

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const area = `${line} L ${coords[coords.length - 1]?.x ?? pad} ${height - pad} L ${pad} ${height - pad} Z`;

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#sparkFill)" />
      <Path d={line} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <Circle key={i} cx={c.x} cy={c.y} r={4} fill={color} />
      ))}
    </Svg>
  );
}

function MasteryBars({
  items,
  color,
  track,
  labelColor,
}: {
  items: { id: string; label: string; percent: number }[];
  color: string;
  track: string;
  labelColor: string;
}) {
  return (
    <View style={styles.masteryList}>
      {items.map((item) => (
        <View key={item.id} style={styles.masteryRow}>
          <View style={styles.masteryHead}>
            <Text style={[styles.masteryLabel, { color: labelColor }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.masteryPct, { color }]}>{item.percent}%</Text>
          </View>
          <View style={[styles.masteryTrack, { backgroundColor: track }]}>
            <View
              style={[
                styles.masteryFill,
                { width: `${Math.max(4, item.percent)}%` as `${number}%`, backgroundColor: color },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function StatsCharts({ progress }: StatsChartsProps) {
  const { colors } = useTheme();

  const levelPct = Math.round(progress.levelInfo.progress * 100);
  const quizPct = Math.min(100, Math.max(0, progress.averageQuizPercent));
  const dailyPct = Math.min(
    100,
    Math.round((progress.dailyXp / Math.max(progress.dailyXpGoal, 1)) * 100),
  );

  const week = progress.streakCalendar.slice(-7);
  const barValues = week.length
    ? week.map((day) => (day.active ? (day.isToday ? 10 : 8) : 1.5))
    : [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5];
  const barLabels = week.length ? week.map((d) => d.weekday.slice(0, 1)) : ['T', 'F', 'S', 'S', 'M', 'T', 'W'];

  const quizPoints = [...progress.recentQuizzes]
    .slice(0, 7)
    .reverse()
    .map((quiz) =>
      quiz.totalQuestions > 0 ? Math.round((quiz.score / quiz.totalQuestions) * 100) : 0,
    );
  const sparkPoints = quizPoints.length >= 2 ? quizPoints : [18, 32, 24, 45, 38, 55, 48];

  const mastery = progress.deckProgress.slice(0, 5).map((deck) => ({
    id: deck.deckId,
    label: deck.deckTitle,
    percent: deck.percent,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.donutRow}>
        <GlassCard accent="mint" style={styles.donutCard}>
          <Text style={[styles.cardKicker, { color: chartColors.mint, fontFamily: fonts.bodyBold }]}>
            LEVEL
          </Text>
          <View style={styles.donutCenter}>
            <Donut
              percent={levelPct}
              color={chartColors.mint}
              track={chartColors.track}
              center={
                <View style={styles.donutLabel}>
                  <Text style={[styles.donutValue, { color: colors.text, fontFamily: fonts.display }]}>
                    {progress.levelInfo.level}
                  </Text>
                  <Text style={[styles.donutSub, { color: colors.textSecondary, fontFamily: fonts.body }]}>
                    {levelPct}%
                  </Text>
                </View>
              }
            />
          </View>
          <Text style={[styles.cardFoot, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {progress.levelInfo.xpInLevel}/{progress.levelInfo.xpToNextLevel} XP
          </Text>
        </GlassCard>

        <GlassCard accent="pink" style={styles.donutCard}>
          <Text style={[styles.cardKicker, { color: chartColors.pink, fontFamily: fonts.bodyBold }]}>
            QUIZ AVG
          </Text>
          <View style={styles.donutCenter}>
            <Donut
              percent={quizPct}
              color={chartColors.pink}
              track={chartColors.track}
              center={
                <View style={styles.donutLabel}>
                  <Text style={[styles.donutValue, { color: colors.text, fontFamily: fonts.display }]}>
                    {quizPct}
                  </Text>
                  <Text style={[styles.donutSub, { color: colors.textSecondary, fontFamily: fonts.body }]}>
                    %
                  </Text>
                </View>
              }
            />
          </View>
          <Text style={[styles.cardFoot, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {progress.quizzesTaken} quizzes · daily {dailyPct}%
          </Text>
        </GlassCard>
      </View>

      <GlassCard accent="cyan">
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            Weekly pulse
          </Text>
          <Text style={[styles.cardMeta, { color: chartColors.cyan, fontFamily: fonts.bodyBold }]}>
            {progress.streak} day streak
          </Text>
        </View>
        <BarPulse
          values={barValues}
          labels={barLabels}
          activeColor={chartColors.mint}
          idleColor={chartColors.track}
          labelColor={colors.textSecondary}
        />
      </GlassCard>

      <GlassCard accent="pink">
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
            Quiz trend
          </Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary, fontFamily: fonts.body }]}>
            recent scores
          </Text>
        </View>
        <AreaSpark points={sparkPoints} color={chartColors.pink} />
      </GlassCard>

      {mastery.length > 0 ? (
        <GlassCard accent="cyan">
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>
              Deck mastery
            </Text>
          </View>
          <MasteryBars
            items={mastery}
            color={chartColors.cyan}
            track={chartColors.track}
            labelColor={colors.text}
          />
        </GlassCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  donutRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  donutCard: {
    flex: 1,
  },
  cardKicker: {
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  donutLabel: {
    alignItems: 'center',
  },
  donutValue: {
    fontSize: 28,
    lineHeight: 32,
  },
  donutSub: {
    fontSize: fontSize.xs,
  },
  cardFoot: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.md,
  },
  cardMeta: {
    fontSize: fontSize.xs,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '70%',
    borderRadius: 8,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
  },
  masteryList: {
    gap: spacing.md,
  },
  masteryRow: {
    gap: 6,
  },
  masteryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  masteryLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fonts.bodyMedium,
  },
  masteryPct: {
    fontSize: fontSize.sm,
    fontFamily: fonts.bodyBold,
  },
  masteryTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  masteryFill: {
    height: '100%',
    borderRadius: 999,
  },
});
