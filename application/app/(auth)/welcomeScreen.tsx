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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Welcome 👋</Text>
        <Text style={styles.subtitle}>
          Let's set up your first store to get rolling.
        </Text>

        <View style={styles.inputRow}>
          <Ionicons name="storefront" size={20} color="#4a90e2" />
          <TextInput
            style={styles.input}
            placeholder="Store Name"
            value={name}
            onChangeText={setName}
            editable={!busy}
            returnKeyType="done"
            onSubmitEditing={onCreate}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (busy || !name.trim()) && styles.buttonDisabled,
          ]}
          onPress={onCreate}
          disabled={busy || !name.trim()}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Store</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4a90e2",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
