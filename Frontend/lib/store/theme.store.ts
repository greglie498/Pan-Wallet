import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
    mode: ThemeMode;
    isDark: boolean;
    isLoading: boolean;

    initialize: () => Promise<void>;
    setMode: (mode: ThemeMode) => Promise<void>;
    toggle: () => Promise<void>;
}

const THEME_KEY = "panwallet_theme_mode";

const useThemeStore = create<ThemeState>((set, get) => ({
    mode: "system",
    isDark: false,
    isLoading: true,

    initialize: async () => {
        try {
            const saved = await SecureStore.getItemAsync(THEME_KEY);
            const mode = (saved as ThemeMode) ?? "system";
            set({ mode, isLoading: false });
        } catch {
            set({ mode: "system", isLoading: false });
        }
    },

    setMode: async (mode: ThemeMode) => {
        try {
            await SecureStore.setItemAsync(THEME_KEY, mode);
            set({ mode });
        } catch {
            set ({ mode });
        }
    },

    toggle: async () => {
        const { mode, setMode } = get();
        const next = mode === "dark" ? "light" : "dark";
    },
}));

// Hook that resolves system preference
export function useTheme() {
    const systemColorScheme = useColorScheme();
    const { mode, toggle, setMode, initialize, isLoading} = useThemeStore();

    const isDark =
        mode === "system"
            ? systemColorScheme === "dark"
            : mode === "dark";

    return { isDark, mode, toggle, setMode, initialize, isLoading };
}

export { useThemeStore };