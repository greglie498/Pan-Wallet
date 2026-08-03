import { create } from "zustand";
import { adminTokenStorage } from "@/lib/storage/token.storage";
import { adminApi } from "@/lib/api/admin.api";
import * as SecureStore from "expo-secure-store";

const ADMIN_DATA_KEY = "panwallet_admin_data";

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
        username: string,
        password: string
    ) => Promise<void>;

    logout: () => Promise<void>;

    initialize: () => Promise<void>;
}


export const useAdminStore = create<AdminStore>((set) => ({

    admin: null,
    accessToken: null,
    refreshToken: null,


    login: async(username, password) => {

        const response = await adminApi.login(
            username,
            password
        );


        const { admin, tokens } = response;


        await adminTokenStorage.setTokens(
            tokens.accessToken,
            tokens.refreshToken
        );


        await SecureStore.setItemAsync(
            ADMIN_DATA_KEY,
            JSON.stringify(admin)
        );


        set({
            admin,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });

    },


    logout: async() => {

        await adminTokenStorage.clearTokens();

        await SecureStore.deleteItemAsync(
            ADMIN_DATA_KEY
        );


        set({
            admin:null,
            accessToken:null,
            refreshToken:null
        });

    },


    initialize: async() => {

        const accessToken =
            await adminTokenStorage.getAccessToken();


        const refreshToken =
            await adminTokenStorage.getRefreshToken();


        const adminData =
            await SecureStore.getItemAsync(
                ADMIN_DATA_KEY
            );


        const admin =
            adminData
            ? JSON.parse(adminData)
            : null;



        if(accessToken){

            set({
                admin,
                accessToken,
                refreshToken
            });

        }

    }

}));