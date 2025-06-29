import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
  View,
} from "react-native";
import { z } from "zod";
import { addDrug } from "../utils/stocksDb";
const schema = z
  .object({
    medicineName: z.string().min(1, "Medicine name is required"),
    batchId: z.string().min(1, "ID Code is required"),
    price: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().min(0.01, "Cost is required and must be greater than 0")),
    mrp: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().min(0.01, "MRP is required and must be greater than 0")),
    numberOfPackages: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().int().min(1, "Number of packages is required and must be at least 1")),
    unitPerPackage: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().int().min(1, "Unit per package is required and must be at least 1").optional()),
    expiryDate: z.date({ required_error: "Expiry Date is required" }),
    medicineType: z.string().min(1, "Medicine type is required"),
    otherMedicineType: z.string().optional(),
    batchNo: z
      .string()
      .transform((val) => val.trim() || null)
      .optional(),
    distributorName: z
      .string()
      .transform((val) => val.trim() || null)
      .optional(),
    purchaseInvoiceNumber: z
      .string()
      .transform((val) => val.trim() || null)
      .optional(),
  })
  .refine(
    (data) =>
      data.medicineType !== "Other" ||
      (data.otherMedicineType && data.otherMedicineType.trim() !== ""),
    {
      message: "Please specify the other medicine type",
      path: ["otherMedicineType"],
    }
  )
  .refine(
    (data) => {
      if (data.medicineType === "Tablet" || data.medicineType === "Other") {
        return data.unitPerPackage !== undefined && data.unitPerPackage >= 1;
      }
      return true;
    },
    {
      message: "Unit per package is required.",
      path: ["unitPerPackage"],
    }
  );

export default function AddInventoryItem() {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      medicineName: "",
      batchId: "",
      price: undefined,
      mrp: undefined,
      numberOfPackages: undefined,
      unitPerPackage: undefined,
      expiryDate: new Date(),
      medicineType: "Tablet",
      otherMedicineType: "",
      batchNo: "",
      distributorName: "",
      purchaseInvoiceNumber: "",
    },
  });

  const medicineType = watch("medicineType");

  const getPackageLabel = () => {
    switch (medicineType) {
      case "Tablet":
        return "No. of Strips";
      case "Syrup":
        return "No. of Bottles";
      case "Injectable":
        return "No. of Vials";
      case "Ointment":
        return "No. of Tubes";
      case "Inhaler":
        return "No. of Inhalers";
      case "Other":
        return "No. of Packages";
      default:
        return "No. of Packages";
    }
  };

  const shouldShowUnitPerPackage = () => {
    return medicineType === "Tablet" || medicineType === "Other";
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);

    try {
      const finalUnitPerPackage = shouldShowUnitPerPackage()
        ? data.unitPerPackage || 1
        : 1;

      const totalQuantity = data.numberOfPackages * finalUnitPerPackage;

      const drugData = {
        medicineName: data.medicineName,
        batchId: data.batchId,
        price: data.price,
        mrp: data.mrp,
        quantity: totalQuantity,
        unitPerPackage: finalUnitPerPackage,
        expiryDate: data.expiryDate.toISOString().split("T")[0],
        medicineType: (data.medicineType === "Other"
          ? data.otherMedicineType
          : data.medicineType) as string,
        batchNo: data.batchNo || null,
        distributorName: data.distributorName || null,
        purchaseInvoiceNumber: data.purchaseInvoiceNumber || null,
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
          Add Medicine
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={true}
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
                label="Batch ID"
                required
                error={errors.batchId?.message}
              >
                <Controller
                  control={control}
                  name="batchId"
                  render={({ field }) => (
                    <TextInput
                      style={[
                        styles.input,
                        errors.batchId && styles.inputError,
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

              <FormField
                label="Medicine Type"
                required
                error={errors.medicineType?.message}
              >
                <Controller
                  control={control}
                  name="medicineType"
                  render={({ field }) => (
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={field.value}
                        onValueChange={field.onChange}
                        style={styles.picker}
                      >
                        <Picker.Item label="Tablet" value="Tablet" />
                        <Picker.Item label="Syrup" value="Syrup" />
                        <Picker.Item label="Injectable" value="Injectable" />
                        <Picker.Item label="Ointment" value="Ointment" />
                        <Picker.Item label="Inhaler" value="Inhaler" />
                        <Picker.Item label="Other" value="Other" />
                      </Picker>
                    </View>
                  )}
                />
              </FormField>

              {medicineType === "Other" && (
                <FormField
                  label="Specify Other Type"
                  required
                  error={errors.otherMedicineType?.message}
                >
                  <Controller
                    control={control}
                    name="otherMedicineType"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.otherMedicineType && styles.inputError,
                        ]}
                        onChangeText={field.onChange}
                        value={field.value}
                        placeholder="e.g., Inhaler"
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                </FormField>
              )}

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
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          value={field.value ? String(field.value) : ""}
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
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          value={field.value ? String(field.value) : ""}
                          placeholder="e.g., 50"
                          placeholderTextColor="#9ca3af"
                        />
                      )}
                    />
                  </FormField>
                </View>
              </View>

              {/* Package-based quantity fields */}
              {shouldShowUnitPerPackage() ? (
                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <FormField
                      label={getPackageLabel()}
                      required
                      error={errors.numberOfPackages?.message}
                    >
                      <Controller
                        control={control}
                        name="numberOfPackages"
                        render={({ field }) => (
                          <TextInput
                            style={[
                              styles.input,
                              errors.numberOfPackages && styles.inputError,
                            ]}
                            keyboardType="number-pad"
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            value={field.value ? String(field.value) : ""}
                            placeholder="e.g., 10"
                            placeholderTextColor="#9ca3af"
                          />
                        )}
                      />
                    </FormField>
                  </View>

                  <View style={styles.halfWidth}>
                    <FormField
                      label="Unit per Package"
                      required
                      error={errors.unitPerPackage?.message}
                    >
                      <Controller
                        control={control}
                        name="unitPerPackage"
                        render={({ field }) => (
                          <TextInput
                            style={[
                              styles.input,
                              errors.unitPerPackage && styles.inputError,
                            ]}
                            keyboardType="number-pad"
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            value={field.value ? String(field.value) : ""}
                            placeholder="e.g., 100"
                            placeholderTextColor="#9ca3af"
                          />
                        )}
                      />
                    </FormField>
                  </View>
                </View>
              ) : (
                <FormField
                  label={getPackageLabel()}
                  required
                  error={errors.numberOfPackages?.message}
                >
                  <Controller
                    control={control}
                    name="numberOfPackages"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.numberOfPackages && styles.inputError,
                        ]}
                        keyboardType="number-pad"
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value ? String(field.value) : ""}
                        placeholder="e.g., 100"
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                </FormField>
              )}

              <FormField label="Batch No." error={errors.batchNo?.message}>
                <Controller
                  control={control}
                  name="batchNo"
                  render={({ field }) => (
                    <TextInput
                      style={[
                        styles.input,
                        errors.batchNo && styles.inputError,
                      ]}
                      onChangeText={field.onChange}
                      value={field.value}
                      placeholder="e.g., B123456"
                      placeholderTextColor="#9ca3af"
                    />
                  )}
                />
              </FormField>

              <FormField
                label="Distributor Name"
                error={errors.distributorName?.message}
              >
                <Controller
                  control={control}
                  name="distributorName"
                  render={({ field }) => (
                    <TextInput
                      style={[
                        styles.input,
                        errors.distributorName && styles.inputError,
                      ]}
                      onChangeText={field.onChange}
                      value={field.value}
                      placeholder="e.g., ABC Pharma Pvt Ltd"
                      placeholderTextColor="#9ca3af"
                    />
                  )}
                />
              </FormField>

              <FormField
                label="Purchase Invoice No."
                error={errors.purchaseInvoiceNumber?.message}
              >
                <Controller
                  control={control}
                  name="purchaseInvoiceNumber"
                  render={({ field }) => (
                    <TextInput
                      style={[
                        styles.input,
                        errors.purchaseInvoiceNumber && styles.inputError,
                      ]}
                      onChangeText={field.onChange}
                      value={field.value}
                      placeholder="e.g., INV-7890"
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 4,
    padding: 2,
  },
  picker: {
    height: 55,
    width: "100%",
    color: "#111",
  },
});
