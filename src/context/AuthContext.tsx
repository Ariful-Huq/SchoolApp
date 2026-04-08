// SchoolApp/src/context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import api from "../services/api";

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  teacher_id: number | null;
}

interface TokenPayload extends User {
  user_id: number;
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

  const logout = async () => {
    console.log("AuthProvider: Logging out...");
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    setUser(null);
  };

  // 1. Define the validation function BEFORE useEffect
  const validateSessionWithServer = async () => {
    try {
      // Hits your VersionedJWTAuthentication logic on the backend
      await api.get("/users/me/");
      console.log("Session validated successfully.");
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("Session invalidated by server. Forcing logout.");
        await logout();
      } else {
        console.error("Heartbeat check failed:", error.message);
      }
    }
  };

  const refreshToken = async () => {
    try {
      const refresh = await AsyncStorage.getItem("refresh_token");
      if (!refresh) throw new Error("No refresh token");

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
    } catch {
      await logout();
    }
  };

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        const decoded = jwtDecode<TokenPayload>(token);
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
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
    } catch (error) {
      await logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkToken().then(() => {
      validateSessionWithServer();
    });

    // App State Listener for "Instant" Force Logout when returning to app
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          validateSessionWithServer();
        }
      },
    );

    return () => subscription.remove();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post("/token/", { username, password });
    const { access, refresh } = res.data;

    await AsyncStorage.setItem("access_token", access);
    await AsyncStorage.setItem("refresh_token", refresh);

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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
