/**
 * PickNGo Global Configuration
 */

// Live Render Backend Base URL
export const API_BASE_URL = 'https://pickngo.onrender.com/api/v1';

// Live WebSocket Base URL (Convert https to wss)
export const WS_BASE_URL = 'wss://pickngo.onrender.com';

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
