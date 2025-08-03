import { useStore } from "@/contexts/StoreContext";
import { getSalesReport } from "@/utils/salesDb";
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";

interface GroupedSale {
  medicineName: string;
  price: number;
  mrp: number;
  unitPerPackage: number;
  quantitySold: number;
  totalProfit: number;
}

const SalesReportTable: React.FC = () => {
  const [groupedSales, setGroupedSales] = useState<GroupedSale[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentStore } = useStore();

  useEffect(() => {
    loadSalesData();
  }, [currentStore]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }
      const salesReport = await getSalesReport(currentStore.id);
      setGroupedSales(salesReport as GroupedSale[]);
    } catch (error) {
      console.error("Error loading sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading sales report...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.horizontalScroll}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          style={styles.verticalScroll}
        >
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={[styles.cell, styles.headerCell, styles.serialCol]}>
                Serial No.
              </Text>
              <Text
                style={[styles.cell, styles.headerCell, styles.medicineCol]}
              >
                Medicine Name
              </Text>
              <Text style={[styles.cell, styles.headerCell, styles.priceCol]}>
                Price
              </Text>
              <Text style={[styles.cell, styles.headerCell, styles.mrpCol]}>
                MRP
              </Text>
              <Text
                style={[styles.cell, styles.headerCell, styles.quantityCol]}
              >
                Quantity Sold
              </Text>
              <Text style={[styles.cell, styles.headerCell, styles.profitCol]}>
                Total Profit
              </Text>
            </View>

            {/* Data Rows */}
            {groupedSales.map((item, index) => (
              <View key={index} style={styles.dataRow}>
                <Text style={[styles.cell, styles.dataCell, styles.serialCol]}>
                  {index + 1}
                </Text>
                <Text
                  style={[styles.cell, styles.dataCell, styles.medicineCol]}
                >
                  {item.medicineName}
                </Text>
                <Text style={[styles.cell, styles.dataCell, styles.priceCol]}>
                  ₹{item.price.toFixed(2)}
                </Text>
                <Text style={[styles.cell, styles.dataCell, styles.mrpCol]}>
                  ₹{item.mrp.toFixed(2)}
                </Text>
                <Text
                  style={[styles.cell, styles.dataCell, styles.quantityCol]}
                >
                  {item.quantitySold}
                </Text>
                <Text style={[styles.cell, styles.dataCell, styles.profitCol]}>
                  ₹{item.totalProfit.toFixed(2)}
                </Text>
              </View>
            ))}

            {groupedSales.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No sales data available</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  horizontalScroll: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  table: {
    minWidth: 800, // Ensures horizontal scroll
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
  },
  dataRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    textAlign: "center",
  },
  headerCell: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  dataCell: {
    fontSize: 13,
    color: "#555",
  },
  serialCol: {
    width: 80,
  },
  medicineCol: {
    width: 200,
    textAlign: "left",
  },
  priceCol: {
    width: 100,
  },
  mrpCol: {
    width: 100,
  },
  quantityCol: {
    width: 120,
  },
  profitCol: {
    width: 120,
  },
  emptyRow: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default SalesReportTable;
