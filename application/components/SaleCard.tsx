import { Sale } from "@/types";
import { StyleSheet, Text, View } from "react-native";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SaleCard({ sale }: { sale: Sale }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.medicineId}>Sale ID: {sale.id}</Text>
        <Text style={styles.date}>{formatDate(sale.createdAt)}</Text>
      </View>

      <Text style={styles.medicineName}>{sale.medicineName}</Text>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Quantity Sold</Text>
          <Text style={styles.detailValue}>{sale.quantity}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Units per Package</Text>
          <Text style={styles.detailValue}>{sale.unitPerPackage}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalUnits}>
          Total Units:{" "}
          <Text style={styles.totalValue}>
            {sale.quantity * sale.unitPerPackage}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  medicineId: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  date: {
    fontSize: 12,
    color: "#666",
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
    marginTop: 4,
  },
  totalUnits: {
    fontSize: 13,
    color: "#666",
    textAlign: "right",
  },
  totalValue: {
    fontWeight: "600",
    color: "#111",
  },
});
