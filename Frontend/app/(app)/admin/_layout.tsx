import {Stack, Redirect} from "expo-router";
import {useAuthStore} from "@/lib/store";


export default function AdminLayout(){

    const isAdmin =
        useAuthStore(
            state=>state.isAdmin
        );

    if(!isAdmin){
        return (
            <Redirect
                href="/admin-login"
            />
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown:false
            }}
        />
    );

}