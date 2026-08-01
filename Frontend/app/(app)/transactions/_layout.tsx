import { Stack } from "expo-router";

export default function TransactionLayout() {
  return (
    <Stack screenOptions={{headerShown:false}}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="quote" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}