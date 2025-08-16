import Loader from "@/components/Loader";
import { searchSales } from "@/utils/salesDb";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { z } from "zod";
import { Sale } from "@/types";
import SaleCard from "@/components/SaleCard";
import { router } from "expo-router";
import { useStore } from "@/contexts/StoreContext";
import { useFocusEffect } from "@react-navigation/native";
import TopBar from "@/components/TopBar";

const SORT_OPTIONS: Record<string, string> = {
  medicineName: "Medicine Name",
  quantity: "Quantity",
  createdAt: "Date",
};

export default function SalesScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "id" | "medicineName" | "quantity" | "createdAt"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [tempSortBy, setTempSortBy] = useState<
    "id" | "medicineName" | "quantity" | "createdAt"
  >("createdAt");
  const [tempSortOrder, setTempSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [dateRange, setDateRange] = useState<
    | {
        startDate: string;
        endDate: string;
      }
    | undefined
  >(undefined);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isSortVisible, setIsSortVisible] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState("All Time");
  const [customRange, setCustomRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const { currentStore } = useStore();
  const dateRangeSchema = z
    .object({
      startDate: z.date(),
      endDate: z.date(),
    })
    .refine((data) => data.startDate <= data.endDate, {
      message: "Start date must be before or equal to end date",
      path: ["endDate"],
    });

  const filterAnim = useRef(new Animated.Value(300)).current;
  const sortAnim = useRef(new Animated.Value(300)).current;

  const fetchSales = async (params?: {
    searchTerm?: string;
    dateRange?: typeof dateRange;
    sortBy?: typeof sortBy;
    sortOrder?: typeof sortOrder;
  }) => {
    setIsLoading(true);
    try {
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }

      const finalParams = {
        searchTerm: params?.hasOwnProperty("searchTerm")
          ? params.searchTerm
          : searchTerm,
        dateRange: params?.hasOwnProperty("dateRange")
          ? params.dateRange
          : dateRange,
        sortBy: params?.hasOwnProperty("sortBy") ? params.sortBy : sortBy,
        sortOrder: params?.hasOwnProperty("sortOrder")
          ? params.sortOrder
          : sortOrder,
        storeId: currentStore?.id,
      };

      console.log("Fetching sales with params:", finalParams);
      const data = await searchSales(finalParams);
      setSales(data as Sale[]);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, [])
  );

  const showPanel = (animRef: Animated.Value) =>
    Animated.timing(animRef, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

  const hidePanel = (animRef: Animated.Value, setter: any) =>
    Animated.timing(animRef, {
      toValue: 1000,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setter(false));

  const openFilter = () => {
    setIsFilterVisible(true);
    showPanel(filterAnim);
  };

  const openSort = () => {
    setTempSortBy(sortBy ?? "createdAt");
    setTempSortOrder(sortOrder);
    setIsSortVisible(true);
    showPanel(sortAnim);
  };

  const handleDateChange = (
    type: "start" | "end",
    event: any,
    selectedDate?: Date
  ) => {
    if (type === "start") {
      setShowStartDatePicker(false);
    } else {
      setShowEndDatePicker(false);
    }

    if (selectedDate) {
      setCustomRange((prev) => ({
        ...prev,
        [type === "start" ? "startDate" : "endDate"]: selectedDate,
      }));
    }
  };

  const onSearch = () => fetchSales();

  const getDateRange = (days: number) => {
    const today = new Date();
    const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      startDate: pastDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchSales({ searchTerm: "" });
  };

  const applyFilter = () => {
    let updatedDateRange: typeof dateRange;

    if (selectedPreset === "Custom") {
      const validation = dateRangeSchema.safeParse({
        startDate: customRange.startDate,
        endDate: customRange.endDate,
      });

      if (!validation.success) {
        Alert.alert("Validation Error", validation.error.errors[0].message);
        return;
      }

      updatedDateRange = {
        startDate: customRange.startDate.toISOString().split("T")[0],
        endDate: customRange.endDate.toISOString().split("T")[0],
      };
    } else if (selectedPreset === "All Time") {
      updatedDateRange = undefined;
    } else {
      const days = Number(selectedPreset.split(" ")[0]);
      updatedDateRange = getDateRange(days);
    }

    setDateRange(updatedDateRange);

    hidePanel(filterAnim, () => {
      setIsFilterVisible(false);
      setTimeout(() => {
        fetchSales({ dateRange: updatedDateRange });
      }, 50);
    });
  };

  const applySort = () => {
    setSortBy(tempSortBy);
    setSortOrder(tempSortOrder);
    hidePanel(sortAnim, () => {
      setIsSortVisible(false);
      setTimeout(() => {
        fetchSales({ sortBy: tempSortBy, sortOrder: tempSortOrder });
      }, 50);
    });
  };

  const clearFilters = () => {
    const updatedDateRange = undefined;
    setDateRange(updatedDateRange);
    setSelectedPreset("All Time");

    hidePanel(filterAnim, () => {
      setIsFilterVisible(false);
      setTimeout(() => {
        fetchSales({ dateRange: updatedDateRange });
      }, 50);
    });
  };

  const clearSort = () => {
    setTempSortBy("createdAt");
    setTempSortOrder("DESC");
    setSortBy("createdAt");
    setSortOrder("DESC");
    hidePanel(sortAnim, () => {
      setIsSortVisible(false);
      setTimeout(() => {
        fetchSales({ sortBy: "createdAt", sortOrder: "DESC" });
      }, 50);
    });
  };

  const sortFields = ["medicineName", "quantity", "createdAt"] as const;

  return (
    <View style={styles.wrapper}>
      <TopBar
        centerComponent={
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search sales..."
              placeholderTextColor="#666"
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <TouchableOpacity style={styles.iconButton} onPress={onSearch}>
              <Ionicons
                name="search-outline"
                size={24}
                color="rgb(70, 125, 168)"
              />
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
        }
        rightComponent={
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={openFilter}>
              <Ionicons name="filter-outline" size={24} color="#535353ff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={openSort}>
              <Ionicons
                name="swap-vertical-outline"
                size={24}
                color="#535353ff"
              />
            </TouchableOpacity>
          </View>
        }
      />

      {isLoading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {sales.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="receipt" size={70} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchTerm ? "No sales found" : "No sales recorded yet"}
              </Text>
              <Text style={styles.emptySubText}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Record your first sale"}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, width: "100%", gap: 14 }}>
              {sales.map((sale) => (
                <SaleCard key={sale.id} sale={sale} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.add}
        onPress={() => router.push("/addSales")}
      >
        <MaterialIcons name="add" size={35} color="rgb(70, 125, 168)" />
      </TouchableOpacity>

      {isFilterVisible && (
        <Pressable
          style={styles.overlay}
          onPress={() => hidePanel(filterAnim, setIsFilterVisible)}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheet,
                { transform: [{ translateY: filterAnim }] },
              ]}
            >
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.modalTitle}>Filter by Date</Text>

              <View style={styles.presetContainer}>
                {["All Time", "7 Days", "30 Days", "90 Days", "Custom"].map(
                  (label) => (
                    <TouchableOpacity
                      key={label}
                      onPress={() => setSelectedPreset(label)}
                      style={[
                        styles.presetButton,
                        selectedPreset === label && styles.presetButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetButtonText,
                          selectedPreset === label &&
                            styles.presetButtonTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {selectedPreset === "Custom" && (
                <View style={styles.customInputContainer}>
                  <View style={styles.customInputRow}>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>Start Date</Text>
                      <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowStartDatePicker(true)}
                      >
                        <Text style={styles.dateText}>
                          {customRange.startDate.toLocaleDateString()}
                        </Text>
                        <MaterialIcons
                          name="calendar-month"
                          size={20}
                          color="#aaa"
                        />
                      </TouchableOpacity>
                      {showStartDatePicker && (
                        <DateTimePicker
                          value={customRange.startDate}
                          mode="date"
                          display="default"
                          onChange={(event, date) =>
                            handleDateChange("start", event, date)
                          }
                        />
                      )}
                    </View>

                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>End Date</Text>
                      <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowEndDatePicker(true)}
                      >
                        <Text style={styles.dateText}>
                          {customRange.endDate.toLocaleDateString()}
                        </Text>
                        <MaterialIcons
                          name="calendar-month"
                          size={20}
                          color="#aaa"
                        />
                      </TouchableOpacity>
                      {showEndDatePicker && (
                        <DateTimePicker
                          value={customRange.endDate}
                          mode="date"
                          display="default"
                          onChange={(event, date) =>
                            handleDateChange("end", event, date)
                          }
                        />
                      )}
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.footerButtons}>
                <TouchableOpacity
                  style={styles.footerBtnClear}
                  onPress={clearFilters}
                >
                  <Text style={styles.footerBtnText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.footerBtnApply}
                  onPress={applyFilter}
                >
                  <Text style={styles.footerBtnTextApply}>Apply</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Pressable>
      )}

      {isSortVisible && (
        <Pressable
          style={styles.overlay}
          onPress={() => hidePanel(sortAnim, setIsSortVisible)}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheet,
                { transform: [{ translateY: sortAnim }] },
              ]}
            >
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.modalTitle}>Sort By</Text>

              <View style={styles.segmentContainerSort}>
                {sortFields.map((field) => (
                  <TouchableOpacity
                    key={field}
                    onPress={() => setTempSortBy(field)}
                    style={[
                      styles.segmentButtonSort,
                      tempSortBy === field
                        ? styles.segmentButtonActive
                        : styles.segmentButtonInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        tempSortBy === field && styles.segmentTextActive,
                      ]}
                    >
                      {SORT_OPTIONS[field]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Order</Text>
              <View style={styles.segmentContainer}>
                {[
                  { value: "DESC", label: "Newest First" },
                  { value: "ASC", label: "Oldest First" },
                ].map((order) => (
                  <TouchableOpacity
                    key={order.value}
                    onPress={() =>
                      setTempSortOrder(order.value as "ASC" | "DESC")
                    }
                    style={[
                      styles.segmentButton,
                      tempSortOrder === order.value &&
                        styles.segmentButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        tempSortOrder === order.value &&
                          styles.segmentTextActive,
                      ]}
                    >
                      {order.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.footerButtons}>
                <TouchableOpacity
                  style={styles.footerBtnClear}
                  onPress={clearSort}
                >
                  <Text style={styles.footerBtnText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.footerBtnApply}
                  onPress={applySort}
                >
                  <Text style={styles.footerBtnTextApply}>Apply</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Pressable>
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

  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
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
  clearButton: {
    position: "absolute",
    right: 55,
    padding: 5,
  },

  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    padding: 18,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#00000055",
    zIndex: 2000,
    justifyContent: "flex-end",
  },

  bottomSheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 8,
    zIndex: 3000,
  },

  bottomSheetHandle: {
    width: 40,
    borderRadius: 100,
    height: 5,
    backgroundColor: "#ddd",
    marginHorizontal: "auto",
    marginBottom: 10,
    alignSelf: "center",
  },

  modalTitle: {
    color: "#444",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 5,
    alignSelf: "flex-start",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    marginTop: 10,
    color: "#444",
    alignSelf: "flex-start",
  },

  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderRadius: 8,
    marginBottom: 20,
    overflow: "hidden",
    padding: 5,
  },
  segmentContainerSort: {
    marginBottom: 20,
    overflow: "hidden",
    padding: 5,
    gap: 10,
  },

  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentButtonSort: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },

  segmentButtonActive: {
    backgroundColor: "rgb(233, 243, 251)",
    borderWidth: 1,
    borderColor: "rgb(152, 175, 192)",
  },
  segmentButtonInactive: {
    backgroundColor: "#fafafa",
  },

  segmentText: {
    color: "#777",
    fontWeight: "500",
  },

  segmentTextActive: {
    color: "rgb(57, 104, 139)",
    fontWeight: "600",
  },

  presetContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },

  presetButton: {
    backgroundColor: "#fafafa",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
  },

  presetButtonActive: {
    backgroundColor: "rgb(233, 243, 251)",
    borderWidth: 1,
    borderColor: "rgb(152, 175, 192)",
  },

  presetButtonText: {
    fontWeight: "500",
    color: "#777",
  },
  presetButtonTextActive: {
    fontWeight: "600",
    color: "rgb(57, 104, 139)",
  },

  customInputContainer: {
    marginBottom: 20,
  },

  customInputRow: {
    flexDirection: "row",
    gap: 10,
  },

  dateInputContainer: {
    flex: 1,
  },

  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
    marginBottom: 8,
  },

  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
    minHeight: 45,
  },

  dateText: {
    fontSize: 14,
    color: "#000",
  },

  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  footerBtnClear: {
    backgroundColor: "rgb(246, 246, 246)",
    borderWidth: 1,
    borderColor: "rgb(149, 149, 149)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
  },

  footerBtnApply: {
    backgroundColor: "rgb(233, 243, 251)",
    borderWidth: 1,
    borderColor: "rgb(152, 175, 192)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
  },

  footerBtnText: {
    fontWeight: "600",
    fontSize: 14,
    color: "#444",
  },
  footerBtnTextApply: {
    fontWeight: "600",
    fontSize: 14,
    color: "rgb(57, 104, 139)",
  },
});
