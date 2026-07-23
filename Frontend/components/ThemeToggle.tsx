import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { useTheme } from "@/lib/store/theme.store";

interface ThemeToggleProps {
    size?: number;
}

export function ThemeToggle({ size = 40}: ThemeToggleProps) {
    const { isDark, toggle } = useTheme();

    return (
        <TouchableOpacity
            onPress={toggle}
            className="items-center justify-center rounded-full bg-primary-light dark:bg-gray-700"
            style={{ width: size, height: size }}
        >
            <Text style={{ fontSize: size * 0.45 }}>
                {isDark ? "☀️" : "🌙"}
            </Text>

        </TouchableOpacity>
    );
}