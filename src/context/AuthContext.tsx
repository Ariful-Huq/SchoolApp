// SchoolApp/src/context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

// Types
interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  teacher_id: number | null;
}

interface TokenPayload {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  teacher_id: number | null;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        const decoded = jwtDecode<TokenPayload>(token);
        // Check if token is expired
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          // Try to refresh
          await refreshToken();
        } else {
          setUser({
            id: decoded.user_id,
            username: decoded.username,
            first_name: decoded.first_name,
            last_name: decoded.last_name,
            role: decoded.role,
            teacher_id: decoded.teacher_id,
          });
        }
      }
    } catch {
      await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refresh = await AsyncStorage.getItem("refresh_token");
      if (refresh) {
        const res = await api.post("/token/refresh/", { refresh });
        const newAccess = res.data.access;
        await AsyncStorage.setItem("access_token", newAccess);
        const decoded = jwtDecode<TokenPayload>(newAccess);
        setUser({
          id: decoded.user_id,
          username: decoded.username,
          first_name: decoded.first_name,
          last_name: decoded.last_name,
          role: decoded.role,
          teacher_id: decoded.teacher_id,
        });
      } else {
        setUser(null);
      }
    } catch {
      await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      setUser(null);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await api.post("/token/", { username, password });
    const { access, refresh } = res.data;
    await AsyncStorage.setItem("access_token", access);
    await AsyncStorage.setItem("refresh_token", refresh);
    // Decode token to get user info — no extra API call needed
    const decoded = jwtDecode<TokenPayload>(access);
    setUser({
      id: decoded.user_id,
      username: decoded.username,
      first_name: decoded.first_name,
      last_name: decoded.last_name,
      role: decoded.role,
      teacher_id: decoded.teacher_id,
    });
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
