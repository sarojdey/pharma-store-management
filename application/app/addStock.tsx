import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Schema using Zod
const schema = z.object({
  medicineName: z.string().min(1, "Medicine name is required"),
  idCode: z.string().min(1, "ID Code is required"),
  mrp: z.coerce.number().min(0, "MRP must be a valid number"),
  quantity: z.coerce.number().int().min(0, "Quantity must be a whole number"),
  batchNumber: z.string().optional(),
  supplier: z.string().optional(),
  expiryDate: z.date({ required_error: "Expiry Date is required" }),
});

export default function AddInventoryItem() {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      medicineName: "",
      idCode: "",
      mrp: 0,
      quantity: 0,
      batchNumber: "",
      supplier: "",
      expiryDate: new Date(),
    },
  });

  const expiryDate = watch("expiryDate");

  const onSubmit = (data: z.infer<typeof schema>) => {
    console.log("Form Submitted:", data);
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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Add New Inventory Item</Text>

      <Text style={styles.label}>Medicine Name</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setValue("medicineName", text)}
        placeholder="e.g., Remorinax Plus 600mg"
      />
      {errors.medicineName && (
        <Text style={styles.error}>{errors.medicineName.message}</Text>
      )}

      <Text style={styles.label}>ID Code</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setValue("idCode", text)}
        placeholder="e.g., 5260"
      />
      {errors.idCode && (
        <Text style={styles.error}>{errors.idCode.message}</Text>
      )}

      <Text style={styles.label}>Expiry Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>
          {expiryDate ? expiryDate.toLocaleDateString() : "Select Date"}
        </Text>
      </TouchableOpacity>
      {errors.expiryDate && (
        <Text style={styles.error}>{errors.expiryDate.message}</Text>
      )}
      {showDatePicker && (
        <DateTimePicker
          value={expiryDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <Text style={styles.label}>MRP (₹)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        onChangeText={(text) => setValue("mrp", Number(text))}
        placeholder="e.g., 22.75"
      />
      {errors.mrp && <Text style={styles.error}>{errors.mrp.message}</Text>}

      <Text style={styles.label}>In Stock (Quantity)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        onChangeText={(text) => setValue("quantity", Number(text))}
        placeholder="e.g., 65"
      />
      {errors.quantity && (
        <Text style={styles.error}>{errors.quantity.message}</Text>
      )}

      <Text style={styles.label}>Batch Number (Optional)</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setValue("batchNumber", text)}
        placeholder="e.g., BATCH123"
      />

      <Text style={styles.label}>Supplier (Optional)</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setValue("supplier", text)}
        placeholder="e.g., Pharma Distributor Inc."
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>➕ Add Item to Inventory</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: "#fff" },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1f2937",
  },
  label: { fontSize: 14, marginTop: 10, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    backgroundColor: "#f9fafb",
  },
  button: {
    backgroundColor: "#0ea5e9",
    marginTop: 20,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  error: { color: "red", fontSize: 12, marginTop: 4 },
});
