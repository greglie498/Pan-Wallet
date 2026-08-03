import {
TouchableOpacity,
Text
} from "react-native";

import { Card } from "@/components/ui";


interface Props{
    emoji:string;
    title:string;
    description:string;
    onPress:()=>void;
}


export default function QuickAccessCard({

    emoji,
    title,
    description,
    onPress

}:Props){

    return (
        <TouchableOpacity
        className="flex-1"
        onPress={onPress}
        >
            <Card variant="elevated" padding="lg">
                <Text className="text-3xl mb-3">
                    {emoji}
                </Text>

                <Text className="text-primary dark:text-white font-bold">
                    {title}
                </Text>

                <Text className="text-gray-500 text-xs mt-1">
                    {description}
                </Text>
            </Card>
        </TouchableOpacity>

    )

}