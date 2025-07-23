import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { Image, Animated } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Alert,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const SIDEBAR_WIDTH = screenWidth * 0.8;

interface Store {
  id: string;
  name: string;
  isActive: boolean;
  location?: string;
  manager?: string;
}

const MOCK_STORES: Store[] = [
  {
    id: "store_001",
    name: "Main Store",
    isActive: true,
    location: "Downtown",
    manager: "John Doe",
  },
  {
    id: "store_002",
    name: "North Branch",
    isActive: false,
    location: "North District",
    manager: "Jane Smith",
  },
  {
    id: "store_003",
    name: "South Branch",
    isActive: false,
    location: "South District",
    manager: "Mike Johnson",
  },
  {
    id: "store_004",
    name: "East Branch",
    isActive: false,
    location: "East District",
    manager: "Sarah Wilson",
  },
  {
    id: "store_005",
    name: "West Branch",
    isActive: false,
    location: "West District",
    manager: "Tom Brown",
  },
];

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
    navigateTo: "/addstock",
    description: "Add a new batch of medicine to your inventory.",
    bg: "rgba(209, 253, 255, 0.1)",
    border: "rgba(109, 176, 171, 0.30)",
    text: "rgb(73, 147, 142)",
  },
  {
    key: "stock",
    label: "View All Stock",
    icon: "view-list",
    navigateTo: "/inventory",
    description: "See a list of all medicine batches in stock.",
    bg: "rgba(201, 231, 255, 0.1)",
    border: "rgba(97, 129, 155, 0.30)",
    text: "rgb(70, 125, 168)",
  },
  {
    key: "sales",
    label: "Sales",
    icon: "area-chart",
    navigateTo: "/sales",
    description: "See a list of all completed sales transactions.",
    bg: "rgba(236, 219, 255, 0.1)",
    border: "rgba(115, 98, 155, 0.3)",
    text: "rgb(122, 96, 176)",
  },
  {
    key: "orderLists",
    label: "Order Lists",
    icon: "shopping-cart",
    navigateTo: "/orderlist",
    description: "Create order lists and export them.",
    bg: "rgba(208, 255, 231, 0.1)",
    border: "rgba(85, 149, 117, 0.30)",
    text: "rgb(66, 160, 113)",
  },
  {
    key: "expiryAlerts",
    label: "Expiry Alerts",
    icon: "calendar-month",
    navigateTo: "/expiry",
    description: "Check which medicine batches are close to expiry.",
    bg: "rgba(255, 219, 219, 0.1)",
    border: "rgba(155, 98, 98, 0.30)",
    text: "rgb(178, 85, 85)",
  },
  {
    key: "lowStockAlerts",
    label: "Low Stock Alerts",
    icon: "move-to-inbox",
    navigateTo: "/outofstock",
    description: "Check medicines that need restocking.",
    bg: "rgba(255, 233, 219, 0.1)",
    border: "rgba(155, 115, 98, 0.3)",
    text: "rgb(181, 115, 74)",
  },
  {
    key: "history",
    label: "History",
    icon: "watch-later",
    navigateTo: "/history",
    description: "View a log of all actions like stock updates and sales.",
    bg: "rgba(255, 251, 219, 0.1)",
    border: "rgba(155, 151, 98, 0.3)",
    text: "rgb(153, 133, 52)",
  },
  {
    key: "suppliers",
    label: "Suppliers",
    icon: "people",
    navigateTo: "/suppliers",
    description: "List of suppliers and their corresponding details.",
    bg: "rgba(192, 198, 201, 0.1)",
    border: "rgba(125, 134, 139, 0.3)",
    text: "rgb(92, 112, 121)",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(SIDEBAR_WIDTH));
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setStores(MOCK_STORES);
        const activeStore = MOCK_STORES.find((store) => store.isActive);
        setCurrentStore(activeStore || MOCK_STORES[0]);
      } catch (error) {
        console.error("Error fetching stores:", error);
        Alert.alert("Error", "Failed to load stores");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  const handleStoreSwitch = (selectedStore: Store) => {
    if (selectedStore.id === currentStore?.id) {
      closeSidebar();
      return;
    }
    const updatedStores = stores.map((store) => ({
      ...store,
      isActive: store.id === selectedStore.id,
    }));

    setStores(updatedStores);
    setCurrentStore(selectedStore);
    closeSidebar();

    console.log(`Switched to store: ${selectedStore.name}`);
  };

  const handleMoreOptions = () => {
    Alert.alert("Store Options", "Choose an option", [
      {
        text: "Add New Store",
        onPress: () => {
          console.log("Add new store pressed");
        },
      },
      {
        text: "Store Settings",
        onPress: () => {
          console.log("Store settings pressed");
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const renderStoreItem = (store: Store) => {
    const isCurrentStore = store.id === currentStore?.id;

    return (
      <TouchableOpacity
        key={store.id}
        style={[styles.userItem, isCurrentStore && styles.currentUser]}
        activeOpacity={0.7}
        onPress={() => handleStoreSwitch(store)}
      >
        <Ionicons
          name={isCurrentStore ? "storefront" : "storefront-outline"}
          size={30}
          color={isCurrentStore ? "#4a90e2" : "#666"}
        />
        <View style={styles.storeInfo}>
          <Text
            style={[styles.userName, isCurrentStore && styles.currentUserName]}
          >
            {store.name}
          </Text>
          {store.location && (
            <Text style={styles.storeLocation}>{store.location}</Text>
          )}
        </View>
        {isCurrentStore && (
          <View style={styles.activeIndicator}>
            <AntDesign name="check" size={16} color="#4a90e2" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading stores...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/capsule.png")}
              style={{ height: "100%", width: "100%" }}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.appTitle}>Medicine Stockist</Text>
          </View>
        </View>
        <TouchableOpacity onPress={openSidebar}>
          <Feather name="menu" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.grid, { marginBottom: 20 }]}>
          <TouchableOpacity style={styles.chartButton} activeOpacity={0.7}>
            <AntDesign name="linechart" size={24} style={styles.chartIcon} />
            <Text style={styles.chartLabel}>Sales Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chartButton} activeOpacity={0.7}>
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
              <Text style={styles.sidebarTitle}>Stores ({stores.length})</Text>
              <TouchableOpacity
                onPress={closeSidebar}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarContent}>
              <Text style={styles.sectionTitle}>Select Store</Text>
              <View style={styles.userList}>{stores.map(renderStoreItem)}</View>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity
                style={styles.moreOptionsButton}
                activeOpacity={0.7}
                onPress={handleMoreOptions}
              >
                <MaterialIcons name="more-vert" size={24} color="#666" />
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
  },
  header: {
    position: "relative",
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
    padding: 18,
    zIndex: 1000,
  },
  logoContainer: {
    height: 24,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  appTitle: {
    fontWeight: "500",
    fontSize: 18,
    color: "#212121",
  },

  chartButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  chartLabel: {
    color: "#212121",
    fontWeight: "500",
  },
  chartIcon: {
    color: "#212121",
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
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    marginTop: 8,
  },
  description: {
    fontSize: 12,
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
    backgroundColor: "#ffffff",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212121",
  },
  closeButton: {
    padding: 4,
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 20,
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userList: {
    flex: 1,
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
    backgroundColor: "rgba(74, 144, 226, 0.08)",
    borderColor: "rgba(74, 144, 226, 0.2)",
  },
  storeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "400",
  },
  currentUserName: {
    color: "#4a90e2",
    fontWeight: "500",
  },
  storeLocation: {
    fontSize: 12,
    color: "#888",
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
    backgroundColor: "#f8f9fa",
  },
  moreOptionsText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
});
