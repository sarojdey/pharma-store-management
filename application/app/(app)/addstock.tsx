import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
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
import { addDrug } from "../../utils/stocksDb";
import { Drug } from "@/types";
import { useStore } from "@/contexts/StoreContext";
import { addHistory } from "@/utils/historyDb";
import TopBar from "@/components/TopBar";

const schema = z
  .object({
    medicineName: z.string().min(1, "Medicine name is required"),

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
    rackNo: z
      .string()
      .transform((val) => val.trim() || null)
      .optional(),
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
      if (data.medicineType === "Tablet" || data.medicineType === "Capsule" || data.medicineType === "Other") {
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
  const [isRestockMode, setIsRestockMode] = useState(false);
  const params = useLocalSearchParams();
  const { currentStore } = useStore();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      medicineName: "",

      price: undefined,
      mrp: undefined,
      numberOfPackages: undefined,
      unitPerPackage: undefined,
      expiryDate: new Date(),
      medicineType: "Tablet",
      otherMedicineType: "",
      rackNo: "",
      batchNo: "",
      distributorName: "",
      purchaseInvoiceNumber: "",
    },
  });

  useEffect(() => {
    if (params.drugDetails) {
      try {
        const drugData: Drug = JSON.parse(params.drugDetails as string);
        setIsRestockMode(true);

        setValue("medicineName", drugData.medicineName);

        setValue("price", drugData.price);
        setValue("mrp", drugData.mrp);
        setValue("medicineType", drugData.medicineType);
        if (drugData.rackNo) setValue("rackNo", drugData.rackNo);
        if (drugData.batchNo) setValue("batchNo", drugData.batchNo);
        if (drugData.distributorName)
          setValue("distributorName", drugData.distributorName);
        if (drugData.purchaseInvoiceNumber)
          setValue("purchaseInvoiceNumber", drugData.purchaseInvoiceNumber);
      } catch (error) {
        console.error("Error parsing drug details:", error);
        Alert.alert("Error", "Failed to load drug details");
      }
    }
  }, [params.drugDetails, setValue]);
  const navigation = useNavigation();
  const medicineType = watch("medicineType");

  const getPackageLabel = () => {
    switch (medicineType) {
      case "Tablet":
        return "No. of Strips";
      case "Capsule":
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
    return medicineType === "Tablet" || medicineType === "Capsule" || medicineType === "Other";
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

        price: data.price,
        mrp: data.mrp,
        quantity: totalQuantity,
        unitPerPackage: finalUnitPerPackage,
        expiryDate: data.expiryDate.toISOString().split("T")[0],
        medicineType: (data.medicineType === "Other"
          ? data.otherMedicineType
          : data.medicineType) as string,
        rackNo: data.rackNo || null,
        batchNo: data.batchNo || null,
        distributorName: data.distributorName || null,
        purchaseInvoiceNumber: data.purchaseInvoiceNumber || null,
      };

      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }
      const result = await addDrug(drugData, currentStore.id);

      if (result.success) {
        await addHistory(
          {
            operation: `Stock added - Medicine: ${drugData.medicineName}, ID: ${result.id}`,
          },
          currentStore?.id
        );
        const message = isRestockMode
          ? "Medicine restocked successfully!"
          : "Medicine added to inventory successfully!";

        Alert.alert("Success", message, [
          {
            text: "OK",
            onPress: () => {
              if (isRestockMode) {
                navigation.goBack();
              } else {
                reset();
              }
            },
          },
        ]);
      } else {
        const errorMessage = isRestockMode
          ? "Failed to restock medicine"
          : "Failed to add medicine to inventory";
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = isRestockMode
        ? "An error occurred while restocking the medicine"
        : "An error occurred while adding the medicine";
      Alert.alert("Error", errorMessage);
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
      <TopBar title={isRestockMode ? "Restock Medicine" : "Add Medicine"} />

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
                        <Picker.Item label="Capsule" value="Capsule" />
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
              <FormField label="Rack No." error={errors.rackNo?.message}>
                <Controller
                  control={control}
                  name="rackNo"
                  render={({ field }) => (
                    <TextInput
                      style={[styles.input, errors.rackNo && styles.inputError]}
                      onChangeText={field.onChange}
                      value={field.value}
                      placeholder="e.g., R100"
                      placeholderTextColor="#9ca3af"
                    />
                  )}
                />
              </FormField>
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
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isRestockMode ? "Add to Stock" : "Add to Inventory"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: "relative" },

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
    backgroundColor: "#d6e5ff35",
    borderWidth: 1,
    borderColor: "#50628240",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#4167a8ff",
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
