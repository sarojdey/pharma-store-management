import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { addSale } from "@/utils/salesDb";
import { getAllDrugs, updateDrug } from "@/utils/stocksDb";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Drug } from "@/types";
import { useStore } from "@/contexts/StoreContext";

const textColorMap: Record<string, string> = {
  expired: "rgb(212, 0, 0)",
  expiring: "rgb(228, 125, 0)",
  consumable: "#444",
};

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
};

const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  required = false,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    {children}
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

type MedicineDropdownItemProps = {
  item: Drug;
  onSelect: (medicine: Drug) => void;
  formatDate: (dateString: string) => string;
  textColorMap: Record<string, string>;
  expiryStatus: (expiryDate: string) => "expired" | "expiring" | "consumable";
};

const MedicineDropdownItem: React.FC<MedicineDropdownItemProps> = ({
  item,
  onSelect,
  formatDate,
  textColorMap,
  expiryStatus,
}) => (
  <TouchableOpacity style={styles.dropdownItem} onPress={() => onSelect(item)}>
    <View style={styles.dropdownItemContent}>
      <Text style={styles.dropdownItemName}>{item.medicineName}</Text>
      <Text style={styles.dropdownItemType}>{item.medicineType}</Text>
      {item.batchNo && (
        <Text style={styles.dropdownItemBatch}>Batch: {item.batchNo}</Text>
      )}
      <View style={styles.dropdownItemDetails}>
        <Text style={styles.dropdownItemStock}>
          Stock: {item.quantity}{" "}
          {item.medicineType === "Tablet" ? "tablets" : "units"}
        </Text>
        <Text
          style={[
            styles.dropdownItemExpiry,
            {
              fontWeight: "600",
              color: textColorMap[expiryStatus(item.expiryDate)],
            },
          ]}
        >
          Exp: {formatDate(item.expiryDate)}
        </Text>
      </View>
      <Text style={styles.dropdownItemPrice}>MRP: ₹{item.mrp}</Text>
    </View>
  </TouchableOpacity>
);

const salesSchema = z.object({
  selectedMedicine: z.object({
    id: z.number(),
    medicineName: z.string(),
    batchId: z.string(),
    price: z.number(),
    mrp: z.number(),
    quantity: z.number(),
    unitPerPackage: z.number(),
    expiryDate: z.string(),
    medicineType: z.string(),
    batchNo: z.string().nullable().optional(),
    distributorName: z.string().nullable().optional(),
    purchaseInvoiceNumber: z.string().nullable().optional(),
  }),
  saleQuantity: z.number(),
});

type FormData = z.infer<typeof salesSchema>;

export default function AddSale() {
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState<Drug[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Drug[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();
  const { currentStore } = useStore();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      selectedMedicine: undefined as unknown as FormData["selectedMedicine"],
      saleQuantity: undefined as unknown as number,
    },
  });

  const selectedMedicine = watch("selectedMedicine");

  useEffect(() => {
    loadMedicines();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMedicines(medicines);
    } else {
      const filtered = medicines.filter((medicine) =>
        medicine.medicineName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMedicines(filtered);
    }
  }, [searchQuery, medicines]);

  const loadMedicines = async () => {
    try {
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }
      const allDrugs = await getAllDrugs(currentStore?.id);
      const typedDrugs = allDrugs as Drug[];
      const availableDrugs = typedDrugs.filter(
        (drug: Drug) => drug.quantity > 0
      );
      setMedicines(availableDrugs);
      setFilteredMedicines(availableDrugs);
    } catch (error) {
      console.error("Error loading medicines:", error);
      Alert.alert("Error", "Failed to load medicines");
    }
  };

  const getQuantityLabel = (medicineType: string) => {
    switch (medicineType) {
      case "Tablet":
        return "Number of Tablets";
      case "Syrup":
        return "Number of Bottles";
      case "Injectable":
        return "Number of Vials";
      case "Ointment":
        return "Number of Tubes";
      case "Inhaler":
        return "Number of Inhalers";
      default:
        return "Quantity";
    }
  };

  const getQuantityPlaceholder = (medicineType: string) => {
    switch (medicineType) {
      case "Tablet":
        return "e.g., 10 tablets";
      case "Syrup":
        return "e.g., 2 bottles";
      case "Injectable":
        return "e.g., 5 vials";
      case "Ointment":
        return "e.g., 3 tubes";
      case "Inhaler":
        return "e.g., 1 inhaler";
      default:
        return "e.g., 10";
    }
  };

  const validateQuantity = (
    quantity: number,
    medicine: FormData["selectedMedicine"]
  ) => {
    if (quantity > medicine.quantity) {
      return false;
    }
    return true;
  };

  const calculatePackagesNeeded = (
    quantity: number,
    medicine: FormData["selectedMedicine"]
  ) => {
    if (medicine.medicineType === "Tablet") {
      return Math.ceil(quantity / medicine.unitPerPackage);
    }
    return quantity;
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const { selectedMedicine, saleQuantity } = data;

      if (!selectedMedicine) {
        Alert.alert("Error", "Please select a medicine");
        setIsSubmitting(false);
        return;
      }

      if (!saleQuantity) {
        Alert.alert("Error", "Please enter a valid quantity");
        setIsSubmitting(false);
        return;
      }

      if (!validateQuantity(saleQuantity, selectedMedicine)) {
        Alert.alert(
          "Insufficient Stock",
          `Only ${
            selectedMedicine.quantity
          } ${selectedMedicine.medicineType.toLowerCase()}(s) available in stock.`
        );
        setIsSubmitting(false);
        return;
      }

      const packagesNeeded = calculatePackagesNeeded(
        saleQuantity,
        selectedMedicine
      );

      const saleData = {
        medicineId: selectedMedicine.id,
        medicineName: selectedMedicine.medicineName,
        quantity: saleQuantity,
        unitPerPackage: selectedMedicine.unitPerPackage,
      };
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }
      const saleResult = await addSale(saleData, currentStore.id);

      if (saleResult.success) {
        const newQuantity = selectedMedicine.quantity - saleQuantity;
        const updateResult = await updateDrug(
          selectedMedicine.id,
          {
            quantity: newQuantity,
          },
          currentStore?.id
        );

        if (updateResult.success) {
          const totalAmount = saleQuantity * selectedMedicine.mrp;
          Alert.alert(
            "Sale Added Successfully",
            `Medicine: ${
              selectedMedicine.medicineName
            }\nQuantity: ${saleQuantity}\nTotal Amount: ₹${totalAmount.toFixed(
              2
            )}\nRemaining Stock: ${newQuantity}`,
            [
              {
                text: "OK",
                onPress: () => {
                  reset();
                  setSearchQuery("");
                  loadMedicines();
                },
              },
            ]
          );
        } else {
          Alert.alert("Warning", "Sale recorded but failed to update stock");
        }
      } else {
        Alert.alert("Error", "Failed to add sale record");
      }
    } catch (error) {
      console.error("Error submitting sale:", error);
      Alert.alert("Error", "An error occurred while processing the sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectMedicine = (medicine: Drug) => {
    setValue("selectedMedicine", medicine);
    setShowMedicineDropdown(false);
    setSearchQuery(medicine.medicineName);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const expiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const status =
      expiry.getTime() < today.setHours(0, 0, 0, 0)
        ? "expired"
        : diffDays <= 30
        ? "expiring"
        : "consumable";
    return status;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-sharp" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Add Sale</Text>
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
        >
          <View style={styles.container}>
            <View style={styles.formCard}>
              <FormField
                label="Select Medicine"
                required
                error={errors.selectedMedicine?.message}
              >
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    errors.selectedMedicine && styles.inputError,
                  ]}
                  onPress={() => setShowMedicineDropdown(true)}
                >
                  <Text
                    style={[
                      styles.dropdownButtonText,
                      !selectedMedicine && styles.placeholderText,
                    ]}
                  >
                    {selectedMedicine
                      ? selectedMedicine.medicineName
                      : "Search and select medicine"}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </FormField>

              {selectedMedicine && (
                <View style={styles.selectedMedicineInfo}>
                  <Text style={styles.selectedMedicineTitle}>
                    Selected Medicine Details:
                  </Text>
                  <Text style={styles.selectedMedicineDetail}>
                    Type: {selectedMedicine.medicineType}
                  </Text>
                  {selectedMedicine.batchNo && (
                    <Text style={styles.selectedMedicineDetail}>
                      Batch: {selectedMedicine.batchNo}
                    </Text>
                  )}
                  <Text style={styles.selectedMedicineDetail}>
                    Available Stock: {selectedMedicine.quantity}{" "}
                    {selectedMedicine.medicineType === "Tablet"
                      ? "tablets"
                      : "units"}
                  </Text>
                  <Text style={styles.selectedMedicineDetail}>
                    MRP: ₹{selectedMedicine.mrp}
                  </Text>
                  <Text
                    style={[
                      styles.selectedMedicineDetail,
                      {
                        fontWeight: "600",
                        color:
                          textColorMap[
                            expiryStatus(selectedMedicine.expiryDate)
                          ],
                      },
                    ]}
                  >
                    Expiry: {formatDate(selectedMedicine.expiryDate)}
                  </Text>
                </View>
              )}

              {selectedMedicine && (
                <FormField
                  label={getQuantityLabel(selectedMedicine.medicineType)}
                  required
                  error={errors.saleQuantity?.message}
                >
                  <Controller
                    control={control}
                    name="saleQuantity"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.saleQuantity && styles.inputError,
                        ]}
                        keyboardType="number-pad"
                        onChangeText={(text) =>
                          field.onChange(text === "" ? undefined : Number(text))
                        }
                        onBlur={field.onBlur}
                        value={
                          field.value !== undefined ? String(field.value) : ""
                        }
                        placeholder={getQuantityPlaceholder(
                          selectedMedicine.medicineType
                        )}
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                  {selectedMedicine.medicineType === "Tablet" && (
                    <Text style={styles.helperText}>
                      Available: {selectedMedicine.quantity} tablets (
                      {Math.floor(
                        selectedMedicine.quantity /
                          selectedMedicine.unitPerPackage
                      )}{" "}
                      strips)
                    </Text>
                  )}
                </FormField>
              )}

              {selectedMedicine && watch("saleQuantity") && (
                <View style={styles.salesSummary}>
                  <Text style={styles.salesSummaryTitle}>Sale Summary:</Text>
                  <Text style={styles.salesSummaryItem}>
                    Quantity: {watch("saleQuantity")}{" "}
                    {selectedMedicine.medicineType.toLowerCase()}(s)
                  </Text>
                  <Text style={styles.salesSummaryItem}>
                    Unit Price: ₹{selectedMedicine.mrp}
                  </Text>
                  <Text style={styles.salesSummaryTotal}>
                    Total Amount: ₹
                    {(
                      (watch("saleQuantity") || 0) * selectedMedicine.mrp
                    ).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedMedicine || isSubmitting) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.8}
              disabled={!selectedMedicine || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Processing..." : "Add Sale"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Medicine Selection Modal */}
      <Modal
        visible={showMedicineDropdown}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMedicineDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Medicine</Text>
              <TouchableOpacity
                onPress={() => setShowMedicineDropdown(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search medicines..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <MaterialIcons
                name="search"
                size={24}
                color="#666"
                style={styles.searchIcon}
              />
            </View>

            <FlatList
              data={filteredMedicines}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <MedicineDropdownItem
                  item={item}
                  onSelect={selectMedicine}
                  formatDate={formatDate}
                  textColorMap={textColorMap}
                  expiryStatus={expiryStatus}
                />
              )}
              style={styles.medicineList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "No medicines found matching your search"
                    : "No medicines available"}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
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
  topbarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
    paddingRight: 40,
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
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#ffffff",
    minHeight: 52,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#1e293b",
    flex: 1,
  },
  placeholderText: {
    color: "#9ca3af",
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
  helperText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 4,
  },
  selectedMedicineInfo: {
    backgroundColor: "#f0f9ff71",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#8fb4c848",
  },
  selectedMedicineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0369a1",
    marginBottom: 8,
  },
  selectedMedicineDetail: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  expiryWarning: {
    color: "#dc2626",
    fontWeight: "600",
  },
  salesSummary: {
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
  },
  salesSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#15803d",
    marginBottom: 8,
  },
  salesSummaryItem: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  salesSummaryTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#15803d",
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#1e293b",
    minHeight: 52,
    paddingRight: 40,
  },
  searchIcon: {
    position: "absolute",
    right: 12,
  },
  medicineList: {
    maxHeight: 400,
  },
  dropdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 12,
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  dropdownItemType: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  dropdownItemBatch: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  dropdownItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dropdownItemStock: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "500",
  },
  dropdownItemExpiry: {
    fontSize: 14,
    color: "#6b7280",
  },
  dropdownItemPrice: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 16,
    paddingVertical: 20,
  },
});
