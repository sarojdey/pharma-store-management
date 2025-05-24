import DrugCard from "@/components/ui/DrugCard";
import { ScrollView, StyleSheet } from "react-native";
export default function HomeScreen() {
  const drugs = [
    {
      id: "5255",
      drugName: "Zetramyline Velmoracil 500mg",
      inStock: 100,
      price: 19.99,
      expiry: "2025-12-31",
      drugType: "pills",
    },
    {
      id: "5256",
      drugName: "Xentoril Dapsomine 250mg",
      inStock: 54,
      price: 12.49,
      expiry: "2026-03-15",
      drugType: "syrup",
    },
    {
      id: "5257",
      drugName: "Lortrazil Monohydrate 100mg",
      inStock: 210,
      price: 9.99,
      expiry: "2025-08-20",
      drugType: "pills",
    },
    {
      id: "5258",
      drugName: "Vemotrazol Citrine 75mg",
      inStock: 30,
      price: 7.45,
      expiry: "2024-11-10",
      drugType: "syringe",
    },
    {
      id: "5259",
      drugName: "Tetravine Hydrex 150mg",
      inStock: 120,
      price: 14.25,
      expiry: "2026-01-01",
      drugType: "pills",
    },
    {
      id: "5260",
      drugName: "Remorinax Plus 600mg",
      inStock: 65,
      price: 22.75,
      expiry: "2026-06-30",
      drugType: "syrup",
    },
    {
      id: "5261",
      drugName: "Carbotran Aezuline 50mg",
      inStock: 98,
      price: 5.99,
      expiry: "2025-04-12",
      drugType: "pills",
    },
    {
      id: "5262",
      drugName: "Dextroquil Phenate 200mg",
      inStock: 17,
      price: 18.5,
      expiry: "2024-09-05",
      drugType: "syringe",
    },
    {
      id: "5263",
      drugName: "Nortazidine Omephex 400mg",
      inStock: 300,
      price: 27.3,
      expiry: "2026-10-10",
      drugType: "pills",
    },
    {
      id: "5264",
      drugName: "Flumetox Ardanol 80mg",
      inStock: 45,
      price: 11.0,
      expiry: "2025-07-07",
      drugType: "syrup",
    },
  ];

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
