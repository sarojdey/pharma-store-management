import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
  Keyboard,
} from "react-native";

import { Drug } from "@/types";
import { addSale } from "@/utils/salesDb";
import { getAllDrugs, updateDrug } from "@/utils/stocksDb";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

const textColorMap: Record<string, string> = {
  expired: "rgb(212, 0, 0)",
  expiring: "rgb(228, 125, 0)",
  consumable: "#444",
};

export default function AddSale() {
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState<Drug[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Drug[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Drug | null>(null);
  const [saleQuantity, setSaleQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [medicineError, setMedicineError] = useState("");

  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (showMedicineDropdown) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [showMedicineDropdown, slideAnim]);

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
      const allDrugs = await getAllDrugs();
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

  const validateQuantity = (quantity: number, medicine: Drug) => {
    if (quantity > medicine.quantity) {
      return false;
    }
    return true;
  };

  const calculatePackagesNeeded = (quantity: number, medicine: Drug) => {
    if (medicine.medicineType === "Tablet") {
      return Math.ceil(quantity / medicine.unitPerPackage);
    }
    return quantity;
  };
  const handleQuantityChange = useCallback(
    (text: string) => {
      setSaleQuantity(text);

      if (quantityError) {
        setQuantityError("");
      }

      if (text.trim() === "") {
        return;
      }

      const quantity = Number(text);
      if (isNaN(quantity) || quantity <= 0) {
        setQuantityError("Please enter a valid quantity");
        return;
      }

      if (selectedMedicine && quantity > selectedMedicine.quantity) {
        setQuantityError(
          `Only ${
            selectedMedicine.quantity
          } ${selectedMedicine.medicineType.toLowerCase()}(s) available in stock`
        );
        return;
      }
    },
    [quantityError, selectedMedicine]
  );
  const validateForm = () => {
    let isValid = true;

    // Clear previous errors
    setMedicineError("");
    setQuantityError("");

    if (!selectedMedicine) {
      setMedicineError("Please select a medicine");
      isValid = false;
    }

    if (
      !saleQuantity ||
      isNaN(Number(saleQuantity)) ||
      Number(saleQuantity) <= 0
    ) {
      setQuantityError("Please enter a valid quantity");
      isValid = false;
    }

    if (
      selectedMedicine &&
      saleQuantity &&
      Number(saleQuantity) > selectedMedicine.quantity
    ) {
      setQuantityError(
        `Only ${
          selectedMedicine.quantity
        } ${selectedMedicine.medicineType.toLowerCase()}(s) available in stock`
      );
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const saleQuantityNum = Number(saleQuantity);

      if (!selectedMedicine) {
        Alert.alert("Error", "Please select a medicine");
        setIsSubmitting(false);
        return;
      }

      if (!validateQuantity(saleQuantityNum, selectedMedicine)) {
        Alert.alert(
          "Insufficient Stock",
          `Only ${
            selectedMedicine.quantity
          } ${selectedMedicine.medicineType.toLowerCase()}(s) available in stock.`
        );
        setIsSubmitting(false);
        return;
      }

      const saleData = {
        medicineId: selectedMedicine.id,
        medicineName: selectedMedicine.medicineName,
        quantity: saleQuantityNum,
        unitPerPackage: selectedMedicine.unitPerPackage,
      };

      const saleResult = await addSale(saleData);

      if (saleResult.success) {
        const newQuantity = selectedMedicine.quantity - saleQuantityNum;
        const updateResult = await updateDrug(selectedMedicine.id, {
          quantity: newQuantity,
        });

        if (updateResult.success) {
          const totalAmount = saleQuantityNum * selectedMedicine.mrp;
          Alert.alert(
            "Sale Added Successfully",
            `Medicine: ${
              selectedMedicine.medicineName
            }\nQuantity: ${saleQuantityNum}\nTotal Amount: ₹${totalAmount.toFixed(
              2
            )}\nRemaining Stock: ${newQuantity}`,
            [
              {
                text: "OK",
                onPress: () => {
                  resetForm();
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

  const resetForm = () => {
    setSelectedMedicine(null);
    setSaleQuantity("");
    setQuantityError("");
    setMedicineError("");
    setSearchQuery("");
  };

  const selectMedicine = (medicine: Drug) => {
    setSelectedMedicine(medicine);
    setShowMedicineDropdown(false);
    setSearchQuery(medicine.medicineName);
    setMedicineError("");
    setSaleQuantity("");
    setQuantityError("");
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

  const MedicineDropdownItem = ({ item }: { item: Drug }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => selectMedicine(item)}
    >
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

  const isFormValid =
    selectedMedicine && saleQuantity && !quantityError && !medicineError;

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
        keyboardVerticalOffset={60}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
        >
          <View style={styles.container}>
            <View style={styles.formCard}>
              <FormField label="Select Medicine" required error={medicineError}>
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    medicineError && styles.inputError,
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
                  error={quantityError}
                >
                  <TextInput
                    style={[styles.input, quantityError && styles.inputError]}
                    keyboardType="number-pad"
                    value={saleQuantity}
                    onChangeText={handleQuantityChange}
                    placeholder={getQuantityPlaceholder(
                      selectedMedicine.medicineType
                    )}
                    placeholderTextColor="#9ca3af"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (isFormValid) {
                        handleSubmit();
                      }
                    }}
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

              {selectedMedicine && saleQuantity && !quantityError && (
                <View style={styles.salesSummary}>
                  <Text style={styles.salesSummaryTitle}>Sale Summary:</Text>
                  <Text style={styles.salesSummaryItem}>
                    Quantity: {saleQuantity}{" "}
                    {selectedMedicine.medicineType.toLowerCase()}(s)
                  </Text>
                  <Text style={styles.salesSummaryItem}>
                    Unit Price: ₹{selectedMedicine.mrp}
                  </Text>
                  <Text style={styles.salesSummaryTotal}>
                    Total Amount: ₹
                    {(
                      (Number(saleQuantity) || 0) * selectedMedicine.mrp
                    ).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!isFormValid || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Processing..." : "Add Sale"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showMedicineDropdown}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowMedicineDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
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
              renderItem={({ item }) => <MedicineDropdownItem item={item} />}
              style={styles.medicineList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "No medicines found matching your search"
                    : "No medicines available"}
                </Text>
              }
            />
          </Animated.View>
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
    paddingBottom: 100,
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
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
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
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
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
  buttonContainer: {
    padding: 16,
  },
});
