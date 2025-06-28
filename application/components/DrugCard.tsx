import { Drug } from "@/types";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import { StyleSheet, Text, View } from "react-native";

const LOW_STOCK_THRESHOLD = 30;
const EXPIRY_WARNING_DAYS = 30;

const formatPrice = (value: number) => `₹${Number(value).toFixed(2)}`;

const bgColorMap: Record<string, string> = {
  "out of stock": "rgba(255, 206, 206, 0.76)",
  "low in stock": "rgba(255, 235, 211, 0.76)",
  "in stock": "#f5f5f5",
};

const borderColorMap: Record<string, string> = {
  "out of stock": "rgb(196, 147, 147)",
  "low in stock": "rgb(201, 181, 153)",
  "in stock": "#ccc",
};

const textColorMap: Record<string, string> = {
  expired: "rgb(212, 0, 0)",
  expiring: "rgb(228, 125, 0)",
  consumable: "#444",
};

export default function DrugCard({ drug }: { drug: Drug }) {
  const currentDate = new Date();
  const expiryDate = new Date(drug.expiryDate);
  const daysLeft =
    (expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

  const expiryStatus =
    expiryDate.getTime() < currentDate.setHours(0, 0, 0, 0)
      ? "expired"
      : daysLeft <= EXPIRY_WARNING_DAYS
      ? "expiring"
      : "consumable";

  const stockStatus =
    drug.quantity === 0
      ? "out of stock"
      : drug.quantity <= LOW_STOCK_THRESHOLD
      ? "low in stock"
      : "in stock";

  const isLowOrOut =
    stockStatus === "low in stock" || stockStatus === "out of stock";

  const handleCardPress = () => {
    router.push(`/product?id=${drug.id}`);
  };
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: bgColorMap[stockStatus],
          borderColor: borderColorMap[stockStatus],
        },
      ]}
      onPress={handleCardPress}
    >
      <View
        style={[
          styles.mrpContainer,
          { borderColor: isLowOrOut ? "#555" : "#ccc" },
        ]}
      >
        <Text
          style={[styles.mrpLabel, { color: isLowOrOut ? "#555" : "#888" }]}
        >
          MRP
        </Text>
        <Text style={styles.mrpPrice}>{formatPrice(drug.mrp)}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.drugId, { color: isLowOrOut ? "#444" : "#888" }]}
          >
            Batch ID: <Text>{drug.batchId}</Text>
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
            {expiryStatus === "expired" && (
              <FontAwesome5 name="skull" size={15} color="rgb(189, 63, 63)" />
            )}
            {expiryStatus === "expiring" && (
              <Entypo name="time-slot" size={15} color="rgb(197, 118, 45)" />
            )}
            {stockStatus === "out of stock" && (
              <FontAwesome5
                name="box-open"
                size={15}
                color="rgb(189, 63, 63)"
              />
            )}
            {stockStatus === "low in stock" && (
              <FontAwesome name="warning" size={15} color="rgb(197, 118, 45)" />
            )}
          </View>
        </View>

        <Text style={styles.title}>{drug.medicineName}</Text>
        <Text style={styles.price}>{formatPrice(drug.price)}</Text>

        <Text style={styles.expiry}>
          Expiry:{" "}
          <Text
            style={{
              fontWeight: "500",
              color: textColorMap[expiryStatus],
            }}
          >
            {drug.expiryDate}
          </Text>
        </Text>

        <Text style={styles.inStock}>
          In Stock:{" "}
          <Text
            style={{
              fontWeight: "500",
              color:
                textColorMap[
                  stockStatus === "out of stock"
                    ? "expired"
                    : stockStatus === "low in stock"
                    ? "expiring"
                    : "consumable"
                ],
            }}
          >
            {drug.quantity}
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    position: "relative",
  },
  mrpContainer: {
    position: "absolute",
    right: 14,
    bottom: 14,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  mrpLabel: {
    fontSize: 8,
  },
  mrpPrice: {
    fontSize: 15,
    color: "#444",
    marginVertical: 2,
  },
  detailsContainer: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  drugId: {
    fontSize: 12,
    marginVertical: 1,
  },
  inStock: {
    fontSize: 13,
  },
  expiry: {
    fontSize: 13,
  },
});
