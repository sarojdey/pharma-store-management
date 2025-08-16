import HistoryCard from "@/components/HistoryCard";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import Loader from "@/components/Loader";
import { History } from "@/types";
import { getAllHistory, resetHistoryDb } from "@/utils/historyDb";
import { useStore } from "@/contexts/StoreContext";
import TopBar from "@/components/TopBar";

type SortOrder = "asc" | "desc";

export default function HistoryPage() {
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [activeFilters, setActiveFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [isFiltered, setIsFiltered] = useState(false);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const { currentStore } = useStore();
  const filterAnim = useRef(new Animated.Value(300)).current;

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      let historyData: History[];
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }
      if (isFiltered && activeFilters.startDate && activeFilters.endDate) {
        const startDateStr = activeFilters.startDate
          .toISOString()
          .split("T")[0];
        const endDateStr = activeFilters.endDate.toISOString().split("T")[0];
        historyData = await getAllHistory(
          currentStore.id,
          sortOrder,
          startDateStr,
          endDateStr
        );
      } else {
        historyData = await getAllHistory(currentStore.id, sortOrder);
      }

      setHistory(historyData);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  }, [sortOrder, isFiltered, activeFilters]);

  const handleResetHistory = useCallback(() => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all history? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              resetHistoryDb();
              await loadHistory();
            } catch (error) {
              console.error("Error clearing history:", error);
              Alert.alert("Error", "Failed to clear history. Please try again.");
            }
          },
        },
      ]
    );
  }, [loadHistory]);

  const toggleSort = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    console.log("Sort order changed to:", newOrder);
  };

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
      setDateRange((prev) => ({
        ...prev,
        [type === "start" ? "startDate" : "endDate"]: selectedDate,
      }));
    }
  };

  const applyFilter = () => {
    if (dateRange.startDate > dateRange.endDate) {
      Alert.alert(
        "Validation Error",
        "Start date must be before or equal to end date"
      );
      return;
    }

    setActiveFilters({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    setIsFiltered(true);

    console.log("Filter applied:", {
      startDate: dateRange.startDate.toISOString().split("T")[0],
      endDate: dateRange.endDate.toISOString().split("T")[0],
    });

    hidePanel(filterAnim, () => {
      setIsFilterVisible(false);
    });
  };

  const clearFilter = () => {
    setActiveFilters({
      startDate: null,
      endDate: null,
    });
    setIsFiltered(false);

    setDateRange({
      startDate: new Date(),
      endDate: new Date(),
    });

    console.log("Filter cleared");

    hidePanel(filterAnim, () => {
      setIsFilterVisible(false);
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <TopBar
        rightComponent={
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
              <MaterialIcons
                name={sortOrder === "asc" ? "arrow-upward" : "arrow-downward"}
                size={18}
                color="rgb(70, 125, 168)"
              />
              <Text style={styles.sortButtonText}>Date</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                isFiltered && { backgroundColor: "rgba(186, 255, 234, 1)" },
              ]}
              onPress={openFilter}
            >
              <Ionicons
                name={isFiltered ? "filter" : "filter-outline"}
                size={20}
                color="rgb(70, 125, 168)"
              />
            </TouchableOpacity>

            {history.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleResetHistory}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={20}
                  color="#d32f2f"
                />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {loading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={70} color="#ccc" />
              <Text style={styles.emptyText}>
                {isFiltered
                  ? "No history found for selected date range"
                  : "No history found"}
              </Text>
              <Text style={styles.emptySubText}>
                {isFiltered
                  ? "Try adjusting your date range"
                  : "Your activity history will appear here"}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, width: "100%", gap: 14 }}>
              {history.map((historyItem) => (
                <HistoryCard key={historyItem.id} history={historyItem} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

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
              <Text style={styles.modalTitle}>Filter by Date Range</Text>

              <View style={styles.dateRangeContainer}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {dateRange.startDate.toLocaleDateString()}
                    </Text>
                    <MaterialIcons
                      name="calendar-month"
                      size={20}
                      color="#aaa"
                    />
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={dateRange.startDate}
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
                      {dateRange.endDate.toLocaleDateString()}
                    </Text>
                    <MaterialIcons
                      name="calendar-month"
                      size={20}
                      color="#aaa"
                    />
                  </TouchableOpacity>
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={dateRange.endDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) =>
                        handleDateChange("end", event, date)
                      }
                    />
                  )}
                </View>
              </View>

              <View style={styles.footerButtons}>
                <TouchableOpacity
                  style={styles.footerBtnClear}
                  onPress={clearFilter}
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
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 14,
    gap: 8,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(230, 244, 255)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(70, 126, 168, 0.39)",
    elevation: 5,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    color: "rgb(70, 125, 168)",
    fontWeight: "500",
  },
  filterButton: {
    backgroundColor: "rgb(230, 244, 255)",
    elevation: 5,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(70, 126, 168, 0.39)",
  },
  clearButton: {
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)",
  },
  scrollContainer: {
    flexGrow: 1,
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
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    marginTop: 2,
    textAlign: "center",
  },
  dateRangeContainer: {
    gap: 16,
    marginBottom: 30,
  },
  dateInputContainer: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
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
    fontSize: 16,
    color: "#333",
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  footerBtnClear: {
    backgroundColor: "rgb(246, 246, 246)",
    borderWidth: 1,
    borderColor: "rgb(149, 149, 149)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    alignItems: "center",
  },
  footerBtnApply: {
    backgroundColor: "rgb(233, 243, 251)",
    borderWidth: 1,
    borderColor: "rgb(152, 175, 192)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    alignItems: "center",
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
