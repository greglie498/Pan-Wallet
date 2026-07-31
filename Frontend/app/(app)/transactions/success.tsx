import React from "react";
import {
  View,
  Text,
  StatusBar,
} from "react-native";

import {
  router,
  useLocalSearchParams
} from "expo-router";

import {
  SafeAreaView
} from "react-native-safe-area-context";

import { Button } from "@/components/ui";


export default function SuccessScreen(){

    const params = useLocalSearchParams<{
        transactionId:string;
        amount:string;
        currency:string;
        recipient:string;
    }>();


    return (

        <SafeAreaView className="flex-1 bg-primary">
            <StatusBar
                barStyle="light-content"
                backgroundColor="#0A1628"
            />
            <View className="flex-1 px-6 justify-between py-10">
                <View className="items-center mt-12">
                    <View className="w-28 h-28 rounded-full bg-accent items-center justify-center">
                        <Text className="text-primary text-6xl">
                            ✓
                        </Text>
                    </View>

                    <Text className="text-white text-3xl font-black mt-8">
                        Transfer Successful
                    </Text>
                    <Text className="text-slate-400 text-center mt-3">
                        Your money has been sent successfully
                    </Text>

                    <View className="mt-10 items-center">
                        <Text className="text-slate-400">
                            Amount sent
                        </Text>
                        <Text className="text-accent text-4xl font-black mt-2">
                            {params.currency}{" "}
                            {Number(params.amount).toLocaleString()}
                        </Text>

                    </View>
                </View>

                <View>
                    <Button
                        title="View Transaction"
                        size="lg"
                        onPress={() =>
                            router.replace(
                                `/(app)/transactions/${params.transactionId}`
                            )
                        }
                    />

                    <View className="mt-3">
                        <Button
                            title="Back to Dashboard"
                            variant="ghost"
                            size="lg"
                            onPress={() =>
                                router.replace("/(app)")
                            }
                        />
                    </View>
                </View>
            </View>

        </SafeAreaView>
    );

}