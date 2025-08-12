import { useStore } from "@/contexts/StoreContext";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Options Configuration
const MORE_OPTIONS = [
  {
    key: "storeSettings",
    title: "Store Settings",
    description: "Edit store information and preferences",
    icon: "settings",
    iconFamily: "MaterialIcons",
    color: "#4a90e2",
  },
  {
    key: "addStore",
    title: "Add New Store",
    description: "Create a new store location",
    icon: "storefront",
    iconFamily: "Ionicons",
    color: "#ff9800",
  },
  {
    key: "exportStore",
    title: "Export Store Data",
    description: "Export store data and reports",
    icon: "download",
    iconFamily: "Feather",
    color: "#9c27b0",
  },

  {
    key: "refreshStores",
    title: "Refresh Stores",
    description: "Reload all store data",
    icon: "refresh-cw",
    iconFamily: "Feather",
    color: "#4caf50",
  },
];

export default function MoreOptionsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { currentStore, refreshAllStores } = useStore();

  const refreshStores = useCallback(async () => {
    try {
      await refreshAllStores();
      console.log("Refreshed stores from context");
      Alert.alert("Success", "Stores refreshed successfully");
    } catch (error) {
      console.error("Error refreshing stores:", error);
      Alert.alert("Error", "Failed to refresh stores");
    }
  }, [refreshAllStores]);

  const handleOptionPress = useCallback(
    async (option: any) => {
      switch (option.key) {
        case "storeSettings":
          router.push(`/(app)/editstore?storeId=${currentStore?.id}`);
          break;
        case "addStore":
          router.push("/(app)/createnewstore");
          break;
        case "exportStore":
          router.push("/(app)/exportstore");
          break;

        case "refreshStores":
          await refreshStores();
          break;

        default:
          break;
      }
    },
    [router, currentStore?.id, refreshStores]
  );

  const renderIcon = useCallback((option: any) => {
    const IconComponent =
      option.iconFamily === "MaterialIcons"
        ? MaterialIcons
        : option.iconFamily === "Ionicons"
        ? Ionicons
        : Feather;

    return <IconComponent name={option.icon} size={24} color={option.color} />;
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-sharp" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>More Options</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.optionsList}>
            {MORE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.optionItem}
                activeOpacity={0.7}
                onPress={() => handleOptionPress(option)}
              >
                <View
                  style={[
                    styles.optionIconContainer,
                    { backgroundColor: `${option.color}15` },
                  ]}
                >
                  {renderIcon(option)}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderBottomColor: "#ccc",
    borderTopColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 16,
    gap: 10,
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
    paddingRight: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 18,
  },

  optionsList: {
    flex: 1,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: "#666",
  },
});
