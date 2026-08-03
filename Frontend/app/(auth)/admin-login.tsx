import {
 View,
 Text,
 TextInput,
 TouchableOpacity
} from "react-native";
import {useState} from "react";
import {router} from "expo-router";
import {useAdminStore} from "@/lib/store/admin.store";


export default function AdminScreen(){

  const login = useAdminStore( state=>state.login );
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const submit=async()=>{
    await login(
      username,
      password
    );

    router.replace( "/(app)/admin");
  };


  return (

    <View className="flex-1 justify-center px-6">

      <Text className="text-3xl font-bold mb-8">
        Admin Portal
      </Text>


      <TextInput
      placeholder="Username"
      value={username}
      onChangeText={setUsername}
      className="border rounded-xl p-4 mb-4"
      />

      <TextInput
      placeholder="Password"
      secureTextEntry
      value={password}
      onChangeText={setPassword}
      className="border rounded-xl p-4 mb-6"
      />

      <TouchableOpacity
      onPress={submit}
      className="bg-primary p-4 rounded-xl"
      >
        <Text className="text-white text-center font-bold">
          Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}