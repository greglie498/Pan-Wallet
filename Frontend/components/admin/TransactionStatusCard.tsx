import { View, Text } from "react-native";
import { Card } from "@/components/ui";

interface Props {
    data: Record<string, number>;
    total:number;
}

const statusColors:Record<string,string> = {
    COMPLETED:"#22C55E",
    FAILED:"#EF4444",
    PENDING:"#3B82F6",
    REVERSED:"#F59E0B",

};

export default function TransactionStatusCard({ data, total}:Props){
    return (
        <Card variant="elevated" padding="lg">

            <Text className="text-primary dark:text-white text-lg font-bold mb-5">
                📋 Transaction Status
            </Text>

            {
                Object.entries(data).map(([status,count])=>{

                    const percentage = total === 0 ? 0 : Math.round((count/total)*100);

                    return (
                        <View key={status} className="mb-5">
                            <View className="flex-row justify-between mb-2">
                                <Text className="font-medium text-primary dark:text-white">
                                    {status}
                                </Text>

                                <Text className="text-gray-500">
                                    {count} ({percentage}%)
                                </Text>
                            </View>

                            <View className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                                <View 
                                className="h-2 rounded-full"
                                style={{
                                    width:`${percentage}%`,
                                    backgroundColor: statusColors[status] ?? "#F5A623"
                                }}
                                />
                            </View>
                        </View>
                    )

                })
            }
        </Card>
    )
}