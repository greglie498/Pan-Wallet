import { View, Text } from "react-native";
import { Card } from "@/components/ui";


interface Props {
    provider:string;
    recipient:string;
    amount:string;
    fee:string;
    status:string;
    sender:string;
    createdAt:string;
}



export default function TransactionCard({
    provider,
    recipient,
    amount,
    fee,
    status,
    sender,
    createdAt
}:Props){

    const statusStyle:Record<string,string>={
        COMPLETED:"text-green-600",
        PENDING:"text-blue-500",
        FAILED:"text-red-500",
        REVERSED:"text-orange-500",
    };

    const providerName =
        provider==="MPESA"
        ?
        "M-Pesa"
        :
        provider==="MTN_MOMO"
        ?
        "MTN MoMo"
        :
        "Internal";

    return (

        <Card variant="elevated" padding="lg">
            <View className="flex-row justify-between">
                <View className="flex-1">
                    <Text className="text-primary dark:text-white font-bold">
                        {providerName}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                        To: {recipient}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1">
                        From: {sender}
                    </Text>
                </View>

                <Text
                className={`font-bold text-xs ${
                statusStyle[status] ?? "text-gray-500"
                }`}
                >
                    {status}
                </Text>
            </View>

            <View className="flex-row justify-between mt-5">
                <View>
                    <Text className="text-gray-400 text-xs">
                        Amount
                    </Text>

                    <Text className="text-primary dark:text-white font-black text-lg">
                        {amount}
                    </Text>
                </View>

                <View>
                    <Text className="text-gray-400 text-xs">
                        Fee
                    </Text>
                    <Text className="text-primary dark:text-white font-bold">
                        {fee}
                    </Text>
                </View>
            </View>

            <Text className="text-gray-400 text-xs mt-4">
                {new Date(createdAt)
                .toLocaleString()}
            </Text>
        </Card>
    )
}