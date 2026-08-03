import { View, Text } from "react-native";
import { Card } from "@/components/ui";

interface Props {
    emoji:string;
    label:string;
    value:string;
    color:string;
}

export default function AdminStatCard({
    emoji,
    label,
    value,
    color
}:Props){
    return (
        <View className="w-1/2 px-2 mb-4">
            <Card variant="elevated" padding="md">
                <View className={`w-11 h-11 rounded-2xl ${color} items-center justify-center mb-3`}>
                    <Text className="text-xl">
                        {emoji}
                    </Text>
                </View>
                    <Text className="text-primary dark:text-white text-2xl font-black">
                        {value}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">
                        {label}
                    </Text>
            </Card>
        </View>
    )
}