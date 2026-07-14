import { apiClient } from "./client";

export interface RegisterPayload {
  phoneNumber: string;
  name: string;
  password: string;
  email?: string;
}

export interface LoginPayload {
  phoneNumber: string;
  password: string;
}

export interface FirebaseAuthPayload {
  idToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    phoneNumber: string;
    name: string;
    email: string | null;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/register", payload);
    return response.data.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", payload);
    return response.data.data;
  },

  firebaseLogin: async (payload: FirebaseAuthPayload): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/firebase", payload);
    return response.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post("/auth/logout", { refreshToken });
  },
};