export type VisualThemeId = 'day' | 'dusk' | 'minimal';

export type ThemeColors = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceLight: string;
  surfaceHighlight: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  textOnPrimary: string;
  border: string;
  borderLight: string;
  success: string;
  successDark: string;
  successBg: string;
  error: string;
  errorDark: string;
  errorBg: string;
  warning: string;
  warningDark: string;
  xp: string;
  xpDark: string;
  coins: string;
  streak: string;
  streakDark: string;
  heart: string;
  common: string;
  rare: string;
  epic: string;
  legendary: string;
  glowPrimary: string;
  glowSecondary: string;
  heroGradient: readonly [string, string, string];
  primaryGradient: readonly [string, string];
  statusBar: 'light' | 'dark';
};

/** Light, open, calm — professional with soft game accents. */
export const dayColors: ThemeColors = {
  background: '#F3F5F8',
  backgroundAlt: '#EAEFF4',
  surface: '#FFFFFF',
  surfaceLight: '#F7F9FB',
  surfaceHighlight: '#EEF2F6',
  primary: '#0F766E',
  primaryDark: '#0B5F59',
  primaryLight: '#14B8A6',
  secondary: '#1E293B',
  secondaryDark: '#0F172A',
  text: '#0F172A',
  textMuted: '#64748B',
  textSecondary: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  success: '#059669',
  successDark: '#047857',
  successBg: '#ECFDF5',
  error: '#DC2626',
  errorDark: '#B91C1C',
  errorBg: '#FEF2F2',
  warning: '#D97706',
  warningDark: '#B45309',
  xp: '#B45309',
  xpDark: '#92400E',
  coins: '#D97706',
  streak: '#EA580C',
  streakDark: '#C2410C',
  heart: '#DC2626',
  common: '#94A3B8',
  rare: '#0284C7',
  epic: '#7C3AED',
  legendary: '#D97706',
  glowPrimary: 'rgba(15, 118, 110, 0.08)',
  glowSecondary: 'rgba(30, 41, 59, 0.04)',
  heroGradient: ['#ECFDF8', '#F3F5F8', '#EEF2FF'] as const,
  primaryGradient: ['#14B8A6', '#0F766E'] as const,
  statusBar: 'dark',
};

/** Neon-glass dusk — dashboard energy, still readable. */
export const duskColors: ThemeColors = {
  background: '#090B10',
  backgroundAlt: '#0F131A',
  surface: '#12161F',
  surfaceLight: '#1A2030',
  surfaceHighlight: '#232A3B',
  primary: '#2EE6C5',
  primaryDark: '#12C4A4',
  primaryLight: '#6FF0D8',
  secondary: '#FF5C9A',
  secondaryDark: '#E84381',
  text: '#F5F7FB',
  textMuted: '#A7B0C3',
  textSecondary: '#6E7890',
  textOnPrimary: '#04251F',
  border: '#2A3348',
  borderLight: '#364057',
  success: '#34F5C5',
  successDark: '#12C4A4',
  successBg: '#062820',
  error: '#FF6B81',
  errorDark: '#F0435C',
  errorBg: '#3A1218',
  warning: '#FFC857',
  warningDark: '#E0A83A',
  xp: '#FFC857',
  xpDark: '#E0A83A',
  coins: '#FFC857',
  streak: '#FF8A4C',
  streakDark: '#E86C2E',
  heart: '#FF6B81',
  common: '#94A3B8',
  rare: '#38BDF8',
  epic: '#C084FC',
  legendary: '#FFC857',
  glowPrimary: 'rgba(46, 230, 197, 0.18)',
  glowSecondary: 'rgba(255, 92, 154, 0.12)',
  heroGradient: ['#0C1A1F', '#090B10', '#14101C'] as const,
  primaryGradient: ['#6FF0D8', '#2EE6C5'] as const,
  statusBar: 'light',
};

/** Quiet ink-and-paper — minimal chrome, sharp focus. */
export const minimalColors: ThemeColors = {
  background: '#F6F6F4',
  backgroundAlt: '#EEEEEC',
  surface: '#FFFFFF',
  surfaceLight: '#FAFAF9',
  surfaceHighlight: '#F0F0EE',
  primary: '#171717',
  primaryDark: '#0A0A0A',
  primaryLight: '#404040',
  secondary: '#525252',
  secondaryDark: '#262626',
  text: '#171717',
  textMuted: '#737373',
  textSecondary: '#A3A3A3',
  textOnPrimary: '#FAFAF9',
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  success: '#15803D',
  successDark: '#166534',
  successBg: '#F0FDF4',
  error: '#B91C1C',
  errorDark: '#991B1B',
  errorBg: '#FEF2F2',
  warning: '#A16207',
  warningDark: '#854D0E',
  xp: '#A16207',
  xpDark: '#854D0E',
  coins: '#A16207',
  streak: '#C2410C',
  streakDark: '#9A3412',
  heart: '#B91C1C',
  common: '#A3A3A3',
  rare: '#3B82F6',
  epic: '#7C3AED',
  legendary: '#A16207',
  glowPrimary: 'rgba(23, 23, 23, 0.05)',
  glowSecondary: 'rgba(23, 23, 23, 0.03)',
  heroGradient: ['#F6F6F4', '#F6F6F4', '#EEEEEC'] as const,
  primaryGradient: ['#404040', '#171717'] as const,
  statusBar: 'dark',
};

/** Chart accents shared across dashboards. */
export const chartColors = {
  cyan: '#22D3EE',
  mint: '#2EE6C5',
  pink: '#FF5C9A',
  amber: '#FFC857',
  purple: '#C084FC',
  blue: '#60A5FA',
  track: '#1E2636',
} as const;

export const themes: Record<VisualThemeId, ThemeColors> = {
  day: dayColors,
  dusk: duskColors,
  minimal: minimalColors,
};

export const themeMeta: Record<
  VisualThemeId,
  { label: string; blurb: string; icon: 'sunny-outline' | 'moon-outline' | 'contrast-outline' }
> = {
  day: {
    label: 'Day Studio',
    blurb: 'Light, calm, easy on the eyes.',
    icon: 'sunny-outline',
  },
  dusk: {
    label: 'Neon Glass',
    blurb: 'Dark dashboard — mint, pink, cyan charts.',
    icon: 'moon-outline',
  },
  minimal: {
    label: 'Minimal',
    blurb: 'Quiet ink & paper. Zero noise.',
    icon: 'contrast-outline',
  },
};

/** Fallback for modules not yet on ThemeContext. */
export const colors: ThemeColors = duskColors;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
  full: 999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  display: 36,
};

export const fonts = {
  display: 'PlusJakartaSans_800ExtraBold',
  displayBold: 'PlusJakartaSans_700Bold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  button: {
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const gradients = {
  primary: dayColors.primaryGradient,
  primaryDark: ['#0F766E', '#0B5F59'] as const,
  hero: ['#ECFDF8', '#F3F5F8'] as const,
  xp: ['#FBBF24', '#D97706'] as const,
  streak: ['#FB923C', '#EA580C'] as const,
  purple: ['#5EEAD4', '#14B8A6'] as const,
  success: ['#34D399', '#059669'] as const,
  danger: ['#FCA5A5', '#DC2626'] as const,
  card: ['#FFFFFF', '#F8FAFC'] as const,
};

export const game = {
  dailyGoal: 10,
  dailyXpGoal: 50,
  xpPerCard: 10,
  xpPerQuizCorrect: 15,
  xpPerDailyQuest: 150,
  xpPerLevel: 600,
  maxHearts: 3,
  timedSecondsPerQuestion: 12,
  timedXpBonusPerCorrect: 5,
};
