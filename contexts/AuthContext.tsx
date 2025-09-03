// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocketProvider } from './SocketContext';
import { parseJwt } from '@/lib/jwt';

type AuthContextType = {
  token: string | null;
  setToken: (newToken: string) => Promise<void>;
  removeToken: () => Promise<void>;
  isLoading: boolean;
  user: { id?: string; [k: string]: any } | null;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: async () => {},
  removeToken: async () => {},
  isLoading: true,
  user: null,
});

const TOKEN_KEY = 'auth_token';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Load token from AsyncStorage on app start
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          setTokenState(storedToken);
          try {
            const payload = parseJwt(storedToken);
            setUser(payload || null);
          } catch {}
        }
      } catch (err) {
        console.error('🔐 Failed to load token', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const setToken = async (newToken: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      setTokenState(newToken);
      try {
        const payload = parseJwt(newToken);
        setUser(payload || null);
      } catch {}
    } catch (err) {
      console.error('❌ Failed to set token', err);
    }
  };

  const removeToken = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setTokenState(null);
      setUser(null);
    } catch (err) {
      console.error('❌ Failed to remove token', err);
    }
  };

  return (
    <AuthContext.Provider value={{ token, setToken, removeToken, isLoading, user }}>
      {token && !isLoading ? (
        <SocketProvider token={token}>
          {children}
        </SocketProvider>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
