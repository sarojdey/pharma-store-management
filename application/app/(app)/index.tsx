import { useStore } from "@/contexts/StoreContext";
import { Store } from "@/types";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const SIDEBAR_WIDTH = screenWidth * 0.8;

const truncateStoreName = (name: string, maxLength: number = 20): string => {
  return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
};

const BUTTONS: {
  key: string;
  label: string;
  icon: any;
  navigateTo: any;
  description: string;
  bg: string;
  border: string;
  text: string;
}[] = [
  {
    key: "addStock",
    label: "Add to Stock",
    icon: "store",
    navigateTo: "/(app)/addstock",
    description: "Add a new batch of medicine to your inventory.",
    bg: "rgba(209, 253, 255, 0.1)",
    border: "rgba(109, 176, 171, 0.30)",
    text: "rgb(73, 147, 142)",
  },
  {
    key: "stock",
    label: "View All Stock",
    icon: "view-list",
    navigateTo: "/(app)/inventory",
    description: "See a list of all medicine batches in stock.",
    bg: "rgba(201, 231, 255, 0.1)",
    border: "rgba(97, 129, 155, 0.30)",
    text: "rgb(70, 125, 168)",
  },
  {
    key: "sales",
    label: "Sales",
    icon: "area-chart",
    navigateTo: "/(app)/sales",
    description: "See a list of all completed sales transactions.",
    bg: "rgba(236, 219, 255, 0.1)",
    border: "rgba(115, 98, 155, 0.3)",
    text: "rgb(122, 96, 176)",
  },
  {
    key: "orderLists",
    label: "Order Lists",
    icon: "shopping-cart",
    navigateTo: "/(app)/orderlist",
    description: "Create order lists and export them.",
    bg: "rgba(208, 255, 231, 0.1)",
    border: "rgba(85, 149, 117, 0.30)",
    text: "rgb(66, 160, 113)",
  },
  {
    key: "expiryAlerts",
    label: "Expiry Alerts",
    icon: "calendar-month",
    navigateTo: "/(app)/expiry",
    description: "Check which medicine batches are close to expiry.",
    bg: "rgba(255, 219, 219, 0.1)",
    border: "rgba(155, 98, 98, 0.30)",
    text: "rgb(178, 85, 85)",
  },
  {
    key: "lowStockAlerts",
    label: "Low Stock Alerts",
    icon: "move-to-inbox",
    navigateTo: "/(app)/outofstock",
    description: "Check medicines that need restocking.",
    bg: "rgba(255, 233, 219, 0.1)",
    border: "rgba(155, 115, 98, 0.3)",
    text: "rgb(181, 115, 74)",
  },
  {
    key: "history",
    label: "History",
    icon: "watch-later",
    navigateTo: "/(app)/history",
    description: "View a log of all actions like stock updates and sales.",
    bg: "rgba(255, 251, 219, 0.1)",
    border: "rgba(155, 151, 98, 0.3)",
    text: "rgb(153, 133, 52)",
  },
  {
    key: "suppliers",
    label: "Suppliers",
    icon: "people",
    navigateTo: "/(app)/suppliers",
    description: "List of suppliers and their corresponding details.",
    bg: "rgba(192, 198, 201, 0.1)",
    border: "rgba(125, 134, 139, 0.3)",
    text: "rgb(92, 112, 121)",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [switchingStore, setSwitchingStore] = useState<number | null>(null);

  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  const {
    currentStore,
    allStores,
    isReady,
    setCurrentStore,
    refreshAllStores,
  } = useStore();

  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const closeSidebar = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  }, [slideAnim]);

  const handleStoreSwitch = useCallback(
    async (selectedStore: Store) => {
      if (selectedStore.id === currentStore?.id) {
        closeSidebar();
        return;
      }

      try {
        setSwitchingStore(selectedStore.id!);
        await AsyncStorage.setItem(
          "activeStoreId",
          selectedStore.id!.toString()
        );
        setCurrentStore(selectedStore);
        closeSidebar();

        console.log(`Switched to store: ${selectedStore.name}`);
      } catch (error) {
        console.error("Error switching store:", error);
        Alert.alert("Error", "Failed to switch store. Please try again.");
      } finally {
        setSwitchingStore(null);
      }
    },
    [currentStore?.id, closeSidebar, setCurrentStore]
  );

  const handleMoreOptions = useCallback(() => {
    closeSidebar();
    router.push("/(app)/moreoptions");
  }, [closeSidebar, router]);

  const renderStoreItem = useCallback(
    (store: Store) => {
      const isCurrentStore = store.id === currentStore?.id;
      const isSwitching = switchingStore === store.id;

      return (
        <TouchableOpacity
          key={store.id}
          style={[styles.userItem, isCurrentStore && styles.currentUser]}
          activeOpacity={0.7}
          onPress={() => handleStoreSwitch(store)}
          disabled={switchingStore !== null}
        >
          <Ionicons
            name={isCurrentStore ? "storefront" : "storefront-outline"}
            size={26}
            color={isCurrentStore ? "#4167a8ff" : "#535353ff"}
          />
          <View style={styles.storeInfo}>
            <Text
              style={[
                styles.userName,
                isCurrentStore && styles.currentUserName,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {truncateStoreName(store.name)}
            </Text>
          </View>

          {isSwitching && <ActivityIndicator size="small" color="#4a90e2" />}
        </TouchableOpacity>
      );
    },
    [currentStore?.id, switchingStore, handleStoreSwitch]
  );

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading stores...</Text>
      </View>
    );
  }

  if (!currentStore) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No active store</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace("/(auth)/welcomeBackScreen")}
        >
          <Text style={styles.retryButtonText}>Select Store</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/applogo.png")}
              style={{ height: "100%", width: "100%" }}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.appTitle} numberOfLines={1} ellipsizeMode="tail">{truncateStoreName(currentStore.name)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={openSidebar}>
          <Feather name="menu" size={24} color="#535353ff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.grid, { marginBottom: 20 }]}>
          <TouchableOpacity
            style={styles.chartButton}
            activeOpacity={0.7}
            onPress={() => {
              router.push("/(app)/salesreport");
              console.log("Sales Report pressed");
            }}
          >
            <AntDesign name="linechart" size={24} style={styles.chartIcon} />
            <Text style={styles.chartLabel}>Sales Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chartButton}
            activeOpacity={0.7}
            onPress={() => {
              router.push("/(app)/stocksreport");
              console.log("Stock Report pressed");
            }}
          >
            <AntDesign name="profile" size={24} style={styles.chartIcon} />
            <Text style={styles.chartLabel}>Stock Report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {BUTTONS.map((btn) => (
            <TouchableOpacity
              onPress={() => router.push(btn.navigateTo)}
              key={btn.key}
              style={[
                styles.card,
                {
                  backgroundColor: btn.bg || "#fff",
                  borderColor: btn.border || "#ccc",
                },
              ]}
              activeOpacity={0.7}
            >
              <MaterialIcons name={btn.icon} size={55} color={btn.text} />
              <Text style={[styles.label, { color: btn.text || "#000" }]}>
                {btn.label}
              </Text>
              <Text style={[styles.description, { color: btn.text || "#000" }]}>
                {btn.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {sidebarVisible && (
        <>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeSidebar}
          />

          <Animated.View
            style={[
              styles.sidebar,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle} numberOfLines={1} ellipsizeMode="tail">{truncateStoreName(currentStore.name)}</Text>
              <TouchableOpacity
                onPress={closeSidebar}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={24} color="#535353ff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarContent}>
              <Text style={styles.sectionTitle}>
                Available Stores ({allStores.length})
              </Text>
              <View style={styles.userList}>
                {allStores.map(renderStoreItem)}
              </View>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity
                style={styles.moreOptionsButton}
                activeOpacity={0.7}
                onPress={handleMoreOptions}
              >
                <MaterialIcons name="more-vert" size={24} color="#4167a8ff" />
                <Text style={styles.moreOptionsText}>More Options</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ef4444",
    marginBottom: 8,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4a90e2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    position: "relative",
    top: 0,
    height: 70,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderBottomColor: "#c3c3c3a6",
    borderTopColor: "#c3c3c3a6",
    padding: 18,
    zIndex: 1000,
  },
  logoContainer: {
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  appTitle: {
    fontWeight: "600",
    fontSize: 20,
    color: "#535353ff",
  },

  chartButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#c3c3c3a6",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  chartLabel: {
    color: "#535353ff",
    fontWeight: "600",
  },
  chartIcon: {
    color: "#535353ff",
    marginRight: 8,
  },
  scrollContainer: {
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
    marginTop: 8,
  },
  description: {
    fontSize: 13,
    textAlign: "center",
    flexWrap: "wrap",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1500,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#f9f9f9",
    zIndex: 2000,
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeader: {
    height: 70,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#c3c3c3a6",
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#535353ff",
  },
  closeButton: {
    padding: 4,
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8b8b8bff",
    marginBottom: 15,
  },
  userList: {
    flex: 1,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  currentUser: {
    backgroundColor: "#d6e5ff35",
    borderWidth: 1,
    borderColor: "#50628240",
  },
  storeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    color: "#535353ff",
    fontWeight: "600",
  },
  currentUserName: {
    color: "#4167a8ff",
    fontWeight: "600",
  },
  activeIndicator: {
    marginLeft: 8,
  },
  sidebarFooter: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  moreOptionsButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#d6e5ff35",
    borderWidth: 1,
    borderColor: "#50628240",
  },
  moreOptionsText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#4167a8ff",
    fontWeight: "600",
  },
});
