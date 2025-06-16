import AntDesign from "@expo/vector-icons/AntDesign";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

export default function SupplierCard() {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.supplierName}>PharmaCo Supplies Inc.</Text>
        <AntDesign name="form" size={20} color="#aaa" />
      </View>

      <View style={styles.infoRow}>
        <AntDesign name="enviromento" size={16} color="rgb(31, 98, 149)" />
        <Text style={styles.infoText}>
          123 Health St, MedCity, PharmaState 12345
        </Text>
      </View>

      <View style={styles.infoRow}>
        <AntDesign name="phone" size={16} color="rgb(31, 98, 149)" />
        <Text style={styles.infoText}>(555) 123-4567</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <TouchableOpacity style={styles.orderButton}>
          <Text style={styles.infoText}>Create Order List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  orderButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    borderColor: "#ccc",
  },

  supplierName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
  },
});
