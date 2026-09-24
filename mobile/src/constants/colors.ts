/**
 * PickNGo Color Palette & Design Tokens
 * 
 * Primary: Charcoal Black (#1A1A1A)
 * Accent: Coral (#FF6F59)
 */

export const colors = {
  // Brand Core
  charcoal: '#1A1A1A',
  charcoalLight: '#2D3748',
  charcoalDark: '#0D0D0D',
  coral: '#FF6F59',
  coralDark: '#E0533D',
  coralLight: '#FFF0EE',
  coralMuted: 'rgba(255, 111, 89, 0.15)',

  // Neutrals & Surfaces
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  border: '#E2E8F0',
  borderDark: '#CBD5E1',

  // Typography
  textPrimary: '#1A1A1A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textLight: '#F8FAFC',

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
} as const;

export type ColorKey = keyof typeof colors;
