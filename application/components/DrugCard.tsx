import { Drug } from "@/types";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function DrugCard({ drug }: { drug: Drug }) {
  const [isExpired, setIsExpired] = useState("");
  const [stockStatus, setStockStatus] = useState("");

  useEffect(() => {
    const currentDate = new Date();
    const expiryDate = new Date(drug.expiryDate);
    const daysLeft =
      (expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (expiryDate < currentDate) {
      setIsExpired("expired");
    } else if (daysLeft <= 30) {
      setIsExpired("expiring");
    } else {
      setIsExpired("consumable");
    }

    if (drug.quantity === 0) {
      setStockStatus("out of stock");
    } else if (drug.quantity <= 30) {
      setStockStatus("low in stock");
    } else {
      setStockStatus("in stock");
    }
  }, [drug]);

  const formattedPrice = (value: number) => Number(value).toFixed(2);

  return (
    <View
      style={[
        styles.card,

        stockStatus === "out of stock"
          ? {
              backgroundColor: "rgba(255, 206, 206, 0.76)",
              borderColor: "rgb(196, 147, 147)",
            }
          : stockStatus === "low in stock"
          ? {
              backgroundColor: "rgba(255, 235, 211, 0.76)",
              borderColor: "rgb(201, 181, 153)",
            }
          : { backgroundColor: "#f5f5f5", borderColor: "#ccc" },
      ]}
    >
      <View
        style={[
          styles.mrpContainer,

          !(stockStatus === "low in stock" || stockStatus === "out of stock")
            ? { borderColor: "#ccc" }
            : { borderColor: "#555" },
        ]}
      >
        <Text
          style={[
            styles.mrpLabel,

            !(stockStatus === "low in stock" || stockStatus === "out of stock")
              ? { color: "#888" }
              : { color: "#555" },
          ]}
        >
          MRP
        </Text>
        <Text style={styles.mrpPrice}>₹{formattedPrice(drug.mrp)}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.drugId,
              stockStatus === "low in stock" || stockStatus === "out of stock"
                ? { color: "#444" }
                : { color: "#888" },
            ]}
          >
            ID: <Text>{drug.id}</Text>
          </Text>
          <View style={styles.editIcon}>
            <AntDesign
              name="form"
              size={20}
              color={
                !(
                  stockStatus === "low in stock" ||
                  stockStatus === "out of stock"
                )
                  ? "#aaa"
                  : "#666"
              }
            />
          </View>
        </View>

        <Text style={styles.title}>{drug.medicineName}</Text>
        <Text style={styles.price}>₹{formattedPrice(drug.price)}</Text>
        <Text style={styles.expiry}>
          Expiry:{" "}
          <Text
            style={[
              { fontWeight: "500" },

              isExpired === "expired"
                ? { color: "rgb(212, 0, 0)" }
                : isExpired === "expiring"
                ? { color: "rgb(228, 125, 0)" }
                : { color: "#444" },
            ]}
          >
            {drug.expiryDate}
          </Text>
        </Text>

        <Text style={styles.inStock}>
          In Stock:{" "}
          <Text
            style={[
              { fontWeight: "500" },

              stockStatus === "out of stock"
                ? { color: "rgb(212, 0, 0)" }
                : stockStatus === "low in stock"
                ? { color: "rgb(228, 125, 0)" }
                : { color: "#444" },
            ]}
          >
            {drug.quantity}
          </Text>
        </Text>
      </View>
    </View>
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
    color: "#aaa",
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
  editIcon: {
    marginBottom: 5,
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
    color: "#444",
  },

  expiry: {
    fontSize: 13,
    color: "#444",
  },
});
