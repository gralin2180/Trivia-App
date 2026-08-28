import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { GUEST_FREE_DECK_LIMIT } from '@/lib/guestLimits';

const PERKS = [
  { icon: 'infinite-outline' as const, title: 'Unlimited decks', hint: 'Generate as many topics as you want' },
  { icon: 'cloud-outline' as const, title: 'Sync everywhere', hint: 'Keep streaks & ranks across devices' },
  { icon: 'sparkles-outline' as const, title: 'Full coach & quests', hint: 'Keep Auri + daily XP unlocked' },
];

export default function SubscribeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isGuest } = useAuth();

  return (
    <Screen style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text, fontFamily: fonts.bodyMedium }]}>
            Back
          </Text>
        </Pressable>

        <LinearGradient colors={[...colors.heroGradient]} style={styles.hero}>
          <Text style={[styles.kicker, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
            KEEP LEARNING
          </Text>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
            You’ve used your {GUEST_FREE_DECK_LIMIT} free decks
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Guests get {GUEST_FREE_DECK_LIMIT} AI deck generations to try ACUMEN. Create a free account
            or sign in to keep going — more topics, synced progress, full ranks.
          </Text>
        </LinearGradient>

        <View style={styles.perks}>
          {PERKS.map((perk) => (
            <View
              key={perk.title}
              style={[styles.perk, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.perkIcon, { backgroundColor: colors.glowPrimary }]}>
                <Ionicons name={perk.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.perkText}>
                <Text style={[styles.perkTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                  {perk.title}
                </Text>
                <Text style={[styles.perkHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  {perk.hint}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            label={isGuest ? 'Create free account' : 'Continue with account'}
            onPress={() => router.push('/(auth)/signup')}
          />
          <Button
            label="Sign in"
            variant="secondary"
            onPress={() => router.push('/(auth)/login')}
          />
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.later}>
            <Text style={[styles.laterText, { color: colors.textMuted, fontFamily: fonts.bodyMedium }]}>
              Browse without generating →
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  content: { paddingBottom: 48, gap: spacing.lg },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backText: { fontSize: fontSize.sm },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  kicker: { fontSize: fontSize.xs, letterSpacing: 1.4 },
  title: { fontSize: fontSize.display, letterSpacing: -0.6, lineHeight: 42 },
  subtitle: { fontSize: fontSize.md, lineHeight: 22 },
  perks: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  perkIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: { flex: 1, gap: 2 },
  perkTitle: { fontSize: fontSize.md },
  perkHint: { fontSize: fontSize.sm },
  actions: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  later: { alignItems: 'center', paddingVertical: spacing.sm },
  laterText: { fontSize: fontSize.sm },
});
