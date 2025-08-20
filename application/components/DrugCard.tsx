import { Drug } from "@/types";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const LOW_STOCK_THRESHOLD = 30;
const EXPIRY_WARNING_DAYS = 30;

const formatPrice = (value: number) => `₹${Number(value).toFixed(2)}`;

const bgColorMap: Record<string, string> = {
  "out of stock": "rgba(255, 220, 220, 0.53)",
  "low in stock": "rgba(255, 237, 215, 0.56)",
  "in stock": "#f9f9f9",
};

const borderColorMap: Record<string, string> = {
  "out of stock": "rgba(200, 163, 163, 0.49)",
  "low in stock": "rgba(201, 181, 153, 0.51)",
  "in stock": "#c3c3c3a6",
};

const textColorMap: Record<string, string> = {
  expired: "#bd3f3fff",
  expiring: "#c5762dff",
  consumable: "#444",
};

const bgColorMapInner: Record<string, string> = {
  "out of stock": "#ffe7efd0",
  "low in stock": "#fff8e3a1",
  "in stock": "#e9eef346",
};

const borderColorMapInner: Record<string, string> = {
  "out of stock": "#ad959d54",
  "low in stock": "#c3ba9f4e",
  "in stock": "#b7c3c941",
};

const textColorMapInner: Record<string, string> = {
  "out of stock": "#7e5462ff",
  "low in stock": "#8c7635ff",
  "in stock": "#64748b",
};

export default function DrugCard({
  drug,
  haveActionButton,
}: {
  drug: Drug;
  haveActionButton: boolean;
}) {
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
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.drugId, { color: textColorMapInner[stockStatus] }]}
          >
            ID: <Text>{drug.id}</Text>
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
            {expiryStatus === "expired" && (
              <FontAwesome5 name="skull" size={15} color="#bd3f3fff" />
            )}
            {expiryStatus === "expiring" && (
              <Entypo name="time-slot" size={15} color="#c5762dff" />
            )}
            {stockStatus === "out of stock" && (
              <FontAwesome5 name="box-open" size={15} color="#bd3f3fff" />
            )}
            {stockStatus === "low in stock" && (
              <FontAwesome name="warning" size={15} color="#c5762dff" />
            )}
          </View>
        </View>

        <Text style={styles.title}>{drug.medicineName}</Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={styles.price}>{formatPrice(drug.price)}</Text>
            <Text style={styles.expiry}>
              Expiry:{" "}
              <Text
                style={{
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
          <View>
            <View
              style={[
                styles.mrpContainer,
                {
                  backgroundColor: bgColorMapInner[stockStatus],
                  borderColor: borderColorMapInner[stockStatus],
                },
              ]}
            >
              <Text
                style={[
                  styles.mrpLabel,
                  { color: textColorMapInner[stockStatus] },
                ]}
              >
                MRP
              </Text>
              <Text style={styles.mrpPrice}>{formatPrice(drug.mrp)}</Text>
            </View>
          </View>
        </View>
        {haveActionButton && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.orderListBtn}
              onPress={() =>
                router.push({
                  pathname: "/(app)/createorder",
                  params: { medicineName: drug.medicineName },
                })
              }
            >
              <Text style={styles.orderListBtnText}>Create Order List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.restockBtn}
              onPress={() =>
                router.push({
                  pathname: "/addstock",
                  params: { drugDetails: JSON.stringify(drug) },
                })
              }
            >
              <Text style={styles.restockBtnText}>Restock</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  restockBtn: {
    backgroundColor: "#d6e5ff35",
    borderWidth: 1,
    borderColor: "#50628240",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  restockBtnText: {
    color: "#4167a8ff",
    fontWeight: "700",
    fontSize: 14,
  },
  orderListBtn: {
    borderWidth: 1,
    borderColor: "#5a816c35",
    backgroundColor: "#e7fff23c",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  orderListBtnText: {
    color: "#26794bff",
    fontWeight: "700",
    fontSize: 14,
  },
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  mrpLabel: {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
  },
  mrpPrice: {
    fontSize: 15,
    fontWeight: 700,
    color: "#444547ff",
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
    fontSize: 15,
    fontWeight: "700",
    color: "#444547ff",
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444547ff",
    marginBottom: 4,
  },
  drugId: {
    fontSize: 11,
    fontWeight: 500,
    marginVertical: 1,
  },
  inStock: {
    fontSize: 13,
    fontWeight: 600,
    color: "#444547ff",
  },
  expiry: {
    fontSize: 13,
    fontWeight: 600,
    color: "#444547ff",
  },
});
