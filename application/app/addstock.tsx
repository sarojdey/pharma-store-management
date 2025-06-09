import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
  price: z.coerce
    .number()
    .min(0.01, "Buy price is required and must be greater than 0"),
  mrp: z.coerce
    .number()
    .min(0.01, "MRP is required and must be greater than 0"),
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Quantity is required and must be at least 1"),
  expiryDate: z.date({ required_error: "Expiry Date is required" }),
});

export default function AddInventoryItem() {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      medicineName: "",
      idCode: "",
      price: undefined,
      mrp: undefined,
      quantity: undefined,
      expiryDate: new Date(),
    },
  });

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
            onPress: () => reset(),
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
                        placeholder="e.g., Remorinax Plus 600mg"
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Medicine ID"
                  required
                  error={errors.idCode?.message}
                >
                  <Controller
                    control={control}
                    name="idCode"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.idCode && styles.inputError,
                        ]}
                        onChangeText={field.onChange}
                        value={field.value}
                        placeholder="e.g., 5260"
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Expiry Date"
                  required
                  error={errors.expiryDate?.message}
                >
                  <Controller
                    control={control}
                    name="expiryDate"
                    render={({ field }) => (
                      <>
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
                              !field.value && styles.placeholderText,
                            ]}
                          >
                            {field.value
                              ? field.value.toLocaleDateString()
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
                            value={field.value || new Date()}
                            mode="date"
                            display="default"
                            onChange={(_, selectedDate) => {
                              setShowDatePicker(false);
                              if (selectedDate) {
                                field.onChange(selectedDate);
                              }
                            }}
                          />
                        )}
                      </>
                    )}
                  />
                </FormField>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <FormField
                      label="Cost"
                      required
                      error={errors.price?.message}
                    >
                      <Controller
                        control={control}
                        name="price"
                        render={({ field }) => (
                          <TextInput
                            style={[
                              styles.input,
                              errors.price && styles.inputError,
                            ]}
                            keyboardType="decimal-pad"
                            onChangeText={(text) => {
                              if (text.trim() === "") {
                                field.onChange(undefined);
                              } else {
                                const numValue = parseFloat(text);
                                if (!isNaN(numValue)) {
                                  field.onChange(numValue);
                                }
                              }
                            }}
                            value={
                              field.value !== undefined
                                ? field.value.toString()
                                : ""
                            }
                            placeholder="e.g., 30"
                            placeholderTextColor="#9ca3af"
                          />
                        )}
                      />
                    </FormField>
                  </View>

                  <View style={styles.halfWidth}>
                    <FormField label="MRP" required error={errors.mrp?.message}>
                      <Controller
                        control={control}
                        name="mrp"
                        render={({ field }) => (
                          <TextInput
                            style={[
                              styles.input,
                              errors.mrp && styles.inputError,
                            ]}
                            keyboardType="decimal-pad"
                            onChangeText={(text) => {
                              if (text.trim() === "") {
                                field.onChange(undefined);
                              } else {
                                const numValue = parseFloat(text);
                                if (!isNaN(numValue)) {
                                  field.onChange(numValue);
                                }
                              }
                            }}
                            value={
                              field.value !== undefined
                                ? field.value.toString()
                                : ""
                            }
                            placeholder="e.g., 50"
                            placeholderTextColor="#9ca3af"
                          />
                        )}
                      />
                    </FormField>
                  </View>
                </View>

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
                        keyboardType="number-pad"
                        onChangeText={(text) => {
                          if (text.trim() === "") {
                            field.onChange(undefined);
                          } else {
                            const numValue = parseInt(text, 10);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }
                        }}
                        value={
                          field.value !== undefined
                            ? field.value.toString()
                            : ""
                        }
                        placeholder="e.g., 100"
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                </FormField>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={isSubmitting}
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
