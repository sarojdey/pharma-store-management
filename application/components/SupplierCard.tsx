import { Supplier } from "@/types";
import { useStore } from "@/contexts/StoreContext";
import { addHistory } from "@/utils/historyDb";
import { deleteSupplier } from "@/utils/supplierDb";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";

interface SupplierCardProps {
  supplier: Supplier;
  onUpdate: () => void;
}

export default function SupplierCard({
  supplier,
  onUpdate,
}: SupplierCardProps) {
  const { currentStore } = useStore();

  const handleDelete = () => {
    Alert.alert(
      "Delete Supplier",
      `Are you sure you want to delete this supplier?\n\nSupplier: ${supplier.supplierName}\nLocation: ${supplier.location}\nPhone: ${supplier.phone}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!currentStore?.id) {
              Alert.alert("Error", "No store selected.");
              return;
            }

            try {
              if (!supplier.id) {
                Alert.alert("Error", "Invalid supplier ID.");
                return;
              }

              const result = await deleteSupplier(supplier.id, currentStore.id);
              if (result.success) {
                await addHistory(
                  {
                    operation: `Supplier deleted - Supplier: ${supplier.supplierName}, Location: ${supplier.location}, Phone: ${supplier.phone}`,
                  },
                  currentStore.id
                );
                onUpdate();
              } else {
                Alert.alert("Error", "Failed to delete supplier");
              }
            } catch (error) {
              console.error("Error deleting supplier:", error);
              Alert.alert("Error", "Failed to delete supplier");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.supplierName}>{supplier.supplierName}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <MaterialIcons name="delete" size={20} color="#888" />
        </TouchableOpacity>
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
    alignItems: "center",
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
  },
  orderButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    borderColor: "#ccc",
  },
  supplierName: {
    maxWidth: "85%",
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
