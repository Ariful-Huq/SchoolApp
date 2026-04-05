import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_BASE_URL = "http://192.168.0.105:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = await AsyncStorage.getItem("refresh_token");
        if (refresh) {
          const res = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
            refresh,
          });
          const newAccess = res.data.access;
          await AsyncStorage.setItem("access_token", newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
