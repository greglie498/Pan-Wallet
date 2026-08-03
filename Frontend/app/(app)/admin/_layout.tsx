import {Stack, Redirect} from "expo-router";
import {useAdminStore} from "@/lib/store/admin.store";


export default function AdminLayout(){

    const admin =
        useAdminStore(
            state=>state.admin
        );

    if(!admin){
        return (
            <Redirect
                href="/admin"
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