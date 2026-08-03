import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ??
    "https://gonad-atypical-lather.ngrok-free.dev/api/v1";

export const adminClient = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
    },
});

adminClient.interceptors.request.use(
    async(config)=>{
        const token = await SecureStore.getItemAsync( "panwallet_admin_access_token");
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error=>Promise.reject(error)
);