import React from "react";
import { View, Text, StyleSheet } from "react-native";
import DrugSmall from "@/components/ui/DrugSmall";
import AntDesign from "@expo/vector-icons/AntDesign";

export default function DrugCard({
  drug,
}: {
  drug: {
    id: string;
    drugName: string;
    inStock: number;
    price: number;
    expiry: string;
    drugType: string;
  };
}) {
  const formattedPrice = Number(drug.price).toFixed(2);

  return (
    <View style={styles.card}>
      <View style={styles.mrpContainer}>
        <Text style={styles.mrpLabel}>MRP</Text>
        <Text style={styles.mrpPrice}>₹{formattedPrice}</Text>
      </View>

      <View style={styles.imageContainer}>
        <DrugSmall drugType={drug.drugType} drugName={drug.drugName} />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.drugId}>
            ID: <Text>{drug.id}</Text>
          </Text>
          <View style={styles.editIcon}>
            <AntDesign name="form" size={20} color="#bbb" />
          </View>
        </View>

        <Text style={styles.title}>{drug.drugName}</Text>
        <Text style={styles.expiry}>Expiry: {drug.expiry}</Text>

        <Text style={styles.price}>₹{formattedPrice}</Text>
        <Text style={styles.inStock}>
          In Stock:{" "}
          <Text
            style={drug.inStock > 50 ? styles.inStockYes : styles.inStockNo}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#ddd",
    marginHorizontal: 10,
    marginVertical: 5,
    backgroundColor: "#ffffff",
    position: "relative",
  },
  mrpContainer: {
    position: "absolute",
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    borderColor: "#ddd",
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
    color: "#aaa",
    marginVertical: 1,
  },
  inStock: {
    fontSize: 13,
    color: "#444",
  },
  inStockYes: {
    color: "#1fb005",
    fontWeight: "500",
  },
  inStockNo: {
    color: "#c7220c",
    fontWeight: "500",
  },
  expiry: {
    fontSize: 12,
    color: "#aaa",
  },
});
