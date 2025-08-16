import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation, useLocalSearchParams, useRouter } from "expo-router";
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
import { getStoreById, updateStore, deleteStore } from "@/utils/storesDb";
import { useStore } from "@/contexts/StoreContext";
import { addHistory } from "@/utils/historyDb";

const schema = z.object({
  storeName: z.string().min(1, "Store name is required").trim(),
});

export default function EditStore() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentStoreName, setCurrentStoreName] = useState("");
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentStore, refreshAllStores, allStores, setCurrentStore } =
    useStore();

  const { storeId } = params;
  const parsedStoreId = Array.isArray(storeId)
    ? Number(storeId[0])
    : Number(storeId);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: "",
    },
  });

  useEffect(() => {
    const loadStoreData = async () => {
      try {
        if (!parsedStoreId || isNaN(parsedStoreId)) {
          Alert.alert("Error", "Invalid store ID.", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
          return;
        }

        const storeData = await getStoreById(parsedStoreId);

        if (!storeData) {
          Alert.alert("Error", "Store not found.", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
          return;
        }

        setValue("storeName", storeData.name);
        setCurrentStoreName(storeData.name);
      } catch (error) {
        console.error("Error loading store data:", error);
        Alert.alert("Error", "Failed to load store data");
      }
    };

    if (parsedStoreId) {
      loadStoreData();
    }
  }, [parsedStoreId, setValue, navigation]);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);

    try {
      const result = await updateStore(parsedStoreId, {
        name: data.storeName,
      });

      if (result.success) {
        if (currentStore?.id == null) {
          Alert.alert("Error", "No store selected.");
          return;
        }
        await addHistory(
          {
            operation: `Store updated - Store: ${data.storeName}, Store ID: ${parsedStoreId}`,
          },
          currentStore.id
        );

        await refreshAllStores();

        if (currentStore.id === parsedStoreId) {
          const updatedStore = { ...currentStore, name: data.storeName };
          setCurrentStore(updatedStore);
        }

        Alert.alert("Success", "Store updated successfully!", [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to update store");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Alert.alert("Error", "An error occurred while updating the store");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (allStores.length <= 1) {
      Alert.alert(
        "Cannot Delete Store",
        "You cannot delete the last remaining store. At least one store is required."
      );
      return;
    }

    Alert.alert(
      "Delete Store",
      `Are you sure you want to delete "${currentStoreName}"? This action cannot be undone and will delete all data associated with this store.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteStore(parsedStoreId);

      if (result.success) {
        if (currentStore?.id == null) {
          Alert.alert("Error", "No store selected.");
          return;
        }
        await addHistory(
          {
            operation: `Store deleted - Store: ${currentStoreName}, Store ID: ${parsedStoreId}`,
          },
          currentStore?.id
        );

        if (currentStore?.id === parsedStoreId) {
          const remainingStores = allStores.filter(
            (store) => store.id !== parsedStoreId
          );
          if (remainingStores.length > 0) {
            setCurrentStore(remainingStores[0]);
          }
        }

        await refreshAllStores();

        Alert.alert("Success", "Store deleted successfully!", [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(app)");
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to delete store");
      }
    } catch (error) {
      console.error("Error deleting store:", error);
      Alert.alert("Error", "An error occurred while deleting the store");
    } finally {
      setIsDeleting(false);
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
          Edit Store
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
                label="Store Name"
                required
                error={errors.storeName?.message}
              >
                <Controller
                  control={control}
                  name="storeName"
                  render={({ field }) => (
                    <TextInput
                      style={[
                        styles.input,
                        errors.storeName && styles.inputError,
                      ]}
                      onChangeText={field.onChange}
                      value={field.value}
                      placeholder="e.g., Main Store"
                      placeholderTextColor="#9ca3af"
                    />
                  )}
                />
              </FormField>
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
                  {isDeleting ? "Deleting..." : "Delete Store"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={isSubmitting || isDeleting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
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
  error: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 6,
    fontWeight: "500",
  },
});
