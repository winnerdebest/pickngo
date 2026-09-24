/**
 * PickNGo Global Configuration
 */

// API Base URL strictly from environment variable (.env: EXPO_PUBLIC_API_URL)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

// WebSocket Base URL strictly from environment variable (.env: EXPO_PUBLIC_WS_URL)
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || '';

export const APP_CONFIG = {
  APP_NAME: 'PickNGo',
  TAGLINE: 'Fast, Reliable Errands & Delivery',
  CURRENCY_SYMBOL: '₦',
  CURRENCY_CODE: 'NGN',
  DEFAULT_PAGE_SIZE: 50,
  WS_RECONNECT_INTERVAL_MS: 3000,
  WS_MAX_RECONNECT_ATTEMPTS: 5,
} as const;

export const STORAGE_KEYS = {
  SESSION_USER: 'pickngo_user_session',
  USER_ROLE: 'pickngo_user_role',
  AUTH_TOKEN: 'pickngo_auth_token',
} as const;
