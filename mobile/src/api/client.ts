import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../constants/config';

/**
 * Global Axios API Client instance configured for PickNGo backend
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for logging & debugging
apiClient.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API Response] ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError<{ detail?: string | Array<{ msg: string }> }>) => {
    let errorMessage = 'An unexpected network error occurred. Please try again.';

    if (error.response) {
      const data = error.response.data;
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data?.detail) {
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((d) => d.msg).join(', ');
        } else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
      } else if (error.response.status === 404) {
        errorMessage = 'Requested resource was not found.';
      } else if (error.response.status === 403) {
        errorMessage = 'Permission denied for this action.';
      } else if (error.response.status >= 500) {
        errorMessage = 'Server is currently experiencing issues. Please try again later.';
      }
    } else if (error.request) {
      errorMessage = 'Could not reach the server. Please check your internet connection.';
    }

    if (__DEV__) {
      console.warn(`[API Error] ${error.config?.url}:`, errorMessage);
    }

    // Attach user-friendly parsed message to error
    error.message = errorMessage;
    return Promise.reject(error);
  }
);
