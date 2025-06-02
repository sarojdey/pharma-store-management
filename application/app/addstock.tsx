import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { z } from "zod";
import { addDrug } from "../utils/dbActions";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const schema = z.object({
  medicineName: z.string().min(1, "Medicine name is required"),
  idCode: z.string().min(1, "ID Code is required"),
  price: z.coerce.number().min(0, "Buy price must be a valid number"),
  mrp: z.coerce.number().min(0, "MRP must be a valid number"),
  quantity: z.coerce.number().int().min(0, "Quantity must be a whole number"),
  expiryDate: z.date({ required_error: "Expiry Date is required" }),
});

export default function AddInventoryItem() {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      medicineName: "",
      idCode: "",
      price: 0,
      mrp: 0,
      quantity: 0,
      expiryDate: new Date(),
    },
  });

  const expiryDate = watch("expiryDate");

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);

    try {
      const drugData = {
        medicineName: data.medicineName,
        idCode: data.idCode,
        price: data.price,
        mrp: data.mrp,
        quantity: data.quantity,
        expiryDate: data.expiryDate.toISOString().split("T")[0],
      };

      const result = await addDrug(drugData);

      if (result.success) {
        Alert.alert("Success", "Medicine added to inventory successfully!", [
          {
            text: "OK",
            onPress: () => {
              setValue("medicineName", "");
              setValue("idCode", "");
              setValue("price", 0);
              setValue("mrp", 0);
              setValue("quantity", 0);
              setValue("expiryDate", new Date());
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to add medicine to inventory");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Alert.alert("Error", "An error occurred while adding the medicine");
    } finally {
      setIsSubmitting(false);
    }
  };

  interface DateChangeEvent {
    type: string;
    nativeEvent: any;
  }

  const handleDateChange = (
    event: DateChangeEvent | undefined,
    selectedDate?: Date | undefined
  ): void => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue("expiryDate", selectedDate, { shouldValidate: true });
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
    <SafeAreaView style={styles.safeArea}>
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
                <FormField
                  label="Medicine Name"
                  required
                  error={errors.medicineName?.message}
                >
                  <TextInput
                    style={[
                      styles.input,
                      errors.medicineName && styles.inputError,
                    ]}
                    onChangeText={(text) => setValue("medicineName", text)}
                    placeholder="e.g., Remorinax Plus 600mg"
                    placeholderTextColor="#9ca3af"
                  />
                </FormField>

                <FormField
                  label="Medicine ID"
                  required
                  error={errors.idCode?.message}
                >
                  <TextInput
                    style={[styles.input, errors.idCode && styles.inputError]}
                    onChangeText={(text) => setValue("idCode", text)}
                    placeholder="e.g., 5260"
                    placeholderTextColor="#9ca3af"
                  />
                </FormField>

                <FormField
                  label="Expiry Date"
                  required
                  error={errors.expiryDate?.message}
                >
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.dateInput,
                      errors.expiryDate && styles.inputError,
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        !expiryDate && styles.placeholderText,
                      ]}
                    >
                      {expiryDate
                        ? expiryDate.toLocaleDateString()
                        : "Select expiry date"}
                    </Text>
                    <MaterialIcons
                      name="calendar-month"
                      size={24}
                      color="#aaa"
                    />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={expiryDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                    />
                  )}
                </FormField>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <FormField
                      label="Cost"
                      required
                      error={errors.price?.message}
                    >
                      <TextInput
                        style={[
                          styles.input,
                          errors.price && styles.inputError,
                        ]}
                        keyboardType="decimal-pad"
                        onChangeText={(text) => setValue("price", Number(text))}
                        placeholder="e.g., 30"
                        placeholderTextColor="#9ca3af"
                      />
                    </FormField>
                  </View>

                  <View style={styles.halfWidth}>
                    <FormField label="MRP" required error={errors.mrp?.message}>
                      <TextInput
                        style={[styles.input, errors.mrp && styles.inputError]}
                        keyboardType="decimal-pad"
                        onChangeText={(text) => setValue("mrp", Number(text))}
                        placeholder="e.g., 50"
                        placeholderTextColor="#9ca3af"
                      />
                    </FormField>
                  </View>
                </View>

                <FormField
                  label="Quantity"
                  required
                  error={errors.quantity?.message}
                >
                  <TextInput
                    style={[styles.input, errors.quantity && styles.inputError]}
                    keyboardType="number-pad"
                    onChangeText={(text) => setValue("quantity", Number(text))}
                    placeholder="e.g., 100"
                    placeholderTextColor="#9ca3af"
                  />
                </FormField>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Add to Inventory</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
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
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#1e293b",
    minHeight: 52,
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#1e293b",
  },
  placeholderText: {
    color: "#9ca3af",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "rgb(70, 125, 168)",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },

  submitButtonDisabled: {
    backgroundColor: "rgb(61, 108, 145)",
    opacity: 0.6,
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 6,
    fontWeight: "500",
  },
});
