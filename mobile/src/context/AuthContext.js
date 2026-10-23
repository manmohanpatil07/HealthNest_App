import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const TOKEN_KEY = 'healthnest_jwt_token';
const USER_KEY = 'healthnest_user_data';
const ROLE_KEY = 'healthnest_user_role';

export const AuthContext = createContext({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from SecureStore on app launch
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        const storedRole = await SecureStore.getItemAsync(ROLE_KEY);

        if (storedToken) {
          setToken(storedToken);
          setRole(storedRole || 'user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (e) {
        console.warn('[AuthContext] Failed to load stored session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredSession();
  }, []);

  const login = async (userData, userToken, userRole) => {
    try {
      const assignedRole = userRole || 'user';
      setUser(userData);
      setToken(userToken);
      setRole(assignedRole);

      await SecureStore.setItemAsync(TOKEN_KEY, userToken);
      await SecureStore.setItemAsync(ROLE_KEY, assignedRole);
      if (userData) {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
      }
    } catch (e) {
      console.warn('[AuthContext] Failed to persist session:', e);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      setRole(null);

      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(ROLE_KEY);
    } catch (e) {
      console.warn('[AuthContext] Failed to clear session:', e);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      setUser(updatedUserData);
      if (updatedUserData) {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUserData));
      }
    } catch (e) {
      console.warn('[AuthContext] Failed to update stored user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
