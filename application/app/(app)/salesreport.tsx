import { useStore } from "@/contexts/StoreContext";
import { getSalesReport } from "@/utils/salesDb";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";

interface GroupedSale {
  medicineName: string;
  price: number;
  mrp: number;
  unitPerPackage: number;
  quantitySold: number;
  totalProfit: number;
}

const SalesReportTable: React.FC = () => {
  const [groupedSales, setGroupedSales] = useState<GroupedSale[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentStore } = useStore();
  const navigation = useNavigation();

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
  const filterAnim = useRef(new Animated.Value(300)).current;

  const loadSalesData = useCallback(async () => {
    try {
      setLoading(true);
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }

      let salesReport: GroupedSale[];
      if (isFiltered && activeFilters.startDate && activeFilters.endDate) {
        const startDateStr = activeFilters.startDate
          .toISOString()
          .split("T")[0];
        const endDateStr = activeFilters.endDate.toISOString().split("T")[0];
        salesReport = await getSalesReport(
          currentStore.id,
          startDateStr,
          endDateStr
        );
      } else {
        salesReport = await getSalesReport(currentStore.id);
      }

      setGroupedSales(salesReport as GroupedSale[]);
    } catch (error) {
      console.error("Error loading sales data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentStore, isFiltered, activeFilters]);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

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

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-sharp" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Sales Report</Text>
          <TouchableOpacity onPress={openFilter}>
            <Ionicons
              name={isFiltered ? "filter" : "filter-outline"}
              size={20}
              color="#333"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading sales report...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-sharp" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Sales Report</Text>
        <TouchableOpacity onPress={openFilter}>
          <Ionicons
            name={isFiltered ? "filter" : "filter-outline"}
            size={20}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      {/* Filter indicator - immediately after topbar */}

      <View style={styles.container}>
        {isFiltered && (
          <View style={styles.filterIndicator}>
            <Text style={styles.filterIndicatorText}>
              Filtered: {activeFilters.startDate?.toLocaleDateString()} -{" "}
              {activeFilters.endDate?.toLocaleDateString()}
            </Text>
            <TouchableOpacity onPress={clearFilter}>
              <MaterialIcons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        {groupedSales.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assessment" size={70} color="#ccc" />
            <Text style={styles.emptyText}>
              {isFiltered
                ? "No sales data found for selected date range"
                : "No sales data available"}
            </Text>
            <Text style={styles.emptySubText}>
              {isFiltered
                ? "Try adjusting your date range"
                : "Start making sales to see your report here"}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.horizontalScroll}
          >
            <View style={styles.tableContainer}>
              {/* Sticky Header */}
              <View style={styles.stickyHeader}>
                <View style={styles.headerRow}>
                  <Text
                    style={[styles.cell, styles.headerCell, styles.serialCol]}
                  >
                    Serial No.
                  </Text>
                  <Text
                    style={[styles.cell, styles.headerCell, styles.medicineCol]}
                  >
                    Medicine Name
                  </Text>
                  <Text
                    style={[styles.cell, styles.headerCell, styles.priceCol]}
                  >
                    Price per Unit
                  </Text>
                  <Text style={[styles.cell, styles.headerCell, styles.mrpCol]}>
                    MRP per Unit
                  </Text>
                  <Text
                    style={[styles.cell, styles.headerCell, styles.quantityCol]}
                  >
                    Quantity Sold
                  </Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.headerCell,
                      styles.profitCol,
                      styles.lastCell,
                    ]}
                  >
                    Total Profit
                  </Text>
                </View>
              </View>

              {/* Scrollable Body */}
              <ScrollView
                showsVerticalScrollIndicator={true}
                style={styles.tableBody}
              >
                <View style={styles.table}>
                  {/* Data Rows */}
                  {groupedSales.map((item, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dataRow,
                        index === groupedSales.length - 1 && styles.lastRow,
                      ]}
                    >
                      <Text
                        style={[styles.cell, styles.dataCell, styles.serialCol]}
                      >
                        {index + 1}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          styles.dataCell,
                          styles.medicineCol,
                        ]}
                      >
                        {item.medicineName}
                      </Text>
                      <Text
                        style={[styles.cell, styles.dataCell, styles.priceCol]}
                      >
                        ₹{(item.price / item.unitPerPackage).toFixed(2)}
                      </Text>
                      <Text
                        style={[styles.cell, styles.dataCell, styles.mrpCol]}
                      >
                        ₹{(item.mrp / item.unitPerPackage).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          styles.dataCell,
                          styles.quantityCol,
                        ]}
                      >
                        {item.quantitySold}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          styles.dataCell,
                          styles.profitCol,
                          styles.lastCell,
                        ]}
                      >
                        ₹
                        {(
                          ((item.mrp - item.price) * item.quantitySold) /
                          item.unitPerPackage
                        ).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Totals Row */}
              <View style={styles.totalsRow}>
                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>Total Revenue</Text>
                  <Text style={styles.totalValue}>
                    ₹
                    {groupedSales
                      .reduce(
                        (sum, item) =>
                          sum +
                          (item.mrp * item.quantitySold) / item.unitPerPackage,
                        0
                      )
                      .toFixed(2)}
                  </Text>
                </View>
                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>Total Cost</Text>
                  <Text style={styles.totalValue}>
                    ₹
                    {groupedSales
                      .reduce(
                        (sum, item) =>
                          sum +
                          (item.price * item.quantitySold) /
                            item.unitPerPackage,
                        0
                      )
                      .toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.totalSection, styles.lastTotalSection]}>
                  <Text style={styles.totalLabel}>Total Profit</Text>
                  <Text style={styles.totalValue}>
                    ₹
                    {groupedSales
                      .reduce(
                        (sum, item) =>
                          sum +
                          ((item.mrp - item.price) * item.quantitySold) /
                            item.unitPerPackage,
                        0
                      )
                      .toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Filter Bottom Sheet */}
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
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: "relative" },
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
    paddingLeft: 14,
    paddingRight: 18,
    paddingVertical: 16,
    zIndex: 1000,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },

  filterIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f5ff91",
    borderWidth: 1,
    borderColor: "#aabbdc45",
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 16,
    marginBottom: 2,
  },
  filterIndicatorText: {
    fontSize: 12,
    fontWeight: 500,
    color: "#3e5176ff",
    flex: 1,
  },
  container: {
    flex: 1,
    marginTop: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  horizontalScroll: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  stickyHeader: {
    backgroundColor: "#ffff",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: "#aabbdc45",
    overflow: "hidden",
  },
  tableBody: {
    flex: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#aabbdc45",
    backgroundColor: "#fcfcfc",
  },
  table: {
    backgroundColor: "#fcfcfc",
    borderBottomWidth: 1,
    borderColor: "#aabbdc45",
  },
  totalsRow: {
    flexDirection: "row",
    backgroundColor: "#f0f5ff91",
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderColor: "#aabbdc45",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  totalSection: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#aabbdc45",
    paddingHorizontal: 8,
  },
  lastTotalSection: {
    borderRightWidth: 0,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3e5176ff",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3e5176ff",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f0f5ff91",
    borderBottomWidth: 1,
    borderBottomColor: "#aabbdc45",
  },
  dataRow: {
    flexDirection: "row",
    backgroundColor: "#fcfcfc",
    borderBottomWidth: 1,
    borderBottomColor: "#aabbdc45",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#aabbdc45",
    textAlign: "center",
  },
  lastCell: {
    borderRightWidth: 0,
  },
  lastRowCell: {
    borderBottomWidth: 0,
  },
  headerCell: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#3e5176ff",
  },
  dataCell: {
    fontSize: 14,
    color: "#555",
  },
  totalsCell: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c5aa0",
  },
  serialCol: {
    width: 80,
  },
  medicineCol: {
    width: 200,
    textAlign: "left",
  },
  priceCol: {
    width: 100,
  },
  mrpCol: {
    width: 100,
  },
  quantityCol: {
    width: 120,
  },
  profitCol: {
    width: 120,
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

export default SalesReportTable;
