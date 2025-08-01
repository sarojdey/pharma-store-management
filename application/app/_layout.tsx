import { StoreProvider } from "@/contexts/StoreContext";
import { Slot } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <StoreProvider>
            <Slot />
          </StoreProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}
