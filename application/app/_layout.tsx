import { createDatabase } from "@/utils/dbActions";
import Feather from "@expo/vector-icons/Feather";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Image, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  useEffect(() => {
    createDatabase();
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f5f5f5",
            borderBottomWidth: 1,
            borderTopWidth: 1,
            borderBottomColor: "#ccc",
            borderTopColor: "#ccc",
            paddingVertical: 20,
            paddingHorizontal: 18,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                height: 24,
                width: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={require("../assets/images/capsule.png")}
                style={{ height: "100%", width: "100%" }}
                resizeMode="contain"
              />
            </View>
            <Text style={{ fontWeight: "500", fontSize: 18, color: "#212121" }}>
              Medicine Stockist
            </Text>
          </View>
          <Feather name="menu" size={24} color="#212121" />
        </View>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="inventory" options={{ headerShown: false }} />
          <Stack.Screen name="addstock" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
