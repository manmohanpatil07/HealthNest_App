/**
 * HealthNest Mobile Constants
 * Colors, Typography, API endpoints, App configuration
 * Matched strictly to UI_INSTRUCTIONS.md
 */
export const COLORS = {
  // Primary
  primary: '#0284C7',
  primaryDark: '#0369A1',
  primaryLight: '#E0F2FE',

  // Secondary / Teal
  secondary: '#0D9488',
  darkTeal: '#065F46',
  accentGreen: '#10B981',
  success: '#22C55E',

  // Status
  danger: '#EF4444',
  error: '#EF4444',
  warning: '#F59E0B',

  // Backgrounds
  background: '#F0F9FF',
  providerBg: '#F0FDF4',
  neutralSurface: '#F8FAFC',
  card: '#FFFFFF',

  // Typography & Content
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textVeryMuted: '#CBD5E1',
  border: '#E2E8F0',
  divider: '#F1F5F9',

  // Soft Tint Families
  skyBg: '#F0F9FF',
  skyBorder: '#BAE6FD',
  greenBg: '#F0FDF4',
  greenBorder: '#BBF7D0',
  amberBg: '#FFFBEB',
  amberBorder: '#FDE68A',
  redBg: '#FEF2F2',
  redBorder: '#FECACA',
  purpleBg: '#FAF5FF',
  purpleBorder: '#E9D5FF',
  purpleText: '#7C3AED',
};

export const ROLES = {
  USER: 'user',
  PROVIDER: 'healthcare_provider',
};

export default {
  COLORS,
  ROLES,
};
