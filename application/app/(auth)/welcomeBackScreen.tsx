import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useStore } from "@/contexts/StoreContext";

const STORAGE_KEY = "activeStoreId";

export default function WelcomeBackScreen() {
  const { allStores, setCurrentStore } = useStore();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const router = useRouter();

  const onSelect = async (id: number) => {
    setLoadingId(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, id.toString());
      const store = allStores.find((s) => s.id === id);
      if (!store) throw new Error("Store not found");
      setCurrentStore(store);
      router.replace("/");
    } catch (err: any) {
      console.error("Select store error:", err);
      Alert.alert("Error", err.message || "Could not select store");
    } finally {
      setLoadingId(null);
    }
  };

  if (allStores.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No stores available.</Text>
        <Text style={styles.emptySubtext}>Please create a store first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back 👋</Text>
      <Text style={styles.subtitle}>Select a store to continue</Text>

      <FlatList
        data={allStores}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingVertical: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => onSelect(item.id)}
            disabled={loadingId !== null}
          >
            <Text style={styles.itemText}>{item.name}</Text>
            {loadingId === item.id ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.select}>Select</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 28,
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
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  itemText: {
    fontSize: 16,
  },
  select: {
    color: "#4a90e2",
    fontWeight: "600",
  },
});
