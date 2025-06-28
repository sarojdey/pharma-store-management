import DrugBanner from "@/components/DrugBanner";
import { Drug } from "@/types";
import { getDrugById } from "@/utils/stocksDb";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MedicineDetails = () => {
  const { id } = useLocalSearchParams();
  const [drug, setDrug] = useState<Drug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchDrug = async () => {
      if (!id) {
        setError("No drug ID provided");
        setLoading(false);
        return;
      }

      try {
        const drugData = await getDrugById(Number(id));
        if (drugData) {
          setDrug(drugData as Drug);
        } else {
          setError("Drug not found");
        }
      } catch (err) {
        setError("Failed to fetch drug details");
        console.error("Error fetching drug:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrug();
  }, [id]);

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8A65" />
        <Text style={styles.loadingText}>Loading medicine details...</Text>
      </View>
    );
  }

  if (error || !drug) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Drug not found"}</Text>
      </View>
    );
  }

  const medicineData = [
    { label: "Medicine Name", value: drug.medicineName },
    { label: "Medicine Type", value: drug.medicineType },
    { label: "ID", value: drug.id.toString() },
    { label: "Batch ID", value: drug.batchNo },
    { label: "Price", value: formatPrice(drug.price) },
    { label: "MRP", value: formatPrice(drug.mrp) },
    { label: "Quantity", value: drug.quantity.toString() },
    { label: "Expiry Date", value: formatDate(drug.expiryDate) },
    { label: "Batch Number", value: drug.batchNo || "N/A" },
    { label: "Distributor Name", value: drug.distributorName || "N/A" },
    {
      label: "Purchase Invoice Number",
      value: drug.purchaseInvoiceNumber || "N/A",
    },
  ];

  const currentDate = new Date();
  const expiryDate = new Date(drug.expiryDate);
  const isExpired = expiryDate < currentDate;
  const daysLeft = Math.ceil(
    (expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;

  const isOutOfStock = drug.quantity === 0;
  const isLowStock = drug.quantity > 0 && drug.quantity <= 10;

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
            maxWidth: "70%",
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {drug.medicineName}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="form" size={22} color="#333" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>
        <View style={[styles.imageContainer]}>
          <DrugBanner
            drugName={drug.medicineName}
            drugType={drug.medicineType}
          ></DrugBanner>

          {(isExpired || isExpiringSoon || isOutOfStock || isLowStock) && (
            <View
              style={[
                styles.statusBadge,
                isExpired
                  ? styles.expiredBadge
                  : isExpiringSoon
                  ? styles.expiringSoonBadge
                  : isOutOfStock
                  ? styles.outOfStockBadge
                  : styles.lowStockBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {isExpired
                  ? "EXPIRED"
                  : isExpiringSoon
                  ? "EXPIRING SOON"
                  : isOutOfStock
                  ? "OUT OF STOCK"
                  : "LOW STOCK"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          {medicineData.map((item, index) => (
            <View
              key={index}
              style={[
                styles.detailRow,
                medicineData.length - 1 != index
                  ? { borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }
                  : {},
              ]}
            >
              <Text style={styles.label}>{item.label}</Text>
              <Text
                style={[
                  styles.value,
                  item.label === "Quantity" && isOutOfStock
                    ? styles.outOfStockText
                    : item.label === "Quantity" && isLowStock
                    ? styles.lowStockText
                    : item.label === "Expiry Date" && isExpired
                    ? styles.expiredText
                    : item.label === "Expiry Date" && isExpiringSoon
                    ? styles.expiringSoonText
                    : {},
                ]}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: "relative" },
  container: {
    flex: 1,
    padding: 18,
    marginTop: 60,
  },
  topbar: {
    position: "absolute",
    top: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderBottomColor: "#ccc",
    borderTopColor: "#ccc",
    paddingHorizontal: 18,
    paddingVertical: 16,
    zIndex: 1000,
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#d32f2f",
    textAlign: "center",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
    position: "relative",
  },

  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  expiredBadge: {
    backgroundColor: "rgb(169, 20, 20)",
  },
  expiringSoonBadge: {
    backgroundColor: "rgb(188, 92, 14)",
  },
  outOfStockBadge: {
    backgroundColor: "rgb(169, 20, 20)",
  },
  lowStockBadge: {
    backgroundColor: "rgb(188, 92, 14)",
  },
  statusText: {
    color: "#fafafa",
    fontSize: 10,
    fontWeight: "bold",
  },
  detailsContainer: {
    backgroundColor: "#fcfcfc",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: 30,
    marginBottom: 40,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  label: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  expiredText: {
    color: "#d32f2f",
  },
  expiringSoonText: {
    color: "#f57c00",
  },
  outOfStockText: {
    color: "#d32f2f",
  },
  lowStockText: {
    color: "#ffa000",
  },
});

export default MedicineDetails;
