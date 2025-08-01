import SupplierCard from "@/components/SupplierCard";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useNavigation, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Supplier } from "@/types";
import { getAllSuppliers, searchSuppliers } from "@/utils/supplierDb";
import Loader from "@/components/Loader";
import { useStore } from "@/contexts/StoreContext";

export default function Suppliers() {
  const navigation = useNavigation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const { currentStore } = useStore();
  const loadSuppliers = useCallback(async () => {
    try {
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }
      setLoading(true);
      const suppliersData = await getAllSuppliers(currentStore?.id);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(
    async (term: string) => {
      if (term.trim() === "") {
        await loadSuppliers();
        setIsSearching(false);
        return;
      }
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }

      try {
        setIsSearching(true);
        const searchResults = await searchSuppliers(
          term.trim(),
          currentStore?.id
        );
        setSuppliers(searchResults);
      } catch (error) {
        console.error("Error searching suppliers:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [loadSuppliers]
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchTerm(text);

      const timeoutId = setTimeout(() => {
        handleSearch(text);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [handleSearch]
  );

  useFocusEffect(
    useCallback(() => {
      loadSuppliers();
    }, [loadSuppliers])
  );

  const handleClearSearch = () => {
    setSearchTerm("");
    loadSuppliers();
  };

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-sharp" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search suppliers..."
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={handleSearchChange}
          />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleSearch(searchTerm)}
          >
            {isSearching ? (
              <ActivityIndicator size={24} color="rgb(70, 125, 168)" />
            ) : (
              <Ionicons
                name="search-outline"
                size={24}
                color="rgb(70, 125, 168)"
              />
            )}
          </TouchableOpacity>
          {searchTerm.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.add}
        onPress={() => router.push("/addSupplier")}
      >
        <MaterialIcons name="add" size={35} color="rgb(70, 125, 168)" />
      </TouchableOpacity>
      {loading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {suppliers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people" size={70} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchTerm ? "No suppliers found" : "No suppliers added yet"}
              </Text>
              <Text style={styles.emptySubText}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Add your first supplier"}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, width: "100%", gap: 14, marginTop: 70 }}>
              {suppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: "relative" },
  add: {
    display: "flex",
    position: "absolute",
    right: 30,
    bottom: 30,
    backgroundColor: "rgb(230, 244, 255)",
    borderRadius: 500,
    padding: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(70, 126, 168, 0.39)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 1000,
    gap: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    flex: 1,
    position: "relative",
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    color: "#000",
  },
  iconButton: {
    backgroundColor: "rgb(230, 244, 255)",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#ccc",
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    position: "absolute",
    right: 55,
    padding: 5,
  },
  scrollContainer: {
    minHeight: "100%",
    alignItems: "center",
    padding: 18,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
