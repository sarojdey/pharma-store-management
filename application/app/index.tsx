import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BUTTONS: {
  key: string;
  label: string;
  description: string;
  icon: any;
  bg?: string;
  border?: string;
  text?: string;
}[] = [
  {
    key: "addStock",
    label: "Add to Stock",
    icon: "store",
    description: "Add a new batch of medicine to your inventory.",
    bg: "rgba(201, 231, 255, 0.1)",
    border: "rgba(97, 129, 155, 0.30)",
    text: "rgb(70, 125, 168)",
  },
  {
    key: "stock",
    label: "View All Stock",
    icon: "view-list",
    description: "See a list of all medicine batches in stock.",
    bg: "rgba(208, 255, 231, 0.1)",
    border: "rgba(85, 149, 117, 0.30)",
    text: "rgb(66, 160, 113)",
  },
  {
    key: "sales",
    label: "Sales",
    icon: "area-chart",
    description: "See a list of all completed sales transactions.",
    bg: "rgba(209, 253, 255, 0.1)",
    border: "rgba(109, 176, 171, 0.30)",
    text: "rgb(73, 147, 142)",
  },
  {
    key: "expiryAlerts",
    label: "Expiry Alerts",
    icon: "calendar-month",
    description: "Check which medicine batches are close to expiry.",
    bg: "rgba(255, 219, 219, 0.1)",
    border: "rgba(155, 98, 98, 0.30)",
    text: "rgb(178, 85, 85)",
  },

  {
    key: "createOrderList",
    label: "Create Order List",
    icon: "shopping-cart",
    description: "Create a sale entry and update stock.",
    bg: "rgba(236, 219, 255, 0.1)",
    border: "rgba(115, 98, 155, 0.3)",
    text: "rgb(122, 96, 176)",
  },
  {
    key: "lowStockAlerts",
    label: "Low Stock Alerts",
    icon: "move-to-inbox",
    description: "Check medicines that need restocking.",
    bg: "rgba(255, 233, 219, 0.1)",
    border: "rgba(155, 115, 98, 0.3)",
    text: "rgb(181, 115, 74)",
  },
  {
    key: "history",
    label: "History",
    icon: "watch-later",
    description: "View a log of all actions like stock updates and sales.",
    bg: "rgba(255, 251, 219, 0.1)",
    border: "rgba(155, 151, 98, 0.3)",
    text: "rgb(153, 133, 52)",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={[styles.grid, { marginBottom: 24, marginTop: 12 }]}>
        <TouchableOpacity style={styles.chartButton} activeOpacity={0.7}>
          <AntDesign name="linechart" size={24} style={styles.chartIcon} />
          <Text style={styles.chartLabel}>Sales Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chartButton} activeOpacity={0.7}>
          <AntDesign name="profile" size={24} style={styles.chartIcon} />
          <Text style={styles.chartLabel}>Stock Report</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {BUTTONS.map((btn) => (
          <TouchableOpacity
            onPress={() => router.push("/inventory")}
            key={btn.key}
            style={[
              styles.card,
              {
                backgroundColor: btn.bg || "#fff",
                borderColor: btn.border || "#ccc",
              },
            ]}
            activeOpacity={0.7}
          >
            <MaterialIcons name={btn.icon} size={100} color={btn.text} />
            <Text style={[styles.label, { color: btn.text || "#000" }]}>
              {btn.label}
            </Text>
            <Text style={[styles.description, { color: btn.text || "#000" }]}>
              {btn.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chartButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  chartLabel: { color: "#212121", fontWeight: "500" },
  chartIcon: { color: "#212121", marginRight: 8 },

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
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    textAlign: "center",
    flexWrap: "wrap",
  },
});
