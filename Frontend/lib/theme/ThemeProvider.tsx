import React, { useEffect } from "react";
import { useColorScheme } from "nativewind";
import { useThemeStore } from "@/lib/store/theme.store";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode } = useThemeStore();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    if (mode === "dark") {
      setColorScheme("dark");
    } else if (mode === "light") {
      setColorScheme("light");
    } else {
      setColorScheme("system");
    }
  }, [mode, setColorScheme]);

  return <>{children}</>;
}