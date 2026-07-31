import React from "react";
import { View, Text } from "react-native";

interface Props {
  step: number;
  total: number;
}

export default function ProgressStepper({
  step,
  total,
}: Props) {
  return (
    <View className="mb-8">

      <Text className="text-slate-400 text-sm mb-4">
        Step {step} of {total}
      </Text>

      <View className="flex-row">

        {Array.from({ length: total }).map((_, index) => {

          const active = index < step;

          return (
            <View
              key={index}
              className={`flex-1 h-2 rounded-full mx-1 ${
                active
                  ? "bg-accent"
                  : "bg-slate-700"
              }`}
            />
          );

        })}

      </View>

    </View>
  );
}