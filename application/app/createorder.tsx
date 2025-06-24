import { addHistory } from "@/utils/historyDb";
import { addOrderList } from "@/utils/orderListDb";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { z } from "zod";
// Import your database actions
// import { addOrderList } from "@/utils/orderDb";
// import { addHistory } from "@/utils/historyDb";

const orderSchema = z.object({
  supplierName: z.string().min(1, "Supplier is required"),
});

const medicineSchema = z.object({
  medicineName: z.string().min(1, "Medicine name is required"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .regex(/^\d+$/, "Quantity must be a number"),
});

interface OrderItem {
  id: string;
  medicineName: string;
  quantity: string;
}

interface AddOrderListProps {
  supplierName?: string;
}

export default function AddOrderList({ supplierName }: AddOrderListProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const navigation = useNavigation();

  // Main form for supplier selection
  const {
    control: orderControl,
    handleSubmit: handleOrderSubmit,
    reset: resetOrder,
    formState: { errors: orderErrors },
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      supplierName: supplierName || "",
    },
  });

  // Sub-form for adding medicines
  const {
    control: medicineControl,
    handleSubmit: handleMedicineSubmit,
    reset: resetMedicine,
    formState: { errors: medicineErrors },
  } = useForm({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      medicineName: "",
      quantity: "",
    },
  });

  const onAddMedicine = (data: z.infer<typeof medicineSchema>) => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      medicineName: data.medicineName,
      quantity: data.quantity,
    };

    setOrderItems((prev) => [...prev, newItem]);
    resetMedicine();
  };

  const onRemoveItem = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const onSaveOrderList = async (orderData: z.infer<typeof orderSchema>) => {
    if (orderItems.length === 0) {
      Alert.alert(
        "Error",
        "Please add at least one medicine to the order list"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const orderListData = {
        supplierName: orderData.supplierName,
        items: orderItems,
        createdAt: new Date().toISOString(),
      };

      const result = await addOrderList(orderListData);
      if (result.success) {
        await addHistory({
          operation: `Created order list for: ${orderData.supplierName}`,
        });

        Alert.alert("Success", "Order list created successfully!", [
          {
            text: "OK",
            onPress: () => {
              resetOrder();
              setOrderItems([]);
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to create order list");
      }
    } catch (error) {
      console.error("Error creating order list:", error);
      Alert.alert("Error", "An error occurred while creating order list");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FormField = ({
    label,
    children,
    error,
    required = false,
  }: {
    label: string;
    children: React.ReactNode;
    error?: string;
    required?: boolean;
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      {children}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );

  const OrderItemCard = ({ item }: { item: OrderItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.medicineName}</Text>
        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onRemoveItem(item.id)}
        style={styles.removeButton}
      >
        <MaterialIcons name="delete" size={20} color="#aaa" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-sharp" size={24} color="#333" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#333",
            flex: 1,
            textAlign: "center",
            paddingRight: 40,
          }}
        >
          Create Order List
        </Text>
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              {/* Supplier Selection */}
              <View style={styles.formCard}>
                <FormField
                  label="Supplier Name"
                  required
                  error={orderErrors.supplierName?.message}
                >
                  <Controller
                    control={orderControl}
                    name="supplierName"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          orderErrors.supplierName && styles.inputError,
                        ]}
                        onChangeText={field.onChange}
                        value={field.value}
                        placeholder="e.g., ABC Pharmaceuticals"
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                </FormField>
              </View>

              {/* Medicine Addition Form */}
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Add Medicine</Text>

                <FormField
                  label="Medicine Name"
                  required
                  error={medicineErrors.medicineName?.message}
                >
                  <Controller
                    control={medicineControl}
                    name="medicineName"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          medicineErrors.medicineName && styles.inputError,
                        ]}
                        onChangeText={field.onChange}
                        value={field.value}
                        placeholder="e.g., Paracetamol 500mg"
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Quantity"
                  required
                  error={medicineErrors.quantity?.message}
                >
                  <Controller
                    control={medicineControl}
                    name="quantity"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          medicineErrors.quantity && styles.inputError,
                        ]}
                        onChangeText={field.onChange}
                        value={field.value}
                        placeholder="e.g., 100"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                      />
                    )}
                  />
                </FormField>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleMedicineSubmit(onAddMedicine)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name="add"
                    size={20}
                    color="rgb(57, 104, 139)"
                  />
                  <Text style={styles.addButtonText}>Add Medicine</Text>
                </TouchableOpacity>
              </View>

              {/* Order Items List */}
              {orderItems.length > 0 && (
                <View style={styles.formCard}>
                  <Text style={styles.sectionTitle}>
                    Order Items ({orderItems.length})
                  </Text>
                  {orderItems.map((item) => (
                    <OrderItemCard key={item.id} item={item} />
                  ))}
                </View>
              )}

              {/* Save Order List Button */}
              {orderItems.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleOrderSubmit(onSaveOrderList)}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? "Saving..." : "Save Order List"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: "relative" },

  topbar: {
    position: "absolute",
    top: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderBottomColor: "#ccc",
    borderTopColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 16,
    zIndex: 1000,
    gap: 10,
  },

  scrollView: {
    marginTop: 60,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 18,
  },
  formCard: {
    backgroundColor: "#fcfcfc",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#212121",
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "rgba(223, 241, 255, 0.49)",
    borderWidth: 1,
    borderColor: "rgb(152, 175, 192)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: {
    color: "rgb(57, 104, 139)",
    fontSize: 14,
    fontWeight: "600",
  },
  itemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#6b7280",
  },
  removeButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: "rgba(223, 241, 255, 0.49)",
    borderWidth: 1,
    borderColor: "rgb(152, 175, 192)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "rgb(57, 104, 139)",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 6,
    fontWeight: "500",
  },
});
