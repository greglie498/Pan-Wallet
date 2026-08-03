import * as SecureStore from "expo-secure-store";

// User Keys
const ACCESS_TOKEN_KEY = "panwallet_access_token";
const REFRESH_TOKEN_KEY = "panwallet_refresh_token";

// Admin Keys
const ADMIN_ACCESS_TOKEN_KEY = "panwallet_admin_access_token";
const ADMIN_REFRESH_TOKEN_KEY = "panwallet_admin_refresh_token";

export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),

  setTokens: async ( accessToken: string, refreshToken: string ) => {
    await SecureStore.setItemAsync( ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync( REFRESH_TOKEN_KEY, refreshToken);
  }, 

  clearTokens: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

export const adminTokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ADMIN_ACCESS_TOKEN_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(ADMIN_REFRESH_TOKEN_KEY),

    setTokens: async ( accessToken: string, refreshToken: string ) => {
        await SecureStore.setItemAsync( ADMIN_ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync( ADMIN_REFRESH_TOKEN_KEY, refreshToken);
    },

    clearTokens: async () => {
        await SecureStore.deleteItemAsync(ADMIN_ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(ADMIN_REFRESH_TOKEN_KEY);
    },
};