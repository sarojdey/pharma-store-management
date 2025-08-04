import { Stack } from "expo-router";
import React from "react";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="product" />
      <Stack.Screen name="addstock" />
      <Stack.Screen name="sales" />
      <Stack.Screen name="addSales" />
      <Stack.Screen name="createorder" />
      <Stack.Screen name="orderlist" />
      <Stack.Screen name="expiry" />
      <Stack.Screen name="outofstock" />
      <Stack.Screen name="history" />
      <Stack.Screen name="suppliers" />
      <Stack.Screen name="addSupplier" />
      <Stack.Screen name="salesreport" />
      <Stack.Screen name="stocksreport" />
    </Stack>
  );
}
