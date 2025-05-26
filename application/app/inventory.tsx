import DrugCard from "@/components/ui/DrugCard";
import { Drug } from "@/types";
import { getAllDrugs } from "@/utils/dbActions";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, View } from "react-native";
import EvilIcons from "@expo/vector-icons/EvilIcons";

export default function HomeScreen() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
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
    const fetchDrugs = async () => {
      try {
        const drugsData = (await getAllDrugs()) as Drug[];
        setDrugs(drugsData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrugs();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.scrollContainer, styles.loadingContainer]}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <EvilIcons name="spinner-3" size={48} color="#888" />
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.scrollContainer]}>
      {drugs.map((drug) => (
        <DrugCard key={drug.id} drug={drug} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    minHeight: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  loadingContainer: {
    flex: 1,
  },
});
