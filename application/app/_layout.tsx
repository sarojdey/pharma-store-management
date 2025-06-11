import { createDatabase, resetDatabase } from "@/utils/dbActions";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  useEffect(() => {
    // resetDatabase();
    createDatabase();
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack screenOptions={{ animation: "none" }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="inventory" options={{ headerShown: false }} />
          <Stack.Screen name="product" options={{ headerShown: false }} />
          <Stack.Screen name="addstock" options={{ headerShown: false }} />
          <Stack.Screen name="sales" options={{ headerShown: false }} />
          <Stack.Screen name="createorder" options={{ headerShown: false }} />
          <Stack.Screen name="expiry" options={{ headerShown: false }} />
          <Stack.Screen name="outofstock" options={{ headerShown: false }} />
          <Stack.Screen name="history" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
