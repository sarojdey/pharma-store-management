import DrugCard from "@/components/DrugCard";
import Loader from "@/components/Loader";
import { useStore } from "@/contexts/StoreContext";
import { Drug } from "@/types";
import { searchDrugs } from "@/utils/stocksDb";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
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

const SORT_OPTIONS: Record<string, string> = {
  medicineName: "Name",
  price: "Price",
  quantity: "Quantity",
  expiryDate: "Expiry Date",
};

export default function HomeScreen() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<
    "expiryDate" | "quantity" | undefined
  >(undefined);
  const [filterValue, setFilterValue] = useState<
    string | number | [string | number, string | number] | undefined
  >(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [tempSortBy, setTempSortBy] = useState<string | undefined>(undefined);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<"expiry" | "quantity">(
    "expiry"
  );

  const [selectedPreset, setSelectedPreset] = useState("30 Days");
  const [customRange, setCustomRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    minQty: "",
    maxQty: "",
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

  const quantityRangeSchema = z
    .object({
      minQty: z.coerce.number().min(0, "Minimum quantity must be 0 or greater"),
      maxQty: z.coerce.number().min(0, "Maximum quantity must be 0 or greater"),
    })
    .refine((data) => data.minQty <= data.maxQty, {
      message:
        "Minimum quantity must be less than or equal to maximum quantity",
      path: ["maxQty"],
    });

  const navigation = useNavigation();
  const filterAnim = useRef(new Animated.Value(300)).current;
  const sortAnim = useRef(new Animated.Value(300)).current;

  const fetchDrugs = async (params?: {
    searchTerm?: string;
    filterBy?: typeof filterBy;
    filterValue?: typeof filterValue;
    sortBy?: typeof sortBy;
  }) => {
    setIsLoading(true);
    try {
      const finalParams = {
        searchTerm: params?.hasOwnProperty("searchTerm")
          ? params.searchTerm
          : searchTerm,
        filterBy: params?.hasOwnProperty("filterBy")
          ? params.filterBy
          : filterBy,
        filterValue: params?.hasOwnProperty("filterValue")
          ? params.filterValue
          : filterValue,
        sortBy: params?.hasOwnProperty("sortBy") ? params.sortBy : sortBy,
      };

      console.log({
        ...finalParams,
        page: "inventory",
      });
      if (!currentStore?.id) {
        Alert.alert("Error", "No store selected.");
        return;
      }
      const data = await searchDrugs({
        ...finalParams,
        mode: "inventory",
        storeId: currentStore?.id,
      });

      setDrugs(data as Drug[]);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDrugs();
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
    setTempSortBy(sortBy ?? "medicineName");
    setIsSortVisible(true);
    showPanel(sortAnim);
  };

  const switchTab = (tab: "expiry" | "quantity") => {
    setActiveFilterTab(tab);

    setSelectedPreset(tab === "expiry" ? "30 Days" : "50");
    setCustomRange({
      startDate: new Date(),
      endDate: new Date(),
      minQty: "",
      maxQty: "",
    });
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

  const onSearch = () => fetchDrugs();

  const getDateRange = (days: number) => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return [
      today.toISOString().split("T")[0],
      futureDate.toISOString().split("T")[0],
    ];
  };
  const handleClearSearch = () => {
    setSearchTerm("");
    fetchDrugs({ searchTerm: "" });
  };

  const applyFilter = () => {
    let updatedFilterBy: typeof filterBy;
    let updatedFilterValue: typeof filterValue;

    if (selectedPreset === "Custom") {
      if (activeFilterTab === "expiry") {
        const validation = dateRangeSchema.safeParse({
          startDate: customRange.startDate,
          endDate: customRange.endDate,
        });

        if (!validation.success) {
          Alert.alert("Validation Error", validation.error.errors[0].message);
          return;
        }

        updatedFilterBy = "expiryDate";
        updatedFilterValue = [
          customRange.startDate.toISOString().split("T")[0],
          customRange.endDate.toISOString().split("T")[0],
        ];
      } else {
        const validation = quantityRangeSchema.safeParse({
          minQty: customRange.minQty,
          maxQty: customRange.maxQty,
        });

        if (!validation.success) {
          Alert.alert("Validation Error", validation.error.errors[0].message);
          return;
        }

        updatedFilterBy = "quantity";
        updatedFilterValue = [
          Number(customRange.minQty),
          Number(customRange.maxQty),
        ];
      }
    } else {
      if (activeFilterTab === "expiry") {
        const days = Number(selectedPreset.split(" ")[0]);
        updatedFilterBy = "expiryDate";
        updatedFilterValue = getDateRange(days) as [string, string];
      } else {
        updatedFilterBy = "quantity";
        updatedFilterValue = [0, Number(selectedPreset)];
      }
    }

    setFilterBy(updatedFilterBy);
    setFilterValue(updatedFilterValue);

    hidePanel(filterAnim, () => {
      setIsFilterVisible(false);
      setTimeout(() => {
        fetchDrugs({
          filterBy: updatedFilterBy,
          filterValue: updatedFilterValue,
        });
      }, 50);
    });
  };

  const applySort = () => {
    setSortBy(tempSortBy);
    hidePanel(sortAnim, () => {
      setIsSortVisible(false);
      setTimeout(() => {
        fetchDrugs({ sortBy: tempSortBy });
      }, 50);
    });
  };

  const clearFilters = () => {
    const updatedFilterBy = undefined;
    const updatedFilterValue = undefined;

    setFilterBy(updatedFilterBy);
    setFilterValue(updatedFilterValue);

    hidePanel(filterAnim, () => {
      setIsFilterVisible(false);

      setTimeout(() => {
        fetchDrugs({
          filterBy: updatedFilterBy,
          filterValue: updatedFilterValue,
        });
      }, 50);
    });
  };
  const clearSort = () => {
    setTempSortBy(undefined);
    setSortBy(undefined);
    hidePanel(sortAnim, () => {
      setIsSortVisible(false);
      setTimeout(() => {
        fetchDrugs({ sortBy: undefined });
      }, 50);
    });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-sharp" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search..."
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

        <TouchableOpacity onPress={openFilter}>
          <Ionicons name="filter-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={openSort}>
          <Ionicons name="swap-vertical-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {drugs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="box-open" size={70} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchTerm ? "No stocks found" : "No stocks added yet"}
              </Text>
              <Text style={styles.emptySubText}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Add your first stock"}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, width: "100%", gap: 14, marginTop: 70 }}>
              {drugs.map((d) => (
                <DrugCard haveActionButton={false} key={d.id} drug={d} />
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
              <Text style={styles.modalTitle}>Filter by</Text>

              <View style={styles.segmentContainer}>
                {["expiry", "quantity"].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => switchTab(tab as any)}
                    style={[
                      styles.segmentButton,
                      activeFilterTab === tab && styles.segmentButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        activeFilterTab === tab && styles.segmentTextActive,
                      ]}
                    >
                      {tab === "expiry" ? "Expiry Date" : "Quantity"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.presetContainer}>
                {(activeFilterTab === "expiry"
                  ? ["30 Days", "60 Days", "90 Days", "Custom"]
                  : ["50", "100", "500", "Custom"]
                ).map((label) => (
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
                ))}
              </View>

              {selectedPreset === "Custom" && (
                <View style={styles.customInputContainer}>
                  {activeFilterTab === "expiry" ? (
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
                  ) : (
                    <View style={styles.customInputRow}>
                      <TextInput
                        style={styles.input}
                        placeholder="Min Qty"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        value={customRange.minQty}
                        onChangeText={(t) =>
                          setCustomRange((pr) => ({ ...pr, minQty: t }))
                        }
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Max Qty"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        value={customRange.maxQty}
                        onChangeText={(t) =>
                          setCustomRange((pr) => ({ ...pr, maxQty: t }))
                        }
                      />
                    </View>
                  )}
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
                {["medicineName", "price", "quantity", "expiryDate"].map(
                  (field) => (
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
                  )
                )}
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
    paddingHorizontal: 10,
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
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

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
    backgroundColor: "#fafafa",
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
