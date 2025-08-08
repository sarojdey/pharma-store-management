import { useStore } from "@/contexts/StoreContext";
import { addHistory } from "@/utils/historyDb";
import { addOrderList } from "@/utils/orderListDb";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
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

const orderSchema = z.object({
  supplierName: z.string().optional(),
  medicineName: z.string().min(1, "Medicine name is required"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .regex(/^\d+$/, "Quantity must be a number"),
});

interface AddOrderListProps {
  supplierName?: string;
}

export default function AddOrderList({ supplierName }: AddOrderListProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();
  const { currentStore } = useStore();
  const params = useLocalSearchParams();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      supplierName: supplierName || "",
      medicineName: "",
      quantity: "",
    },
  });

  useEffect(() => {
    if (params.medicineName) {
      setValue("medicineName", params.medicineName as string);
    }
  }, [params.medicineName, setValue]);

  const onSaveOrderList = async (data: z.infer<typeof orderSchema>) => {
    setIsSubmitting(true);

    try {
      const orderListData = {
        supplierName: data.supplierName || undefined,
        medicineName: data.medicineName,
        quantity: parseInt(data.quantity),
      };
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }
      const result = await addOrderList(orderListData, currentStore?.id);

      if (result.success) {
        await addHistory(
          {
            operation: `Order added - Order ID: ${result.id}, Medicine: ${data.medicineName}, Quantity: ${data.quantity}`,
          },
          currentStore?.id
        );

        Alert.alert("Success", "Order list entry created successfully!", [
          {
            text: "Add Another",
            onPress: () => {
              reset({
                supplierName: data.supplierName,
                medicineName: "",
                quantity: "",
              });
            },
          },
          {
            text: "Done",
            onPress: () => {
              navigation.goBack();
            },
            style: "default",
          },
        ]);
      } else {
        Alert.alert("Failed to create order list entry");
      }
    } catch (error) {
      console.error("Error creating order list:", error);
      Alert.alert("Error", "An error occurred while creating order list entry");
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
          Add Order Entry
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
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Order Details</Text>

                <FormField
                  label="Supplier Name"
                  error={errors.supplierName?.message}
                >
                  <Controller
                    control={control}
                    name="supplierName"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.supplierName && styles.inputError,
                        ]}
                        onChangeText={field.onChange}
                        value={field.value}
                        placeholder="e.g., ABC Pharmaceuticals"
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Medicine Name"
                  required
                  error={errors.medicineName?.message}
                >
                  <Controller
                    control={control}
                    name="medicineName"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.medicineName && styles.inputError,
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
                  error={errors.quantity?.message}
                >
                  <Controller
                    control={control}
                    name="quantity"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.quantity && styles.inputError,
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
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit(onSaveOrderList)}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                >
                  <MaterialIcons
                    name="save"
                    size={20}
                    color="rgb(57, 104, 139)"
                  />
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? "Saving..." : "Save Order Entry"}
                  </Text>
                </TouchableOpacity>
              </View>
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
  submitButton: {
    backgroundColor: "rgba(223, 241, 255, 0.49)",
    borderWidth: 1,
    borderColor: "rgb(152, 175, 192)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
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

  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
});
