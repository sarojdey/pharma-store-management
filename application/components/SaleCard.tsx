import { Sale } from "@/types";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const formatDate = (dateString: string) => {
  const date = new Date(dateString + "Z");
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SaleCard({ sale }: { sale: Sale }) {
  const handleCardPress = () => {
    router.push(`/(app)/editsale?saleId=${sale.id}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text style={styles.saleId}>Sale ID: {sale.id}</Text>
          <Text style={styles.date}>{formatDate(sale.createdAt)}</Text>
        </View>

        <Text style={styles.medicineName}>{sale.medicineName}</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Quantity Sold</Text>
              <Text style={styles.metricValue}>{sale.quantity}</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>MRP per Unit</Text>
              <Text style={styles.metricValue}>₹{(sale.mrp / sale.unitPerPackage).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Price per Unit</Text>
              <Text style={styles.metricValue}>₹{(sale.price / sale.unitPerPackage).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Total Profit</Text>
              <Text style={styles.metricValue}>
                ₹{((sale.mrp - sale.price) * sale.quantity / sale.unitPerPackage).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderColor: "#c3c3c3a6",
    borderWidth: 1,
  },
  cardContent: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  saleId: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  date: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  medicineName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444547ff",
    marginBottom: 6,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#e9eef346",
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#b7c3c941",
  },

  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444547ff",
  },
  metricLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
    textTransform: "uppercase",
  },
});
