import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getDrugById } from "@/utils/dbActions";
import DrugBanner from "@/components/DrugBanner";

interface Drug {
  id: number;
  medicineName: string;
  idCode: string;
  price: number;
  mrp: number;
  quantity: number;
  expiryDate: string;
  medicineType: string;
  batchNo?: string | null;
  distributorName?: string | null;
  purchaseInvoiceNumber?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const MedicineDetails = () => {
  const { id } = useLocalSearchParams();
  const [drug, setDrug] = useState<Drug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    { label: "ID Code", value: drug.idCode },
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
    <ScrollView style={styles.container}>
      <View
        style={[
          styles.imageContainer,
          isExpired
            ? styles.expiredContainer
            : isExpiringSoon
            ? styles.expiringSoonContainer
            : isOutOfStock
            ? styles.outOfStockContainer
            : {},
        ]}
      >
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
          <View key={index} style={styles.detailRow}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    backgroundColor: "#FF8A65",
    margin: 16,
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
    position: "relative",
  },
  expiredContainer: {
    backgroundColor: "#ffcdd2",
  },
  expiringSoonContainer: {
    backgroundColor: "#fff3e0",
  },
  outOfStockContainer: {
    backgroundColor: "#f5f5f5",
  },
  medicineImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
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
    backgroundColor: "#d32f2f",
  },
  expiringSoonBadge: {
    backgroundColor: "#f57c00",
  },
  outOfStockBadge: {
    backgroundColor: "#616161",
  },
  lowStockBadge: {
    backgroundColor: "#ffa000",
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  detailsContainer: {
    backgroundColor: "white",
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
