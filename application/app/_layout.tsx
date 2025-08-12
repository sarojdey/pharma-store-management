import { StoreProvider } from "@/contexts/StoreContext";
import { Slot } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ErrorLogProvider } from "@/contexts/ErrorLogContext";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <ErrorLogProvider>
            <StoreProvider>
              <Slot />
            </StoreProvider>
          </ErrorLogProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}
