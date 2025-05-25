import DrugCard from "@/components/ui/DrugCard";
import { Drug } from "@/types";
import { getAllDrugs } from "@/utils/seedData";
import { ScrollView, StyleSheet } from "react-native";

export default function HomeScreen() {
  const drugs = getAllDrugs() as Drug[];

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
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
});
