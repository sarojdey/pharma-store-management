import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
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
            <View style={styles.headerSection}>
              <View style={styles.imageContainer}>
                <Image
                  source={require("../../assets/images/landing.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>No Stores Available</Text>

              <Text style={styles.subtitle}>
                Please create a store first to get started.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
              Welcome Back to{"\n"}
              <Text style={{ color: "rgba(65, 103, 168, 1)" }}>
                Medicine Stockist
              </Text>
            </Text>

            <Text style={styles.subtitle}>
              Select a store to continue with your inventory management.
            </Text>
          </View>

          {/* Stores List Section */}
          <View style={styles.formSection}>
            <FlatList
              data={allStores}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.storeItem,
                    loadingId !== null &&
                      loadingId !== item.id &&
                      styles.storeItemDisabled,
                  ]}
                  onPress={() => onSelect(item.id)}
                  disabled={loadingId !== null}
                  activeOpacity={0.8}
                >
                  <View style={styles.storeItemContent}>
                    <View style={styles.storeItemLeft}>
                      <View style={styles.iconContainer}>
                        <Ionicons
                          name="storefront"
                          size={22}
                          color="rgba(78, 122, 198, 1)"
                        />
                      </View>
                      <Text style={styles.storeItemText}>{item.name}</Text>
                    </View>

                    {loadingId === item.id ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator
                          color="rgba(65, 103, 168, 1)"
                          size="small"
                        />
                        <Text
                          style={[
                            styles.selectText,
                            { marginLeft: 8, color: "rgba(65, 103, 168, 1)" },
                          ]}
                        >
                          Loading...
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Ionicons
                          name="arrow-forward-circle"
                          size={20}
                          color="rgba(65, 103, 168, 1)"
                        />
                        <Text style={[styles.selectText, { marginLeft: 8 }]}>
                          Select
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
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
  storeItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb4b",
    elevation: 1,
  },
  storeItemDisabled: {
    backgroundColor: "#f9fafb",
    opacity: 0.6,
  },
  storeItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storeItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  storeItemText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
    flex: 1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  selectText: {
    color: "rgba(65, 103, 168, 1)",
    fontSize: 16,
    fontWeight: "600",
  },
});
