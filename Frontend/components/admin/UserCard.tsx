import { View, Text } from "react-native";
import { Card } from "@/components/ui";

interface Props {
    name:string;
    phone:string;
    email:string|null;
    status:string;
    wallets:number;
    createdAt:string;
}

export default function UserCard({
    name,
    phone,
    email,
    status,
    wallets,
    createdAt
}:Props){

    const statusColor = status === "ACTIVE"
        ?
        "text-green-600"
        :
        "text-red-500";

    return (
        <Card
        variant="elevated"
        padding="lg"
        >
            <View className="flex-row justify-between">
                <View className="flex-1">
                    <Text className="text-primary dark:text-white font-bold text-lg">
                        {name || "Unnamed User"}
                    </Text>

                    <Text className="text-gray-500 mt-1">
                        {phone}
                    </Text>

                    {
                        email &&
                        <Text className="text-gray-400 text-xs mt-1">
                            {email}
                        </Text>
                    }
                </View>

                <View>
                    <Text className={`font-bold text-xs ${statusColor}`}>
                        {status}
                    </Text>
                </View>
            </View>

            <View className="mt-4 flex-row justify-between">
                <View>
                    <Text className="text-gray-400 text-xs">
                        Wallets
                    </Text>

                    <Text className="font-bold text-primary dark:text-white">
                        {wallets}
                    </Text>
                </View>

                <View>
                    <Text className="text-gray-400 text-xs">
                        Joined
                    </Text>

                    <Text className="font-bold text-primary dark:text-white">
                        {new Date(createdAt).toLocaleDateString()}
                    </Text>
                 </View>
            </View>
        </Card>
    )
}