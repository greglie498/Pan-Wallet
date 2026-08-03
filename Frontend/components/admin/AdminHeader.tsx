import {View,Text,TouchableOpacity} from "react-native";

interface Props{
    logout:()=>void;
}

export default function AdminHeader({logout}:Props){

    return (
        <View className="bg-primary px-6 pt-5 pb-10">
            <View className="flex-row justify-between">
                <View>
                    <Text className="text-gray-400 text-xs">
                        System Administration
                    </Text>
                    <Text className="text-white text-3xl font-black mt-1">
                        Dashboard
                    </Text>
                    <Text className="text-gray-300 mt-2">
                        Monitor PanWallet operations
                    </Text>
                    <View className="mt-4 bg-green-500/20 rounded-xl px-3 py-2 self-start">
                        <Text className="text-green-400 text-xs font-bold">
                            🟢 System Operational
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={logout}
                    className="w-11 h-11 rounded-full bg-white/10 items-center justify-center"
                >
                    <Text className="text-white text-xl">
                        ↩
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )

}