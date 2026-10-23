import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

/**
 * HealthNest Base Axios Instance
 * Update baseURL to your local machine IP (e.g., http://192.168.1.X:5000)
 * when testing on a physical Android device with Expo Go.
 * For Android Studio Emulator: http://10.0.2.2:5000
 * For Web / Localhost: http://localhost:5000
 */
// export const API_BASE_URL = 'http://localhost:5000/api'; 
export const API_BASE_URL = 'http://10.198.50.156:5000/api'; 

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
