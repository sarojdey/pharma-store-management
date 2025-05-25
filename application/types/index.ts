export interface Drug {
  id: number;
  drugName: string;
  inStock: number;
  price: number;
  expiry: string;
  drugType: "pills" | "syrup" | "syringe";
}
