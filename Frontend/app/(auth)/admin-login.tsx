import {
 View,
 Text,
 TextInput,
 TouchableOpacity
} from "react-native";
import {useState} from "react";
import {router} from "expo-router";
import {useAdminStore} from "@/lib/store/admin.store";
import { KeyboardAvoidingView } from "react-native";
import { ScrollView } from "react-native";


export default function AdminScreen(){

  const login = useAdminStore( state=>state.login );
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit=async()=>{
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.replace("/(app)/admin");
    } catch (e) {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <View className="flex-1 justify-center px-6">

      <Text className="text-3xl font-bold mb-8">
        Admin Portal
      </Text>

      <KeyboardAvoidingView >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View>
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
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {error ? (
        <Text className="text-red-500 text-center mb-4">{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={submit}
        disabled={loading}
        className="bg-primary p-4 rounded-xl"
      >
        <Text className="text-white text-center font-bold">
          {loading ? "Signing in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}