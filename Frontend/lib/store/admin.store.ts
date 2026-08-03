import { create } from "zustand";
import {
    adminTokenStorage
} from "@/lib/storage/token.storage";
import { adminApi } from "@/lib/api/admin.api";


interface Admin {
    id:string;
    username:string;
    email:string;
    role:string;
}

interface AdminStore {
    admin:Admin|null;
    accessToken:string|null;
    refreshToken:string|null;

    login(
        username:string,
        password:string
    ):Promise<void>;
    logout():Promise<void>;
    initialize():Promise<void>;
}

export const useAdminStore = create<AdminStore>((set)=>({
    admin:null,
    accessToken:null,
    refreshToken:null,

    login:async(username,password)=>{
        const response = await adminApi.login( username, password );

        const { admin, tokens } = response;

        // STORE IN SECURE STORE
        await adminTokenStorage.setTokens(
            tokens.accessToken,
            tokens.refreshToken
        );

        set({
            admin,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    },

    logout:async()=>{
        await adminTokenStorage.clearTokens();

        set({
            admin:null,
            accessToken:null,
            refreshToken:null
        });
    },

    initialize:async()=>{
        const accessToken = await adminTokenStorage.getAccessToken();
        const refreshToken = await adminTokenStorage.getRefreshToken();
        if(accessToken){
            set({
                accessToken,
                refreshToken
            });
        }
    }
}));