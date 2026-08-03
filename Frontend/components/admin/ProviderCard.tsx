import {View,Text} from "react-native";
import {PieChart} from "react-native-gifted-charts";
import {Card} from "@/components/ui";


interface Props{
    data:{
        value:number;
        text:string;
    }[];
}



export default function ProviderCard({
    data
}:Props){

    return (

        <Card
        variant="elevated"
        padding="lg"
        >
            <Text className="text-primary dark:text-white font-bold text-lg mb-5">
                🌍 Providers
            </Text>

            {
                data.length === 1 ?

                <View className="items-center py-6">
                    <Text className="text-4xl">
                        📱
                    </Text>

                    <Text className="text-primary dark:text-white font-bold text-xl mt-3">
                        {data[0].text}
                    </Text>

                    <Text className="text-gray-500 mt-2">
                        100% of transactions
                    </Text>
                </View>
                :
                <PieChart
                data={data}
                donut
                radius={80}
                innerRadius={55}
                centerLabelComponent={()=>(
                    <Text className="font-bold">
                        Providers
                    </Text>
                )}

                />
            }

        </Card>
    )
}