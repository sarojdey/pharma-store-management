import { Drug } from "@/types";
import AntDesign from "@expo/vector-icons/AntDesign";
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
    expiryDate < currentDate
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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgColorMap[stockStatus],
          borderColor: borderColorMap[stockStatus],
        },
      ]}
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
            ID: <Text>{drug.id}</Text>
          </Text>
          <View style={styles.editIcon}>
            <AntDesign
              name="form"
              size={20}
              color={isLowOrOut ? "#666" : "#aaa"}
            />
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
  },
  expiry: {
    fontSize: 13,
  },
});
