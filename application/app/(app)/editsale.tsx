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

import { getSaleById, updateSale, deleteSale } from "@/utils/salesDb";
import { getAllDrugs, updateDrug, getDrugById } from "@/utils/stocksDb";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Drug, Sale } from "@/types";
import { useStore } from "@/contexts/StoreContext";
import { addHistory } from "@/utils/historyDb";
import TopBar from "@/components/TopBar";

const textColorMap: Record<string, string> = {
  expired: "rgb(212, 0, 0)",
  expiring: "rgb(228, 125, 0)",
  consumable: "rgba(0, 200, 67, 1)",
};
const textColorMapStock: Record<string, string> = {
  "out of stock": "rgb(212, 0, 0)",
  "low in stock": "rgb(228, 125, 0)",
  "in stock": "rgba(0, 174, 58, 1)",
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
  stockStatus: (
    quantity: number
  ) => "out of stock" | "low in stock" | "in stock";
  isLast: boolean;
};

const MedicineDropdownItem: React.FC<MedicineDropdownItemProps> = ({
  item,
  onSelect,
  formatDate,
  textColorMap,
  expiryStatus,
  stockStatus,
  isLast,
}) => (
  <TouchableOpacity
    style={[
      styles.dropdownItem,
      isLast ? { borderBottomWidth: 0 } : { borderBottomWidth: 1 },
    ]}
    onPress={() => onSelect(item)}
  >
    <View style={styles.dropdownItemContent}>
      <Text style={styles.dropdownItemName}>{item.medicineName}</Text>
      <Text style={styles.dropdownItemType}>{item.medicineType}</Text>
      {item.batchNo && (
        <Text style={styles.dropdownItemBatch}>Batch: {item.batchNo}</Text>
      )}
      <View style={styles.dropdownItemDetails}>
        <Text
          style={[
            styles.dropdownItemStock,
            {
              fontWeight: "600",
              color: textColorMapStock[stockStatus(item.quantity)],
            },
          ]}
        >
          Stock: {item.quantity}{" "}
          {item.medicineType === "Tablet" ? "tablet(s)" : "units"}
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

// Form schema for editing sales
const editSalesSchema = z.object({
  medicineId: z.number().int().positive("Please select a medicine"),
  saleQuantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than 0"),
});

type FormData = z.infer<typeof editSalesSchema>;

export default function EditSale() {
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState<Drug[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Drug[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [originalSale, setOriginalSale] = useState<Sale | null>(null);

  // Separate state for selected medicine (UI display only)
  const [selectedMedicine, setSelectedMedicine] = useState<Drug | null>(null);

  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentStore } = useStore();

  const { saleId } = params;
  const parsedSaleId = Array.isArray(saleId)
    ? Number(saleId[0])
    : Number(saleId);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(editSalesSchema),
    defaultValues: {
      medicineId: 0,
      saleQuantity: 0,
    },
  });

  const saleQuantity = watch("saleQuantity");

  useEffect(() => {
    loadSaleData();
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

  const loadSaleData = async () => {
    try {
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }

      const saleData = await getSaleById(parsedSaleId, currentStore.id);

      if (!saleData) {
        Alert.alert("Error", "Sale not found.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      const sale = saleData as Sale;
      setOriginalSale(sale);

      // Load the medicine data for this sale
      const medicineData = await getDrugById(sale.medicineId, currentStore.id);
      if (medicineData) {
        setSelectedMedicine(medicineData);
        setSearchQuery(medicineData.medicineName);
      }

      setValue("medicineId", sale.medicineId);
      setValue("saleQuantity", sale.quantity);
    } catch (error) {
      console.error("Error loading sale data:", error);
      Alert.alert("Error", "Failed to load sale data");
    }
  };

  const loadMedicines = async () => {
    try {
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }
      const allDrugs = await getAllDrugs(currentStore?.id);
      const typedDrugs = allDrugs as Drug[];
      // Include all medicines (even those with 0 stock) for editing purposes
      setMedicines(typedDrugs);
      setFilteredMedicines(typedDrugs);
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

  // Validation function for edit
  const validateEditSaleQuantity = (
    quantity: number,
    medicine: Drug | null,
    originalQuantity: number
  ) => {
    if (!medicine) {
      return { isValid: false, error: "Please select a medicine first" };
    }

    if (quantity <= 0) {
      return { isValid: false, error: "Quantity must be greater than 0" };
    }

    if (!Number.isInteger(quantity)) {
      return { isValid: false, error: "Quantity must be a whole number" };
    }

    // If same medicine, check if we have enough stock considering the original sale
    if (originalSale && medicine.id === originalSale.medicineId) {
      const availableStock = medicine.quantity + originalQuantity; // Add back original quantity
      if (quantity > availableStock) {
        return {
          isValid: false,
          error: `Only ${availableStock} ${medicine.medicineType.toLowerCase()}(s) available in stock (including original sale)`,
        };
      }
    } else {
      // Different medicine, check current stock
      if (quantity > medicine.quantity) {
        return {
          isValid: false,
          error: `Only ${
            medicine.quantity
          } ${medicine.medicineType.toLowerCase()}(s) available in stock`,
        };
      }
    }

    return { isValid: true };
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const { medicineId, saleQuantity } = data;

      if (!originalSale || !selectedMedicine) {
        Alert.alert(
          "Error",
          "Original sale data or selected medicine not found"
        );
        setIsSubmitting(false);
        return;
      }

      // Validate with selected medicine
      const validationResult = validateEditSaleQuantity(
        saleQuantity,
        selectedMedicine,
        originalSale.quantity
      );
      if (!validationResult.isValid) {
        Alert.alert("Validation Error", validationResult.error);
        setIsSubmitting(false);
        return;
      }

      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        setIsSubmitting(false);
        return;
      }

      // Calculate stock adjustments
      const isSameMedicine = originalSale.medicineId === medicineId;
      const quantityDifference = saleQuantity - originalSale.quantity;

      // Update stock quantities
      if (isSameMedicine) {
        // Same medicine, just adjust the difference
        if (quantityDifference !== 0) {
          const newQuantity = selectedMedicine.quantity - quantityDifference;
          await updateDrug(
            medicineId,
            { quantity: newQuantity },
            currentStore.id
          );
        }
      } else {
        // Different medicine, restore old and deduct from new
        // Restore quantity to original medicine
        const originalMedicine = await getDrugById(
          originalSale.medicineId,
          currentStore.id
        );
        if (originalMedicine) {
          const restoredQuantity =
            originalMedicine.quantity + originalSale.quantity;
          await updateDrug(
            originalSale.medicineId,
            { quantity: restoredQuantity },
            currentStore.id
          );
        }

        // Deduct quantity from new medicine
        const newQuantity = selectedMedicine.quantity - saleQuantity;
        await updateDrug(
          medicineId,
          { quantity: newQuantity },
          currentStore.id
        );
      }

      // Calculate unit price for the new medicine
      const unitPrice = selectedMedicine.mrp / selectedMedicine.unitPerPackage;

      // Update sale record
      const updateData = {
        medicineId: selectedMedicine.id,
        medicineName: selectedMedicine.medicineName,
        quantity: saleQuantity,
        unitPerPackage: selectedMedicine.unitPerPackage,
        price: selectedMedicine.price,
        mrp: selectedMedicine.mrp,
      };

      const updateResult = await updateSale(
        parsedSaleId,
        updateData,
        currentStore.id
      );

      if (updateResult.success) {
        await addHistory(
          {
            operation: `Sale updated - Medicine: ${updateData.medicineName}, Sale ID: ${parsedSaleId}, New Quantity: ${updateData.quantity}`,
          },
          currentStore?.id
        );

        const totalAmount = saleQuantity * unitPrice;

        Alert.alert(
          "Sale Updated Successfully",
          `Medicine: ${
            selectedMedicine.medicineName
          }\nNew Quantity: ${saleQuantity}\nNew Total Amount: ₹${totalAmount.toFixed(
            2
          )}`,
          [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to update sale record");
      }
    } catch (error) {
      console.error("Error submitting sale:", error);
      Alert.alert("Error", "An error occurred while updating the sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!originalSale) return;

    Alert.alert(
      "Delete Sale",
      `Are you sure you want to delete this sale record?\n\nMedicine: ${originalSale.medicineName}\nQuantity: ${originalSale.quantity}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete & Restore Stock",
          onPress: () => confirmDelete(true),
        },
        {
          text: "Delete Only",
          style: "destructive",
          onPress: () => confirmDelete(false),
        },
      ]
    );
  };

  const confirmDelete = async (restoreStock: boolean) => {
    setIsDeleting(true);

    try {
      if (!originalSale || !currentStore?.id) {
        Alert.alert("Error", "Original sale data or store not found.");
        return;
      }

      // Restore stock if requested and medicine still exists
      if (restoreStock) {
        const originalMedicine = await getDrugById(
          originalSale.medicineId,
          currentStore.id
        );
        if (originalMedicine) {
          const restoredQuantity =
            originalMedicine.quantity + originalSale.quantity;
          await updateDrug(
            originalSale.medicineId,
            { quantity: restoredQuantity },
            currentStore.id
          );
        }
      }

      // Delete sale record
      const result = await deleteSale(parsedSaleId, currentStore.id);

      if (result.success) {
        await addHistory(
          {
            operation: `Sale deleted - Medicine: ${
              originalSale.medicineName
            }, Sale ID: ${parsedSaleId}${
              restoreStock ? ", Stock restored" : ""
            }`,
          },
          currentStore?.id
        );

        Alert.alert(
          "Sale Deleted",
          restoreStock
            ? `Sale record deleted and stock restored for ${originalSale.medicineName}`
            : `Sale record deleted for ${originalSale.medicineName}`,
          [
            {
              text: "OK",
              onPress: () => router.replace("/(app)/sales"),
            },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to delete sale record");
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      Alert.alert("Error", "An error occurred while deleting the sale");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectMedicine = (medicine: Drug) => {
    // Update both form state and UI state
    setValue("medicineId", medicine.id);
    setSelectedMedicine(medicine);
    setShowMedicineDropdown(false);
    setSearchQuery(medicine.medicineName);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const expiryStatus = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) return "expired";
    if (diffDays <= 30) return "expiring";
    return "consumable";
  };

  const stockStatus = (quantity: number) => {
    return quantity === 0
      ? "out of stock"
      : quantity <= 30
      ? "low in stock"
      : "in stock";
  };

  if (!originalSale) {
    return (
      <View style={styles.wrapper}>
        <TopBar title="Edit Sale" />
        <View style={styles.loadingContainer}>
          <Text>Loading sale data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <TopBar title="Edit Sale" />

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
              {/* Original Sale Info */}
              <View style={styles.originalSaleInfo}>
                <Text style={styles.originalSaleTitle}>
                  Original Sale Details:
                </Text>
                <Text style={styles.originalSaleDetail}>
                  Medicine: {originalSale.medicineName}
                </Text>
                <Text style={styles.originalSaleDetail}>
                  Quantity: {originalSale.quantity}
                </Text>
                <Text style={styles.originalSaleDetail}>
                  Total Amount: ₹
                  {(
                    (originalSale.mrp / originalSale.unitPerPackage) *
                    originalSale.quantity
                  ).toFixed(2)}
                </Text>
                <Text style={styles.originalSaleDetail}>
                  Sale Date: {formatDate(originalSale.createdAt)}
                </Text>
              </View>

              <FormField
                label="Select Medicine"
                required
                error={errors.medicineId?.message}
              >
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    errors.medicineId && styles.inputError,
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
                    Current Stock: {selectedMedicine.quantity}{" "}
                    {selectedMedicine.medicineType === "Tablet"
                      ? "tablet(s)"
                      : "units"}
                    {originalSale.medicineId === selectedMedicine.id &&
                      ` (+${originalSale.quantity} from original sale)`}
                  </Text>
                  <Text style={styles.selectedMedicineDetail}>
                    Package MRP: ₹{selectedMedicine.mrp} (
                    {selectedMedicine.unitPerPackage} units)
                  </Text>
                  <Text style={styles.selectedMedicineDetail}>
                    Unit Price: ₹
                    {(
                      selectedMedicine.mrp / selectedMedicine.unitPerPackage
                    ).toFixed(2)}
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
                          field.onChange(text === "" ? 0 : Number(text))
                        }
                        onBlur={field.onBlur}
                        value={field.value > 0 ? String(field.value) : ""}
                        placeholder={getQuantityPlaceholder(
                          selectedMedicine.medicineType
                        )}
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                  <Text style={styles.helperText}>
                    Available: {selectedMedicine.quantity}
                    {originalSale.medicineId === selectedMedicine.id &&
                      ` (+${originalSale.quantity} from original sale)`}{" "}
                    {selectedMedicine.medicineType.toLowerCase()}(s)
                  </Text>
                </FormField>
              )}

              {selectedMedicine && saleQuantity > 0 && (
                <View style={styles.salesSummary}>
                  <Text style={styles.salesSummaryTitle}>
                    Updated Sale Summary:
                  </Text>
                  <Text style={styles.salesSummaryItem}>
                    Quantity: {saleQuantity}{" "}
                    {selectedMedicine.medicineType.toLowerCase()}(s)
                  </Text>
                  <Text style={styles.salesSummaryItem}>
                    Unit Price: ₹
                    {(
                      selectedMedicine.mrp / selectedMedicine.unitPerPackage
                    ).toFixed(2)}
                  </Text>
                  <Text style={styles.salesSummaryTotal}>
                    New Total Amount: ₹
                    {(
                      saleQuantity *
                      (selectedMedicine.mrp / selectedMedicine.unitPerPackage)
                    ).toFixed(2)}
                  </Text>
                  {originalSale && (
                    <Text style={styles.salesSummaryItem}>
                      Original Amount: ₹
                      {(
                        (originalSale.mrp / originalSale.unitPerPackage) *
                        originalSale.quantity
                      ).toFixed(2)}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Button Row */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  isDeleting && styles.deleteButtonDisabled,
                ]}
                onPress={handleDelete}
                activeOpacity={0.8}
                disabled={isDeleting || isSubmitting}
              >
                <Text style={styles.deleteButtonText}>
                  {isDeleting ? "Deleting..." : "Delete Sale"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedMedicine || isSubmitting || saleQuantity <= 0) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={
                  !selectedMedicine ||
                  isSubmitting ||
                  saleQuantity <= 0 ||
                  isDeleting
                }
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? "Updating..." : "Update Sale"}
                </Text>
              </TouchableOpacity>
            </View>
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
              renderItem={({ item, index }) => (
                <MedicineDropdownItem
                  item={item}
                  onSelect={selectMedicine}
                  formatDate={formatDate}
                  textColorMap={textColorMap}
                  expiryStatus={expiryStatus}
                  stockStatus={stockStatus}
                  isLast={index === filteredMedicines.length - 1}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  originalSaleInfo: {
    backgroundColor: "#fff7ed",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  originalSaleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c2410c",
    marginBottom: 8,
  },
  originalSaleDetail: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
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
  salesSummary: {
    backgroundColor: "#d5ffe241",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#8fc8ac48",
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  submitButton: {
    flex: 1,
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
  deleteButton: {
    flex: 1,
    backgroundColor: "rgba(254, 226, 226, 0.8)",
    borderWidth: 1,
    borderColor: "rgb(248, 113, 113)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "rgb(220, 38, 38)",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonDisabled: {
    opacity: 0.6,
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
  },
  dropdownItemType: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 10,
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
