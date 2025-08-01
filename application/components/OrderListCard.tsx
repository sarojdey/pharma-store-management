import { useStore } from "@/contexts/StoreContext";
import { OrderList } from "@/types";
import { deleteOrderList } from "@/utils/orderListDb";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface OrderListCardProps {
  orderList: OrderList;
  onUpdate: () => void;
  serialNumber: number;
}

export default function OrderListCard({
  orderList,
  onUpdate,
  serialNumber,
}: OrderListCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const { currentStore } = useStore();

  const handleDelete = () => {
    Alert.alert(
      "Delete Order",
      `Are you sure you want to delete this order?\n\nMedicine: ${
        orderList.medicineName
      }${
        orderList.supplierName ? `\nSupplier: ${orderList.supplierName}` : ""
      }`,
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
              const result = await deleteOrderList(
                orderList.id,
                currentStore?.id
              );
              if (result.success) {
                onUpdate();
              } else {
                Alert.alert("Error", "Failed to delete order list");
              }
            } catch (error) {
              console.error("Error deleting order list:", error);
              Alert.alert("Error", "Failed to delete order list");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.listId}>#{serialNumber}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <MaterialIcons name="delete" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.medicineRow}>
        <Text style={styles.medicineName}>{orderList.medicineName}</Text>
      </View>

      <View style={styles.quantityRow}>
        <Text style={styles.quantityText}>Quantity: {orderList.quantity}</Text>
      </View>

      {orderList.supplierName && (
        <View style={styles.supplierRow}>
          <AntDesign name="user" size={16} color="#666" />
          <Text style={styles.supplierName}>{orderList.supplierName}</Text>
        </View>
      )}

      <View style={styles.dateRow}>
        <AntDesign name="calendar" size={16} color="#666" />
        <Text style={styles.dateText}>{formatDate(orderList.createdAt)}</Text>
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
    gap: 2,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  listId: {
    color: "#888",
    fontSize: 12,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  medicineRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  medicineName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  quantityRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 5,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgb(31, 98, 149)",
  },
  supplierRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  supplierName: {
    fontSize: 12,
    color: "#666",
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
});
