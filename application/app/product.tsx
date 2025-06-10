import React from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";

const MedicineDetails = () => {
  const medicineData = [
    { label: "Medicine Name", value: "Amoxicillin" },
    { label: "Medicine Type", value: "Antibiotic" },
    { label: "ID", value: "12345" },
    { label: "ID Code", value: "ABC-123" },
    { label: "Price", value: "$10.00" },
    { label: "MRP", value: "$15.00" },
    { label: "Quantity", value: "100" },
    { label: "Expiry Date", value: "2024-12-31" },
    { label: "Batch Number", value: "XYZ-789" },
    { label: "Distributor Name", value: "PharmaCorp" },
    { label: "Purchase Invoice Number", value: "INV-001" },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Medicine Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=400&fit=crop&crop=center",
          }}
          style={styles.medicineImage}
          resizeMode="cover"
        />
      </View>

      {/* Details Section */}
      <View style={styles.detailsContainer}>
        {medicineData.map((item, index) => (
          <View key={index} style={styles.detailRow}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
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
  imageContainer: {
    backgroundColor: "#FF8A65",
    margin: 16,
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  medicineImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
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
});

export default MedicineDetails;
