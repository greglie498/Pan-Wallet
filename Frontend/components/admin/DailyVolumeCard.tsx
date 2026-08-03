import {Text} from "react-native";
import {Card} from "@/components/ui";
import {BarChart} from "react-native-gifted-charts";

interface Props{
    data:{
        value:number;
        label:string;
    }[];
    width:number;

}

export default function DailyVolumeCard({
    data,
    width
}:Props){
    return (
        <Card
        variant="elevated"
        padding="lg"
        >
            <Text className="text-primary dark:text-white font-bold text-lg mb-5">
                📈 Daily Volume
            </Text>

            {
                data.length > 0 ?
                <BarChart
                data={data}
                width={width}
                height={170}
                barWidth={25}
                spacing={15}
                roundedTop
                hideRules
                />
                    :
                    <Text className="text-gray-500 text-center py-8">
                        No volume data yet
                    </Text>
            }
        </Card>
    )
}