import { Supplier } from "@/types";
import AntDesign from "@expo/vector-icons/AntDesign";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

export default function SupplierCard({ supplier }: { supplier: Supplier }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.supplierName}>{supplier.supplierName}</Text>
        <AntDesign name="form" size={20} color="#aaa" />
      </View>

      <View
        style={{
          width: "100%",
          flexDirection: "row",
          gap: 5,
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <View style={{ flex: 1, maxWidth: "60%", gap: 2 }}>
          <View style={styles.infoRow}>
            <AntDesign
              style={{ marginTop: 3.5 }}
              name="enviromento"
              size={16}
              color="rgb(31, 98, 149)"
            />
            <Text style={styles.infoText}>{supplier.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <AntDesign
              style={{ marginTop: 3.5 }}
              name="phone"
              size={16}
              color="rgb(31, 98, 149)"
            />
            <Text style={styles.infoText}>{supplier.phone}</Text>
          </View>
        </View>
        <View>
          <TouchableOpacity style={styles.orderButton}>
            <Text>Create Order List</Text>
          </TouchableOpacity>
        </View>
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
    maxWidth: "90%",
    fontSize: 17,
    fontWeight: "600",
    color: "rgb(25, 76, 116)",
  },
  infoRow: {
    flexDirection: "row",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
  },
});
