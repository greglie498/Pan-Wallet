import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { adminApi } from "@/lib/api/admin.api";

interface Admin {
    id: string;
    username: string;
    email: string;
    role: string;
}

interface AdminStore {
    admin: Admin | null;
    accessToken: string | null;
    refreshToken: string | null;
    
    login: (
        username:string,
        password:string
    ) => Promise<void>;
    logout:()=>Promise<void>;
    initialize:()=>Promise<void>;
}

export const useAdminStore = create<AdminStore>((set)=>({
    admin:null,
    accessToken:null,
    refreshToken:null,

    login: async(username,password)=>{
        const response =
            await adminApi.login({
                username,
                password
            });

        const {
            admin,
            tokens
        } = response;

        await AsyncStorage.setItem(
            "adminAccessToken",
            tokens.accessToken
        );

        await AsyncStorage.setItem(
            "adminRefreshToken",
            tokens.refreshToken
        );

        set({
            admin,
            accessToken:tokens.accessToken,
            refreshToken:tokens.refreshToken
        });
    },


    logout:async()=>{
        await AsyncStorage.multiRemove([
            "adminAccessToken",
            "adminRefreshToken"
        ]);

        set({
            admin:null,
            accessToken:null,
            refreshToken:null
        });
    },

    initialize:async()=>{
        const accessToken =
            await AsyncStorage.getItem(
                "adminAccessToken"
            );

        const refreshToken =
            await AsyncStorage.getItem(
                "adminRefreshToken"
            );

        if(accessToken){
            set({
                accessToken,
                refreshToken
            });
        }
    }
}));