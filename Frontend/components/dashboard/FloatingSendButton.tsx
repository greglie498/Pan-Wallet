import React from "react";
import { TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

export default function FloatingSendButton() {
  return (
    <TouchableOpacity
      onPress={() => router.push("/(app)/transactions/quote")}
      className="
        absolute
        right-6
        bottom-24
        w-16
        h-16
        rounded-full
        bg-accent
        items-center
        justify-center
      "
      style={{
        elevation: 8,
      }}
    >
      <Feather
        name="send"
        size={26}
        color="#0A1628"
      />
    </TouchableOpacity>
  );
}