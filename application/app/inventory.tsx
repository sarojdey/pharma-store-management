import DrugCard from "@/components/DrugCard";
import Loader from "@/components/Loader";
import { Drug } from "@/types";
import { dynamicSearchDrugs } from "@/utils/dbActions";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
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

export default function HomeScreen() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<
    "expiryDate" | "quantity" | undefined
  >();
  const [filterValue, setFilterValue] = useState<
    string | number | [string | number, string | number] | undefined
  >();
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<"expiry" | "quantity">(
    "expiry"
  );
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

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
        page: "expiredalert",
      });

      const data = await dynamicSearchDrugs({
        ...finalParams,
        page: "expiredalert",
      });

      setDrugs(data as Drug[]);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

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
    setIsSortVisible(true);
    showPanel(sortAnim);
  };

  const switchTab = (tab: "expiry" | "quantity") => {
    setActiveFilterTab(tab);
    setSelectedPreset("");
    setCustomRange({ start: "", end: "" });
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

  const applyFilter = () => {
    let updatedFilterBy: typeof filterBy;
    let updatedFilterValue: typeof filterValue;

    if (selectedPreset === "Custom") {
      updatedFilterBy =
        activeFilterTab === "expiry" ? "expiryDate" : "quantity";
      updatedFilterValue =
        activeFilterTab === "expiry"
          ? [customRange.start, customRange.end]
          : [Number(customRange.start), Number(customRange.end)];
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

  const applySort = (field: string) => {
    setSortBy(field);
    hidePanel(sortAnim, () => {
      setIsSortVisible(false);
      setTimeout(() => {
        fetchDrugs();
      }, 50);
    });
  };
  const clearFilters = () => {
    const updatedFilterBy = undefined;
    const updatedFilterValue = undefined;

    setFilterBy(updatedFilterBy);
    setFilterValue(updatedFilterValue);
    setSelectedPreset("");
    setCustomRange({ start: "", end: "" });

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

  if (isLoading) return <Loader />;

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
        </View>

        <TouchableOpacity onPress={openFilter}>
          <Ionicons name="filter-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={openSort}>
          <Ionicons name="swap-vertical-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {drugs.map((d) => (
          <DrugCard key={d.id} drug={d} />
        ))}
      </ScrollView>

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
              <Text style={styles.modalTitle}>Filter</Text>
              <Text style={styles.sectionTitle}>
                {activeFilterTab === "expiry" ? "Expiry Date" : "Quantity"}
              </Text>

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
                    <Text style={styles.presetButtonText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedPreset === "Custom" && (
                <View style={styles.customInputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      activeFilterTab === "expiry"
                        ? "Start Date (YYYY-MM-DD)"
                        : "Min Qty"
                    }
                    placeholderTextColor="#999"
                    value={customRange.start}
                    onChangeText={(t) =>
                      setCustomRange((pr) => ({ ...pr, start: t }))
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={
                      activeFilterTab === "expiry"
                        ? "End Date (YYYY-MM-DD)"
                        : "Max Qty"
                    }
                    placeholderTextColor="#999"
                    value={customRange.end}
                    onChangeText={(t) =>
                      setCustomRange((pr) => ({ ...pr, end: t }))
                    }
                  />
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
                  <Text style={styles.footerBtnText}>Apply</Text>
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
              <Text style={styles.modalTitle}>Sort By</Text>
              {["medicineName", "price", "quantity", "expiryDate"].map(
                (field) => (
                  <TouchableOpacity
                    key={field}
                    onPress={() => applySort(field)}
                    style={[
                      styles.segmentButton,
                      sortBy === field && styles.segmentButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        sortBy === field && styles.segmentTextActive,
                      ]}
                    >
                      {field}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Pressable>
      )}
    </View>
  );
}

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

  scrollContainer: {
    minHeight: "100%",
    alignItems: "center",
    paddingTop: 90,
    padding: 18,
    gap: 14,
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
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 10,
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
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 20,
    overflow: "hidden",
  },

  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },

  segmentButtonActive: {
    backgroundColor: "#e0eaff",
  },

  segmentText: {
    color: "#777",
    fontWeight: "500",
  },

  segmentTextActive: {
    color: "#000",
    fontWeight: "600",
  },

  presetContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },

  presetButton: {
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },

  presetButtonActive: {
    backgroundColor: "#d8e8ff",
  },

  presetButtonText: {
    fontWeight: "500",
  },

  customInputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
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
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },

  footerBtnApply: {
    backgroundColor: "#aad4ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },

  footerBtnText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
