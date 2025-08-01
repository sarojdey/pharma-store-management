import React from "react";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen name="welcomeScreen" />
      <Stack.Screen name="welcomeBackScreen" />
    </Stack>
  );
}
