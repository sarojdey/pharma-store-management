import DrugCard from "@/components/DrugCard";
import { Drug } from "@/types";
import { getExpiredDrugs, getExpiringDrugs } from "@/utils/dbActions";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function Expiry() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabExpired, setTabExpired] = useState(true);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const navigation = useNavigation();
  const spinValue = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(300)).current;
  const sortAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    setIsLoading(true);
    const fetchDrugs = async () => {
      try {
        const drugsData = tabExpired
          ? await getExpiredDrugs()
          : await getExpiringDrugs();
        setDrugs(drugsData as Drug[]);
      } catch (err) {
        console.error("Failed to fetch drugs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDrugs();
  }, [tabExpired]);

  const showPanel = (animRef: Animated.Value) => {
    Animated.timing(animRef, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hidePanel = (animRef: Animated.Value, setVisible: any) => {
    Animated.timing(animRef, {
      toValue: 1000,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const openFilter = () => {
    setIsFilterVisible(true);
    showPanel(filterAnim);
  };

  const openSort = () => {
    setIsSortVisible(true);
    showPanel(sortAnim);
  };

  if (isLoading) {
    return (
      <View style={[styles.scrollContainer, styles.loadingContainer]}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <EvilIcons name="spinner" size={40} color="#888" />
        </Animated.View>
      </View>
    );
  }

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
          />
          <TouchableOpacity style={styles.iconButton}>
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

      <View style={[styles.grid, { marginBottom: 20, marginTop: 10 }]}>
        <TouchableOpacity
          style={[
            styles.changeButton,
            {
              backgroundColor: "rgb(255, 226, 226)",
              borderColor: "rgb(196, 147, 147)",
            },
          ]}
          activeOpacity={0.7}
          onPress={() => {
            setTabExpired(true);
          }}
        >
          <FontAwesome5 name="skull" size={18} color="rgb(189, 63, 63)" />
          <Text style={[styles.changeLabel, { color: "rgb(189, 63, 63)" }]}>
            Expired
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.changeButton,
            {
              backgroundColor: "rgb(255, 239, 226)",
              borderColor: "rgb(196, 169, 147)",
            },
          ]}
          activeOpacity={0.7}
          onPress={() => {
            setTabExpired(false);
          }}
        >
          <Entypo name="time-slot" size={18} color="rgb(197, 118, 45)" />
          <Text style={[styles.changeLabel, { color: "rgb(197, 118, 45)" }]}>
            Expiring
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContainer]}>
        {drugs.map((drug) => (
          <DrugCard key={drug.id} drug={drug} />
        ))}
      </ScrollView>

      {/* Filter Bottom Modal */}
      {isFilterVisible && (
        <Pressable
          style={styles.overlay}
          onPress={() => hidePanel(filterAnim, setIsFilterVisible)}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.bottomSheet,
                { transform: [{ translateY: filterAnim }] },
              ]}
            >
              <View style={styles.bottomSheetHandle}></View>
              <View style={{ height: 500 }}></View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Pressable>
      )}

      {isSortVisible && (
        <Pressable
          style={styles.overlay}
          onPress={() => hidePanel(sortAnim, setIsSortVisible)}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.bottomSheet,
                { transform: [{ translateY: sortAnim }] },
              ]}
            >
              <View style={styles.bottomSheetHandle}></View>
              <View style={{ height: 500 }}></View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
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
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 0,
    zIndex: 1000,
    alignSelf: "center",
    padding: 12,
  },
  changeButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    gap: 8,
  },
  changeLabel: {
    color: "#212121",
    fontWeight: "600",
    fontSize: 17,
  },
  scrollContainer: {
    minHeight: "100%",
    alignItems: "center",
    paddingTop: 90,
    padding: 18,
    gap: 14,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 10,
    color: "gray",
    fontSize: 14,
  },
});
