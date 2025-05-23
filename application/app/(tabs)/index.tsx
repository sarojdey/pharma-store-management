import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import type { IconSymbolName } from "@/components/ui/IconSymbol";

const BUTTONS: {
  key: string;
  label: string;
  icon: IconSymbolName;
  bg?: string;
  border?: string;
  text?: string;
}[] = [
  {
    key: "inventory",
    label: "Inventory",
    icon: "storefront",
    bg: "rgba(212, 236, 255, 0.10)",
    border: "rgba(97, 129, 155, 0.30)",
    text: "rgb(96, 148, 189)",
  },
  {
    key: "orders",
    label: "Orders",
    icon: "cart",
    bg: "rgba(172, 255, 214, 0.10)",
    border: "rgba(85, 149, 117, 0.30)",
    text: "rgb(102, 173, 137)",
  },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "chart.bar",
    bg: "rgba(227, 216, 255, 0.10)",
    border: "rgba(128, 109, 176, 0.30)",
    text: "rgb(128, 105, 185)",
  },
  {
    key: "alerts",
    label: "Alerts",
    icon: "bell",
    bg: "rgba(255, 232, 216, 0.10)",
    border: "rgba(155, 122, 98, 0.30)",
    text: "rgb(189, 135, 96)",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom + 65, insets.bottom * 2 + 10);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: bottomPadding },
        ]}
      >
        <View style={styles.grid}>
          {BUTTONS.map((btn) => (
            <TouchableOpacity
              key={btn.key}
              style={[
                styles.card,
                {
                  backgroundColor: btn.bg || "#fff",
                  borderColor: btn.border || "#ccc",
                },
              ]}
              onPress={() => console.log(`${btn.label} pressed`)}
              activeOpacity={0.7}
            >
              <IconSymbol
                style={styles.icon}
                size={20}
                name={btn.icon}
                color={btn.text || "#000"}
              />
              <Text style={[styles.label, { color: btn.text || "#000" }]}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    aspectRatio: 2.5,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
});
