import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
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
    icon: require("../assets/images/blueCard.png"),
    description: "Add a new batch of medicine to your inventory.",
    bg: "rgba(201, 231, 255, 0.1)",
    border: "rgba(97, 129, 155, 0.30)",
    text: "rgb(87, 134, 170)",
  },
  {
    key: "stock",
    label: "View All Stock",
    icon: require("../assets/images/greenCard.png"),
    description: "See a list of all medicine batches in stock.",
    bg: "rgba(208, 255, 231, 0.1)",
    border: "rgba(85, 149, 117, 0.30)",
    text: "rgb(92, 155, 123)",
  },
  {
    key: "sales",
    label: "Sales",
    icon: require("../assets/images/cyanCard.png"),
    description: "See a list of all completed sales transactions.",
    bg: "rgba(209, 253, 255, 0.1)",
    border: "rgba(109, 176, 171, 0.30)",
    text: "rgb(83, 145, 141)",
  },
  {
    key: "expiryAlerts",
    label: "Expiry Alerts",
    icon: require("../assets/images/redCard.png"),
    description: "Check which medicine batches are close to expiry.",
    bg: "rgba(255, 219, 219, 0.1)",
    border: "rgba(155, 98, 98, 0.30)",
    text: "rgb(176, 99, 99)",
  },

  {
    key: "createOrderList",
    label: "Create Order List",
    icon: require("../assets/images/purpleCard.png"),
    description: "Create a sale entry and update stock.",
    bg: "rgba(236, 219, 255, 0.1)",
    border: "rgba(115, 98, 155, 0.3)",
    text: "rgb(130, 107, 175)",
  },
  {
    key: "lowStockAlerts",
    label: "Low Stock Alerts",
    icon: require("../assets/images/orangeCard.png"),
    description: "Check medicines that need restocking.",
    bg: "rgba(255, 233, 219, 0.1)",
    border: "rgba(155, 115, 98, 0.3)",
    text: "rgb(178, 123, 90)",
  },
  {
    key: "history",
    label: "History",
    icon: require("../assets/images/yellowCard.png"),
    description: "View a log of all actions like stock updates and sales.",
    bg: "rgba(255, 251, 219, 0.1)",
    border: "rgba(155, 151, 98, 0.3)",
    text: "rgb(142, 134, 66)",
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
            <View style={styles.imageContainer}>
              <Image
                source={btn.icon}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
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
  imageContainer: {
    height: 100,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  image: {
    height: "100%",
    width: "100%",
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
