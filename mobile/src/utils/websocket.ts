import { WS_BASE_URL, APP_CONFIG } from '../constants/config';
import { WebSocketMessage } from '../api/types';

export type MessageHandler = (message: WebSocketMessage) => void;
export type StatusHandler = (isConnected: boolean) => void;

/**
 * Creates and manages a WebSocket connection with automatic reconnection
 */
export function createWebSocketClient(
  path: string,
  onMessage: MessageHandler,
  onStatusChange?: StatusHandler
) {
  let ws: WebSocket | null = null;
  let reconnectTimer: any = null;
  let pingTimer: any = null;
  let reconnectAttempts = 0;
  let isIntentionallyClosed = false;

  const url = `${WS_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  function connect() {
    if (isIntentionallyClosed) return;

    try {
      if (__DEV__) {
        console.log(`[WebSocket] Connecting to: ${url}`);
      }

      ws = new WebSocket(url);

      ws.onopen = () => {
        if (__DEV__) {
          console.log(`[WebSocket] Connected to: ${url}`);
        }
        reconnectAttempts = 0;
        if (onStatusChange) onStatusChange(true);

        // Setup ping interval to keep connection alive
        clearInterval(pingTimer);
        pingTimer = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          if (__DEV__) {
            console.log(`[WebSocket Message]`, data);
          }
          onMessage(data);
        } catch (err) {
          if (__DEV__) {
            console.warn('[WebSocket] Error parsing message:', event.data, err);
          }
        }
      };

      ws.onerror = (error) => {
        if (__DEV__) {
          console.warn(`[WebSocket Error] ${url}:`, error);
        }
      };

      ws.onclose = (event) => {
        if (__DEV__) {
          console.log(`[WebSocket Closed] code: ${event.code}, reason: ${event.reason}`);
        }
        clearInterval(pingTimer);
        if (onStatusChange) onStatusChange(false);

        if (!isIntentionallyClosed && reconnectAttempts < APP_CONFIG.WS_MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(APP_CONFIG.WS_RECONNECT_INTERVAL_MS * reconnectAttempts, 15000);
          if (__DEV__) {
            console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
          }
          reconnectTimer = setTimeout(connect, delay);
        }
      };
    } catch (err) {
      if (__DEV__) {
        console.error('[WebSocket] Failed to instantiate WebSocket:', err);
      }
    }
  }

  // Start connection
  connect();

  return {
    close: () => {
      isIntentionallyClosed = true;
      clearInterval(pingTimer);
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
        ws = null;
      }
    },
    send: (data: any) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      }
    },
  };
}
