import {apiClient} from "./client";
import {userTokenStorage} from "./token.storage";

apiClient.interceptors.request.use(
    async(config)=>{
        const token = await userTokenStorage.getAccessToken();
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);

export const userClient = apiClient;