import { Drug } from "@/types";
import AntDesign from "@expo/vector-icons/AntDesign";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function DrugCard({ drug }: { drug: Drug }) {
  const formattedPrice = Number(drug.price).toFixed(2);

  return (
    <View
      style={[
        styles.card,
        drug.inStock > 50
          ? { backgroundColor: "#f2f2f2", borderColor: "#ccc" }
          : drug.inStock > 30
          ? {
              backgroundColor: "rgba(255, 228, 196, 0.76)",
              borderColor: "rgb(201, 181, 153)",
            }
          : {
              backgroundColor: "rgba(255, 184, 184, 0.76)",
              borderColor: "rgb(196, 147, 147)",
            },
      ]}
    >
      <View
        style={[
          styles.mrpContainer,
          drug.inStock > 50 ? { borderColor: "#ccc" } : { borderColor: "#555" },
        ]}
      >
        <Text
          style={[
            styles.mrpLabel,
            drug.inStock > 50 ? { color: "#888" } : { color: "#555" },
          ]}
        >
          MRP
        </Text>
        <Text style={styles.mrpPrice}>₹{formattedPrice}</Text>
      </View>

      {/* <View style={styles.imageContainer}>
        <DrugSmall drugType={drug.drugType} drugName={drug.drugName} />
      </View> */}

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.drugId,
              drug.inStock > 50 ? { color: "#888" } : { color: "#444" },
            ]}
          >
            ID: <Text>{drug.id}</Text>
          </Text>
          <View style={styles.editIcon}>
            <AntDesign
              name="form"
              size={20}
              color={drug.inStock > 50 ? "#aaa" : "#666"}
            />
          </View>
        </View>

        <Text style={styles.title}>{drug.drugName}</Text>
        <Text
          style={[
            styles.expiry,
            drug.inStock > 50 ? { color: "#888" } : { color: "#444" },
          ]}
        >
          Expiry: {drug.expiry}
        </Text>

        <Text style={styles.price}>₹{formattedPrice}</Text>
        <Text style={styles.inStock}>
          In Stock:{" "}
          <Text
            style={[
              { fontWeight: "500" },
              drug.inStock > 50
                ? { color: "#1fb005" }
                : drug.inStock > 30
                ? { color: "rgb(228, 125, 0)" }
                : { color: "rgb(212, 0, 0)" },
            ]}
          >
            {drug.inStock}
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
  imageContainer: {
    marginRight: 12,
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
    marginTop: 4,
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
    fontSize: 12,
  },
});
