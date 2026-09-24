/**
 * PickNGo Official Brand Color Palette & Design Tokens
 * Matched directly to official PickNGo branding
 * 
 * Primary: Matte Charcoal Black (#121212)
 * Accent: Electric Coral / Speed Orange (#FF5733)
 */

export const colors = {
  // Official Brand Core
  charcoal: '#121212',
  charcoalLight: '#1E1E1E',
  charcoalCard: '#18181A',
  charcoalDark: '#0A0A0A',
  
  // Brand Accent (Speed Coral)
  coral: '#FF5733',
  coralDark: '#E04826',
  coralLight: '#FFF0EC',
  coralMuted: 'rgba(255, 87, 51, 0.15)',
  coralGlow: 'rgba(255, 87, 51, 0.30)',

  // Neutrals & Surfaces
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  surfaceDark: '#1E1E22',
  border: '#E2E8F0',
  borderDark: '#2C2C30',

  // Typography
  textPrimary: '#121212',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textLight: '#F8FAFC',
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
} as const;

export type ColorKey = keyof typeof colors;
