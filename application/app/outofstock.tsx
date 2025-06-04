import DrugCard from "@/components/DrugCard";
import { Drug } from "@/types";
import { getLowStockDrugs, getOutOfStockDrugs } from "@/utils/dbActions";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OutOfStock() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabExpired, setTabExpired] = useState(true);
  const spinValue = useRef(new Animated.Value(0)).current;

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
          ? await getOutOfStockDrugs()
          : await getLowStockDrugs();

        setDrugs(drugsData as Drug[]);
      } catch (err) {
        console.error("Failed to fetch drugs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrugs();
  }, [tabExpired]);

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
          <FontAwesome5 name="box-open" size={18} color="rgb(189, 63, 63)" />
          <Text style={[styles.changeLabel, { color: "rgb(189, 63, 63)" }]}>
            Out of Stock
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
          <FontAwesome name="warning" size={18} color="rgb(197, 118, 45)" />
          <Text style={[styles.changeLabel, { color: "rgb(197, 118, 45)" }]}>
            Low in Stock
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContainer]}>
        {drugs.map((drug) => (
          <DrugCard key={drug.id} drug={drug} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 18,
    position: "relative",
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
    gap: 14,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
