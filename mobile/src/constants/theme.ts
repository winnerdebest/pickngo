/**
 * PickNGo Theme Tokens
 * Dark Mode (Default) + Light Mode
 */

export const darkPalette = {
  isDark: true,
  // Brand Core
  charcoal: '#121212',
  charcoalLight: '#18181B',
  charcoalCard: '#1C1C20',
  charcoalElevated: '#24242A',
  charcoalDark: '#0A0A0C',

  coral: '#FF5733',
  coralDark: '#E04826',
  coralLight: '#2C1B18',
  coralMuted: 'rgba(255, 87, 51, 0.18)',
  coralGlow: 'rgba(255, 87, 51, 0.35)',

  // Surfaces & Backgrounds
  background: '#121212',
  card: '#1C1C20',
  cardSubtle: '#222228',
  cardElevated: '#282830',
  border: '#2C2C34',
  borderDark: '#383842',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#121212',
  textWhite: '#FFFFFF',

  // Status & Feedback
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  successText: '#34D399',

  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  warningText: '#FBBF24',

  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  errorText: '#F87171',

  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.15)',
  infoText: '#60A5FA',

  // Runner Trust Tiers
  bronze: '#CD7F32',
  bronzeLight: 'rgba(205, 127, 50, 0.15)',
  silver: '#94A3B8',
  silverLight: 'rgba(148, 163, 184, 0.15)',
  gold: '#F59E0B',
  goldLight: 'rgba(245, 158, 11, 0.15)',
  platinum: '#818CF8',
  platinumLight: 'rgba(129, 140, 248, 0.15)',
};

export const lightPalette = {
  isDark: false,
  // Brand Core
  charcoal: '#121212',
  charcoalLight: '#1E1E1E',
  charcoalCard: '#FFFFFF',
  charcoalElevated: '#F8F9FA',
  charcoalDark: '#0A0A0A',

  coral: '#FF5733',
  coralDark: '#E04826',
  coralLight: '#FFF0EC',
  coralMuted: 'rgba(255, 87, 51, 0.12)',
  coralGlow: 'rgba(255, 87, 51, 0.25)',

  // Surfaces & Backgrounds
  background: '#F8F9FA',
  card: '#FFFFFF',
  cardSubtle: '#F1F5F9',
  cardElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderDark: '#CBD5E1',

  // Typography
  textPrimary: '#121212',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textWhite: '#FFFFFF',

  // Status & Feedback
  success: '#10B981',
  successLight: '#ECFDF5',
  successText: '#065F46',

  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningText: '#92400E',

  error: '#EF4444',
  errorLight: '#FEF2F2',
  errorText: '#991B1B',

  info: '#3B82F6',
  infoLight: '#EFF6FF',
  infoText: '#1E40AF',

  // Runner Trust Tiers
  bronze: '#CD7F32',
  bronzeLight: '#FAF0E6',
  silver: '#718096',
  silverLight: '#F1F5F9',
  gold: '#D97706',
  goldLight: '#FEF3C7',
  platinum: '#6366F1',
  platinumLight: '#EEF2FF',
};

export type ThemeColors = typeof darkPalette;
