import {apiClient} from "./client";
import {tokenStorage } from "@/lib/storage/token.storage";

apiClient.interceptors.request.use(
    async(config)=>{
        const token = await tokenStorage.getAccessToken();
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);

export const userClient = apiClient;