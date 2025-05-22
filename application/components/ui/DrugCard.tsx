import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BottleSmall from "@/components/ui/BottleSmall";

export default function DrugCard({
  drug,
}: {
  drug: {
    id: string;
    drugName: string;
    inStock: number;
    price: number;
    expiry: string;
  };
}) {
  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <BottleSmall drugName={drug.drugName} />
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.drugId}>
            ID: <Text>{drug.id}</Text>
          </Text>
        </View>
        <Text style={styles.title}>{drug.drugName}</Text>
        <Text style={styles.inStock}>
          In Stock: <Text style={styles.inStockYes}>{drug.inStock}</Text>
        </Text>
        <Text style={styles.price}>₹{drug.price}</Text>
        <Text style={styles.expiry}>Expiry: {drug.expiry}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#ddd",
    marginHorizontal: 10,
    marginVertical: 5,
    backgroundColor: "#ffffff",
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
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginVertical: 2,
  },
  drugId: {
    fontSize: 12,
    color: "#aaa",
    marginVertical: 1,
  },
  inStock: {
    fontSize: 13,
    color: "#444",
  },
  inStockYes: {
    color: "green",
    fontWeight: "500",
  },
  expiry: {
    fontSize: 12,

    color: "#aaa",
  },
});
