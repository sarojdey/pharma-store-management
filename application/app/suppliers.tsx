import SupplierCard from "@/components/SupplierCard";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useNavigation } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Suppliers() {
  const navigation = useNavigation();
  return (
    <View style={{ flex: 1, position: "relative" }}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-sharp" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#666"
            style={styles.searchInput}
            // value={searchTerm}
            // onChangeText={setSearchTerm}
          />
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons
              name="search-outline"
              size={24}
              color="rgb(70, 125, 168)"
            />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.add}
        onPress={() => router.push("/addSupplier")}
      >
        <MaterialIcons name="add" size={35} color="rgb(70, 125, 168)" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <SupplierCard />
      </ScrollView>
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
  },
  scrollContainer: {
    minHeight: "100%",
    alignItems: "center",
    paddingTop: 90,
    padding: 18,
    gap: 14,
  },
});
