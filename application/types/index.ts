export interface Drug {
  id: string;
  drugName: string;
  inStock: number;
  price: number;
  expiry: string;
  drugType: "pills" | "syrup" | "syringe";
}
