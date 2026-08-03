import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

// ── Constants ──────────────────────────────────────────────────────
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://gonad-atypical-lather.ngrok-free.dev/api/v1";

export const USER_ACCESS_TOKEN = "panwallet_access_token";
export const USER_REFRESH_TOKEN ="panwallet_refresh_token";
export const ADMIN_ACCESS_TOKEN = "panwallet_admin_access_token";
export const ADMIN_REFRESH_TOKEN = "panwallet_admin_refresh_token";

// ── Token storage helpers ──────────────────────────────────────────
export const userTokenStorage = {
  getAccessToken: () =>
    SecureStore.getItemAsync(
        USER_ACCESS_TOKEN
    ),
  getRefreshToken: () =>
    SecureStore.getItemAsync(
      USER_REFRESH_TOKEN
    ),
  setTokens: async(
    access:string,
    refresh:string
  )=>{
    await SecureStore.setItemAsync(
      USER_ACCESS_TOKEN,
      access
    );
    await SecureStore.setItemAsync(
      USER_REFRESH_TOKEN,
      refresh
    );
  },

  clearTokens:async()=>{
      await SecureStore.deleteItemAsync(
        USER_ACCESS_TOKEN
      );

      await SecureStore.deleteItemAsync(
        USER_REFRESH_TOKEN
      );
    }

};



export const adminTokenStorage = {

    getAccessToken: () =>
        SecureStore.getItemAsync(
            ADMIN_ACCESS_TOKEN
        ),


    getRefreshToken: () =>
        SecureStore.getItemAsync(
            ADMIN_REFRESH_TOKEN
        ),


    setTokens: async(
        access:string,
        refresh:string
    )=>{

        await SecureStore.setItemAsync(
            ADMIN_ACCESS_TOKEN,
            access
        );

        await SecureStore.setItemAsync(
            ADMIN_REFRESH_TOKEN,
            refresh
        );

    },


    clearTokens:async()=>{

        await SecureStore.deleteItemAsync(
            ADMIN_ACCESS_TOKEN
        );

        await SecureStore.deleteItemAsync(
            ADMIN_REFRESH_TOKEN
        );

    }
};

// ── Axios instance ─────────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// ── Request interceptor — attach access token ──────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Track if a refresh is already in progress ─────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];
let authFailureHandler: (() => void) | undefined;

export const setAuthFailureHandler = (handler: () => void) : void => {
  authFailureHandler = handler;
}

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// ── Response interceptor — handle 401, refresh token ──────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401s that haven't already been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request is already refreshing — queue this one
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenStorage.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available.");
      }

      const response = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } =
        response.data.data;

      await tokenStorage.setTokens(accessToken, newRefreshToken);
      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await tokenStorage.clearTokens();
      authFailureHandler?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);