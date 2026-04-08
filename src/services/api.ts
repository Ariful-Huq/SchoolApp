// SchoolApp/src/services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_BASE_URL = "http://192.168.68.100:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = await AsyncStorage.getItem("refresh_token");
        if (refresh) {
          // Use basic axios to avoid interceptor recursion
          const res = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh,
          });
          const newAccess = res.data.access;
          await AsyncStorage.setItem("access_token", newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // This catch block hits if the Force Logout invalidated the refresh token too
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
        // AuthContext will notice the missing token on the next state update/render
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
