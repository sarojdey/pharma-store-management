export interface Drug {
  id: number;
  medicineName: string;
  batchId: string;
  price: number;
  mrp: number;
  quantity: number;
  unitPerPackage: number;
  expiryDate: string;
  medicineType: string;
  batchNo?: string | null;
  distributorName?: string | null;
  purchaseInvoiceNumber?: string | null;
}

export interface AddDrug {
  medicineName: string;
  batchId: string;
  price: number;
  mrp: number;
  quantity: number;
  unitPerPackage: number;
  expiryDate: string;
  medicineType: string;
  batchNo?: string | null;
  distributorName?: string | null;
  purchaseInvoiceNumber?: string | null;
}

export interface UpdateDrug {
  medicineName?: string;
  batchId?: string;
  price?: number;
  mrp?: number;
  quantity?: number;
  unitPerPackage?: number;
  expiryDate?: string;
  medicineType?: string;
  batchNo?: string;
  distributorName?: string;
  purchaseInvoiceNumber?: string;
}

export interface Supplier {
  id?: number;
  supplierName: string;
  location: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface History {
  id: number;
  operation: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderList {
  id: number;
  supplierName?: string;
  medicineName: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: number;
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPerPackage: number;
  price: number;
  mrp: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddSale {
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPerPackage: number;
  price: number;
  mrp: number;
}

export interface UpdateSale {
  medicineId?: number;
  medicineName?: string;
  quantity?: number;
  unitPerPackage?: number;
  price?: number;
  mrp?: number;
}

export interface Store {
  id: number;
  name: string;
  createdAt: string;
}

export interface AddStore {
  name: string;
}
