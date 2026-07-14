module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportsource: "nativewind" }],
        ],
        plugins: [
            "nativewind/babel",
            "expo-router/babel",
        ],
    };
};