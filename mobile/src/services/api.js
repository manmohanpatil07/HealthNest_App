import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 1. Fallback laptop LAN IP for physical device / standalone APK builds
const DEFAULT_LAN_IP = '10.49.97.156';

/**
 * HealthNest Base Axios Instance
 * Dynamically resolves API URL:
 * - Explicit EXPO_PUBLIC_API_URL environment variable
 * - Expo Go host machine IP (in development mode)
 * - Default LAN IP for physical Android/iOS APK builds
 */
const getBaseUrl = () => {
  // 1. Explicit environment variable always takes highest priority
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. In Expo Go / Development, dynamically extract the host machine IP:
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  // 3. Standalone APK or Physical Device: use the laptop LAN IP
  return `http://${DEFAULT_LAN_IP}:5000/api`;
};

export const API_BASE_URL = getBaseUrl();
export const SERVER_ROOT_URL = API_BASE_URL.replace(/\/api$/, '');

const TOKEN_KEY = 'healthnest_jwt_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from SecureStore if available
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // In case SecureStore is unavailable
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
