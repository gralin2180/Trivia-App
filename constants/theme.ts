export const colors = {
  // Backgrounds
  background: "#0D1117",
  backgroundAlt: "#131929",
  surface: "#1A2235",
  surfaceLight: "#243049",
  surfaceHighlight: "#2D3A56",

  // Brand — Duolingo-inspired green + playful purple
  primary: "#58CC02",
  primaryDark: "#46A302",
  primaryLight: "#89E219",
  secondary: "#7C5CFF",
  secondaryDark: "#6548F5",

  // Text
  text: "#FFFFFF",
  textMuted: "#B8C4E0",
  textSecondary: "#7A8AAA",

  // Borders
  border: "#2E3A55",
  borderLight: "#3D4D6E",

  // Status
  success: "#58CC02",
  successDark: "#46A302",
  successBg: "#1A3D0A",
  error: "#FF4B4B",
  errorDark: "#D93636",
  errorBg: "#3D1515",
  warning: "#FFC800",
  warningDark: "#E6A800",

  // Game tokens
  xp: "#FFC800",
  xpDark: "#E6A800",
  coins: "#FFB703",
  streak: "#FF9600",
  streakDark: "#E67E00",
  heart: "#FF4B4B",

  // Rarity
  common: "#94A3B8",
  rare: "#4FC3F7",
  epic: "#A855F7",
  legendary: "#FFD700",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
  full: 999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  display: 38,
};

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const gradients = {
  primary: ["#89E219", "#58CC02"] as const,
  primaryDark: ["#58CC02", "#46A302"] as const,
  hero: ["#1A2235", "#243049"] as const,
  xp: ["#FFD54F", "#FFC800"] as const,
  streak: ["#FFB347", "#FF9600"] as const,
  purple: ["#9B7BFF", "#7C5CFF"] as const,
  success: ["#89E219", "#58CC02"] as const,
  danger: ["#FF6B6B", "#FF4B4B"] as const,
  card: ["#1E2840", "#1A2235"] as const,
};

export const game = {
  dailyGoal: 10,
  xpPerCard: 10,
  xpPerQuizCorrect: 15,
  xpPerDailyQuest: 150,
  xpPerLevel: 600,
  maxHearts: 3,
};
