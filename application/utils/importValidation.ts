import { z } from "zod";

// Individual entity schemas (without store_id as they'll be added during import)
const DrugSchema = z.object({
  id: z.number(),
  medicineName: z.string().min(1, "Medicine name is required"),
  price: z.number().positive("Price must be positive"),
  mrp: z.number().positive("MRP must be positive"),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  unitPerPackage: z
    .number()
    .int()
    .positive("Unit per package must be positive"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  medicineType: z.string().min(1, "Medicine type is required"),
  rackNo: z.string().nullable().optional(),
  batchNo: z.string().nullable().optional(),
  distributorName: z.string().nullable().optional(),
  purchaseInvoiceNumber: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const SaleSchema = z.object({
  id: z.number(),
  medicineId: z.number(),
  medicineName: z.string().min(1, "Medicine name is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPerPackage: z
    .number()
    .int()
    .positive("Unit per package must be positive"),
  price: z.number().positive("Price must be positive"),
  mrp: z.number().positive("MRP must be positive"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const SupplierSchema = z.object({
  id: z.number().optional(),
  supplierName: z.string().min(1, "Supplier name is required"),
  location: z.string().min(1, "Location is required"),
  phone: z
    .string()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const OrderListSchema = z.object({
  id: z.number(),
  supplierName: z.string().nullable().optional(),
  medicineName: z.string().min(1, "Medicine name is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const HistorySchema = z.object({
  id: z.number(),
  operation: z.string().min(1, "Operation is required"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Store information schema
const StoreInfoSchema = z.object({
  name: z
    .string()
    .min(1, "Store name is required")
    .max(100, "Store name too long"),
  exportDate: z.string().datetime("Invalid export date format"),
  version: z.string().min(1, "Version is required"),
  originalStoreId: z.number().positive("Original store ID must be positive"),
});

// Metadata schema
const MetadataSchema = z.object({
  totalRecords: z.number().int().min(0, "Total records must be non-negative"),
  exportedBy: z.string().min(1, "Exported by is required"),
  appVersion: z.string().optional(),
});

// Main export data schema
export const StoreImportSchema = z
  .object({
    store: StoreInfoSchema,
    drugs: z.array(DrugSchema),
    sales: z.array(SaleSchema),
    suppliers: z.array(SupplierSchema),
    orderLists: z.array(OrderListSchema),
    history: z.array(HistorySchema),
    metadata: MetadataSchema,
  })
  .refine(
    (data) => {
      // Verify that the total records in metadata matches actual data
      const actualTotal =
        data.drugs.length +
        data.sales.length +
        data.suppliers.length +
        data.orderLists.length +
        data.history.length;
      return actualTotal === data.metadata.totalRecords;
    },
    {
      message: "Metadata total records doesn't match actual data count",
      path: ["metadata", "totalRecords"],
    }
  )
  .refine(
    (data) => {
      // Verify that medicineId in sales references exist in drugs
      const drugIds = new Set(data.drugs.map((drug) => drug.id));
      const invalidSales = data.sales.filter(
        (sale) => !drugIds.has(sale.medicineId)
      );
      return invalidSales.length === 0;
    },
    {
      message: "Some sales reference non-existent medicine IDs",
      path: ["sales"],
    }
  )
  .refine(
    (data) => {
      // Verify that drug IDs are unique
      const drugIds = data.drugs.map((drug) => drug.id);
      const uniqueDrugIds = new Set(drugIds);
      return drugIds.length === uniqueDrugIds.size;
    },
    {
      message: "Duplicate drug IDs found",
      path: ["drugs"],
    }
  )
  .refine(
    (data) => {
      // Verify that sale IDs are unique
      const saleIds = data.sales.map((sale) => sale.id);
      const uniqueSaleIds = new Set(saleIds);
      return saleIds.length === uniqueSaleIds.size;
    },
    {
      message: "Duplicate sale IDs found",
      path: ["sales"],
    }
  )
  .refine(
    (data) => {
      // Verify version compatibility (can be extended for future versions)
      const supportedVersions = ["1.0.0"];
      return supportedVersions.includes(data.store.version);
    },
    {
      message: "Unsupported export version",
      path: ["store", "version"],
    }
  );

// Type inference from the schema
export type ValidatedImportData = z.infer<typeof StoreImportSchema>;

// Validation function with detailed error reporting
export const validateImportData = (
  data: unknown
): {
  success: boolean;
  data?: ValidatedImportData;
  errors?: {
    field: string;
    message: string;
  }[];
} => {
  try {
    const validatedData = StoreImportSchema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return {
        success: false,
        errors: formattedErrors,
      };
    }

    return {
      success: false,
      errors: [
        {
          field: "unknown",
          message: "An unexpected validation error occurred",
        },
      ],
    };
  }
};

// Utility function to check if import data is valid before processing
export const isValidImportFormat = (
  data: unknown
): data is ValidatedImportData => {
  try {
    StoreImportSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

// Utility function to get a summary of import data without full validation
export const getImportSummary = (
  data: any
): {
  success: boolean;
  summary?: {
    storeName: string;
    exportDate: string;
    version: string;
    drugsCount: number;
    salesCount: number;
    suppliersCount: number;
    orderListsCount: number;
    historyCount: number;
    totalRecords: number;
  };
  error?: string;
} => {
  try {
    if (!data || typeof data !== "object") {
      return { success: false, error: "Invalid data format" };
    }

    // Basic structure check
    if (
      !data.store ||
      !data.drugs ||
      !data.sales ||
      !data.suppliers ||
      !data.orderLists ||
      !data.history ||
      !data.metadata
    ) {
      return { success: false, error: "Missing required data sections" };
    }

    return {
      success: true,
      summary: {
        storeName: data.store.name || "Unknown Store",
        exportDate: data.store.exportDate || "Unknown Date",
        version: data.store.version || "Unknown Version",
        drugsCount: Array.isArray(data.drugs) ? data.drugs.length : 0,
        salesCount: Array.isArray(data.sales) ? data.sales.length : 0,
        suppliersCount: Array.isArray(data.suppliers)
          ? data.suppliers.length
          : 0,
        orderListsCount: Array.isArray(data.orderLists)
          ? data.orderLists.length
          : 0,
        historyCount: Array.isArray(data.history) ? data.history.length : 0,
        totalRecords: data.metadata.totalRecords || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to parse import data structure",
    };
  }
};

// Utility function for partial validation (useful for progressive validation)
export const validateImportSection = (
  section:
    | "store"
    | "drugs"
    | "sales"
    | "suppliers"
    | "orderLists"
    | "history"
    | "metadata",
  data: unknown
): { success: boolean; errors?: string[] } => {
  try {
    switch (section) {
      case "store":
        StoreInfoSchema.parse(data);
        break;
      case "drugs":
        z.array(DrugSchema).parse(data);
        break;
      case "sales":
        z.array(SaleSchema).parse(data);
        break;
      case "suppliers":
        z.array(SupplierSchema).parse(data);
        break;
      case "orderLists":
        z.array(OrderListSchema).parse(data);
        break;
      case "history":
        z.array(HistorySchema).parse(data);
        break;
      case "metadata":
        MetadataSchema.parse(data);
        break;
      default:
        return { success: false, errors: ["Unknown section"] };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        ),
      };
    }

    return {
      success: false,
      errors: ["Validation failed"],
    };
  }
};
