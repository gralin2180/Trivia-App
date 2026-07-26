import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { levelLabel, SYLLABUS_GAPS, type EducationLevel } from '@/lib/syllabusGaps';

const LEVELS: EducationLevel[] = ['school', 'college', 'university'];

const LEVEL_ICON: Record<EducationLevel, keyof typeof Ionicons.glyphMap> = {
  school: 'school-outline',
  college: 'library-outline',
  university: 'business-outline',
};

/** Browse curriculum vs real-world gaps, then generate a bridge deck. */
export function SyllabusGapSection() {
  const router = useRouter();
  const { colors } = useTheme();

  function openGap(id: string) {
    router.push({
      pathname: '/generate',
      params: { gapId: id },
    });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="school-outline" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>
          Syllabus vs real world
        </Text>
      </View>
      <Text style={[styles.blurb, { color: colors.textMuted, fontFamily: fonts.body }]}>
        See where school, college, and university lag industry — with stats — then build a deck to
        bridge the gap.
      </Text>

      {LEVELS.map((level) => {
        const items = SYLLABUS_GAPS.filter((g) => g.level === level);
        if (items.length === 0) return null;
        return (
          <View key={level} style={styles.levelBlock}>
            <View style={styles.levelRow}>
              <Ionicons name={LEVEL_ICON[level]} size={16} color={colors.primary} />
              <Text
                style={[styles.levelLabel, { color: colors.textSecondary, fontFamily: fonts.bodyBold }]}
              >
                {levelLabel(level).toUpperCase()}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cards}
            >
              {items.map((gap) => (
                <Pressable
                  key={gap.id}
                  onPress={() => openGap(gap.id)}
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
                    numberOfLines={2}
                  >
                    {gap.title}
                  </Text>
                  <Text
                    style={[styles.cardLag, { color: colors.textMuted, fontFamily: fonts.body }]}
                    numberOfLines={3}
                  >
                    {gap.lagSummary}
                  </Text>
                  <Text
                    style={[styles.statPeek, { color: colors.primary, fontFamily: fonts.bodyMedium }]}
                    numberOfLines={2}
                  >
                    {gap.stats[0]}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text
                      style={[styles.cta, { color: colors.primary, fontFamily: fonts.bodyBold }]}
                    >
                      Bridge this gap →
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { fontSize: fontSize.lg },
  blurb: { fontSize: fontSize.sm, lineHeight: 20 },
  levelBlock: { gap: spacing.xs, marginTop: spacing.xs },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelLabel: { fontSize: fontSize.xs, letterSpacing: 1.2 },
  cards: { gap: spacing.sm, paddingVertical: spacing.xs },
  card: {
    width: 260,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: { fontSize: fontSize.md },
  cardLag: { fontSize: fontSize.sm, lineHeight: 18 },
  statPeek: { fontSize: fontSize.xs, lineHeight: 16, marginTop: 4 },
  cardFooter: { marginTop: spacing.sm },
  cta: { fontSize: fontSize.sm },
});
