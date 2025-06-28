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

// db types

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
