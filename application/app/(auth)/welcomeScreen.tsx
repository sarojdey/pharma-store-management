import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addStore } from "@/utils/storesDb";
import { useStore } from "@/contexts/StoreContext";

const STORAGE_KEY = "activeStoreId";

export default function WelcomeScreen() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { setCurrentStore, addStoreToContext } = useStore();

  const onCreate = async () => {
    if (!name.trim()) {
      return Alert.alert("Validation", "Store name cannot be empty");
    }
    setBusy(true);
    try {
      const { success, id } = await addStore({ name: name.trim() });
      if (!success || id == null) throw new Error("Failed to insert store");

      // Create the store object
      const newStore = {
        id,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };

      // Persist and update context
      await AsyncStorage.setItem(STORAGE_KEY, id.toString());

      // Update both current store and add to allStores
      setCurrentStore(newStore);
      addStoreToContext(newStore);

      router.replace("/"); // jump to home
    } catch (err: any) {
      console.error("Create store error:", err);
      Alert.alert("Error", err.message || "Could not create store");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Header Section with Image */}
          <View style={styles.headerSection}>
            <View style={styles.imageContainer}>
              <Image
                source={require("../../assets/images/landing.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>
              Welcome to{"\n"}
              <Text style={{ color: "rgba(65, 103, 168, 1)" }}>
                Medicine Stockist
              </Text>
            </Text>

            <Text style={styles.subtitle}>
              Let's set up your first store to get rolling.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="storefront"
                    size={22}
                    color="rgba(78, 122, 198, 1)"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your store name"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  editable={!busy}
                  returnKeyType="done"
                  onSubmitEditing={onCreate}
                  autoCorrect={false}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (busy || !name.trim()) && styles.buttonDisabled,
              ]}
              onPress={onCreate}
              disabled={busy || !name.trim()}
              activeOpacity={0.8}
            >
              {busy ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    Creating...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    Create Store
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    minHeight: "100%",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    textAlign: "center",
    color: "#374151",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formSection: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#e5e7eb4b",
    elevation: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "rgba(65, 103, 168, 1)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
  },
  buttonDisabled: {
    backgroundColor: "#6f88b5ff",
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
