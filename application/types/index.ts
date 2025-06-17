export interface Drug {
  id: number;
  idCode: string;
  medicineName: string;
  quantity: number;
  price: number;
  mrp: number;
  expiryDate: string;
  medicineType: string;
  batchNo?: string | null;
  distributorName?: string | null;
  purchaseInvoiceNumber?: string | null;
}

export interface Supplier {
  id?: number;
  supplierName: string;
  location: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
}
