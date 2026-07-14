/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // PanWallet brand colors
                primary: {
                    DEFAULT: "#0A1628", // deep navy
                    light: "#1A2F50",
                    dark: "#050D1A",
                },
                accent: {
                    DEFAULT: "#F5A623", // warm amber
                    light: "#F7BC55",
                    dark: "#D4891A",
                },
                success: "#22C55E",
                error: "#EF4444",
                warning: "#F59E0B",
                surface: "#F8FAFC",
                muted: "#94A3B8",
            },
            fontFamily: {
                sans: ["Inter_400regular"],
                medium: ["{Inter_500Medium"],
                semibold: ["Inter_600semiBold"],
                bold: ["Inter_700Bold"],
            },
        },
    },
    plugins: [],
};