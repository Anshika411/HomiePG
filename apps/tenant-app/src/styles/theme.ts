export const COLORS = {
  primary: "#2563EB",
  primaryLight: "#DBEAFE",
  secondary: "#1E40AF",
  accent: "#14B8A6",
  accentLight: "#CCFBF1",
  background: "#F8FAFC",
  cardBg: "#FFFFFF",
  textDark: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  overlay: "rgba(15, 23, 42, 0.6)",
  glass: "rgba(255, 255, 255, 0.8)",
  genderBoys: "#3B82F6",
  genderGirls: "#EC4899",
  genderUnisex: "#8B5CF6",
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: COLORS.textDark,
  },
  h2: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: COLORS.textDark,
  },
  h3: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: COLORS.textDark,
  },
  body: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
};
