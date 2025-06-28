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
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { z } from "zod";
import { addDrug } from "../utils/stocksDb";
import { addSupplier } from "@/utils/supplierDb";
import { addHistory } from "@/utils/historyDb";

const schema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  location: z.string().min(1, "Location is required"),
  phone: z
    .string()
    .min(10, "Phone number must be exactly 10 digits")
    .max(10, "Phone number must be exactly 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
});

export default function AddInventoryItem() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierName: "",
      location: "",
      phone: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);

    try {
      const supplierData = {
        supplierName: data.supplierName,
        location: data.location,
        phone: data.phone,
      };

      const result = await addSupplier(supplierData);

      if (result.success) {
        await addHistory({
          operation: `Added supplier: ${data.supplierName}`,
        });
        Alert.alert("Success", "Supplier added successfully!", [
          {
            text: "OK",
            onPress: () => reset(),
          },
        ]);
      } else {
        Alert.alert("Failed to add supplier");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Alert.alert("Error", "An error occurred while adding supplier");
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
          Add Supplier
        </Text>
      </View>
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
                  label="Supplier Name"
                  required
                  error={errors.supplierName?.message}
                >
                  <Controller
                    control={control}
                    name="supplierName"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.supplierName && styles.inputError,
                        ]}
                        onChangeText={field.onChange}
                        value={field.value}
                        placeholder="e.g., ABC Pharmaceuticals"
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Location"
                  required
                  error={errors.location?.message}
                >
                  <Controller
                    control={control}
                    name="location"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.location && styles.inputError,
                        ]}
                        onChangeText={field.onChange}
                        value={field.value}
                        placeholder="e.g., Mumbai, Maharashtra"
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Phone Number"
                  required
                  error={errors.phone?.message}
                >
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.phone && styles.inputError,
                        ]}
                        onChangeText={field.onChange}
                        value={field.value}
                        placeholder="e.g., 9876543210"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        maxLength={10}
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
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? "Adding..." : "Add Supplier"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#212121",
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#ef4444",
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
