import {
  validateImportData,
  ValidatedImportData,
} from "@/utils/importValidation";
import { addStore } from "@/utils/storesDb";
import { addDrug } from "@/utils/stocksDb";
import { addSale } from "@/utils/salesDb";
import { addSupplier } from "@/utils/supplierDb";
import { addOrderList } from "@/utils/orderListDb";
import { addHistory } from "@/utils/historyDb";
import { database as db } from "../db/index";

// Interface for import progress callback
interface ImportProgress {
  phase:
    | "validation"
    | "store"
    | "drugs"
    | "sales"
    | "suppliers"
    | "orderLists"
    | "history"
    | "complete";
  current: number;
  total: number;
  message: string;
}

// Interface for ID mapping (old ID -> new ID)
interface IdMapping {
  drugs: Map<number, number>;
  sales: Map<number, number>;
  suppliers: Map<number, number>;
  orderLists: Map<number, number>;
  history: Map<number, number>;
}

/**
 * Import store data from validated JSON
 */
export const importStoreData = async (
  storeName: string,
  validatedData: ValidatedImportData,
  onProgress?: (progress: ImportProgress) => void
): Promise<{
  success: boolean;
  storeId?: number;
  error?: string;
  importSummary?: {
    drugsImported: number;
    salesImported: number;
    suppliersImported: number;
    orderListsImported: number;
    historyImported: number;
  };
}> => {
  try {
    const totalSteps = 6; // validation, store, drugs, sales, suppliers, orderLists, history
    let currentStep = 0;

    // Phase 1: Validation complete (already done)
    currentStep++;
    onProgress?.({
      phase: "validation",
      current: currentStep,
      total: totalSteps,
      message: "Data validation completed",
    });

    // Variables to store results outside the transaction
    let newStoreId!: number; // Definite assignment assertion
    let importSummary!: {
      drugsImported: number;
      salesImported: number;
      suppliersImported: number;
      orderListsImported: number;
      historyImported: number;
    };

    // Use database transaction for atomic import
    await db.withTransactionAsync(async () => {
      const idMapping: IdMapping = {
        drugs: new Map(),
        sales: new Map(),
        suppliers: new Map(),
        orderLists: new Map(),
        history: new Map(),
      };

      // Phase 2: Create the store
      currentStep++;
      onProgress?.({
        phase: "store",
        current: currentStep,
        total: totalSteps,
        message: "Creating store...",
      });

      const storeResult = await addStore({ name: storeName });
      if (!storeResult.success || !storeResult.id) {
        throw new Error("Failed to create store");
      }

      newStoreId = storeResult.id; // Assign to outer scope variable

      // Phase 3: Import drugs (must be first due to foreign key relationships)
      currentStep++;
      const drugsTotal = validatedData.drugs.length;
      let drugsImported = 0;

      for (const drug of validatedData.drugs) {
        const { id, ...drugWithoutId } = drug;

        const drugResult = await addDrug(drugWithoutId, newStoreId);
        if (drugResult.success && drugResult.id) {
          idMapping.drugs.set(id, drugResult.id);
          drugsImported++;
        }

        onProgress?.({
          phase: "drugs",
          current: currentStep,
          total: totalSteps,
          message: `Importing medicines: ${drugsImported}/${drugsTotal}`,
        });
      }

      // Phase 4: Import sales (after drugs, due to medicineId foreign key)
      currentStep++;
      const salesTotal = validatedData.sales.length;
      let salesImported = 0;

      for (const sale of validatedData.sales) {
        const { id, medicineId, ...saleWithoutId } = sale;

        // Map old medicineId to new medicineId
        const newMedicineId = idMapping.drugs.get(medicineId);
        if (!newMedicineId) {
          console.warn(
            `Skipping sale ${id}: medicine ID ${medicineId} not found in mapping`
          );
          continue;
        }

        const saleResult = await addSale(
          { ...saleWithoutId, medicineId: newMedicineId },
          newStoreId
        );

        if (saleResult.success && saleResult.id) {
          idMapping.sales.set(id, saleResult.id);
          salesImported++;
        }

        onProgress?.({
          phase: "sales",
          current: currentStep,
          total: totalSteps,
          message: `Importing sales: ${salesImported}/${salesTotal}`,
        });
      }

      // Phase 5: Import suppliers
      currentStep++;
      const suppliersTotal = validatedData.suppliers.length;
      let suppliersImported = 0;

      for (const supplier of validatedData.suppliers) {
        const { id, ...supplierWithoutId } = supplier;

        const supplierResult = await addSupplier(supplierWithoutId, newStoreId);
        if (supplierResult.success && supplierResult.id) {
          if (id) idMapping.suppliers.set(id, supplierResult.id);
          suppliersImported++;
        }

        onProgress?.({
          phase: "suppliers",
          current: currentStep,
          total: totalSteps,
          message: `Importing suppliers: ${suppliersImported}/${suppliersTotal}`,
        });
      }

      // Phase 6: Import order lists
      currentStep++;
      const orderListsTotal = validatedData.orderLists.length;
      let orderListsImported = 0;

      for (const orderList of validatedData.orderLists) {
        const { id, ...orderListWithoutId } = orderList;

        const orderListResult = await addOrderList(
          orderListWithoutId,
          newStoreId
        );
        if (orderListResult.success && orderListResult.id) {
          idMapping.orderLists.set(id, orderListResult.id);
          orderListsImported++;
        }

        onProgress?.({
          phase: "orderLists",
          current: currentStep,
          total: totalSteps,
          message: `Importing order lists: ${orderListsImported}/${orderListsTotal}`,
        });
      }

      // Phase 7: Import history
      currentStep++;
      const historyTotal = validatedData.history.length;
      let historyImported = 0;

      for (const historyItem of validatedData.history) {
        const { id, ...historyWithoutId } = historyItem;

        const historyResult = await addHistory(historyWithoutId, newStoreId);
        if (historyResult.success && historyResult.id) {
          idMapping.history.set(id, historyResult.id);
          historyImported++;
        }

        onProgress?.({
          phase: "history",
          current: currentStep,
          total: totalSteps,
          message: `Importing history: ${historyImported}/${historyTotal}`,
        });
      }

      // Complete
      onProgress?.({
        phase: "complete",
        current: totalSteps,
        total: totalSteps,
        message: "Import completed successfully!",
      });

      // Store the summary in outer scope variable
      importSummary = {
        drugsImported,
        salesImported,
        suppliersImported,
        orderListsImported,
        historyImported,
      };

      // Don't return anything - withTransactionAsync expects Promise<void>
    });

    console.log("✅ Store import completed successfully:", {
      storeId: newStoreId,
      importSummary,
    });

    return {
      success: true,
      storeId: newStoreId,
      importSummary: importSummary,
    };
  } catch (error: any) {
    console.error("❌ Store import failed:", error);

    return {
      success: false,
      error: error.message || "Import failed due to an unexpected error",
    };
  }
};

/**
 * Import store from JSON file content
 */
export const importStoreFromJson = async (
  storeName: string,
  jsonContent: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<{
  success: boolean;
  storeId?: number;
  error?: string;
  importSummary?: {
    drugsImported: number;
    salesImported: number;
    suppliersImported: number;
    orderListsImported: number;
    historyImported: number;
  };
}> => {
  try {
    // Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(jsonContent);
    } catch (parseError) {
      return {
        success: false,
        error:
          "Invalid JSON format. Please ensure the file is a valid JSON export.",
      };
    }

    onProgress?.({
      phase: "validation",
      current: 1,
      total: 6,
      message: "Validating import data...",
    });

    // Validate the parsed data
    const validationResult = validateImportData(parsedData);

    if (!validationResult.success) {
      const errorMessages =
        validationResult.errors
          ?.map((err) => `${err.field}: ${err.message}`)
          .join("\n") || "Unknown validation error";

      return {
        success: false,
        error: `Import data validation failed:\n\n${errorMessages}`,
      };
    }

    // Import the validated data
    return await importStoreData(storeName, validationResult.data!, onProgress);
  } catch (error: any) {
    console.error("❌ JSON import failed:", error);

    return {
      success: false,
      error: error.message || "Failed to process import file",
    };
  }
};

/**
 * Validate and preview import file without importing
 */
export const previewImportFile = async (
  jsonContent: string
): Promise<{
  success: boolean;
  preview?: {
    storeName: string;
    exportDate: string;
    version: string;
    drugsCount: number;
    salesCount: number;
    suppliersCount: number;
    orderListsCount: number;
    historyCount: number;
    totalRecords: number;
    estimatedImportTime: string;
  };
  errors?: string[];
}> => {
  try {
    // Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(jsonContent);
    } catch (parseError) {
      return {
        success: false,
        errors: ["Invalid JSON format"],
      };
    }

    // Validate the data
    const validationResult = validateImportData(parsedData);

    if (!validationResult.success) {
      return {
        success: false,
        errors: validationResult.errors?.map(
          (err) => `${err.field}: ${err.message}`
        ) || ["Validation failed"],
      };
    }

    const data = validationResult.data!;

    // Estimate import time (rough calculation: ~100 records per second)
    const totalRecords =
      data.drugs.length +
      data.sales.length +
      data.suppliers.length +
      data.orderLists.length +
      data.history.length;
    const estimatedSeconds = Math.max(1, Math.ceil(totalRecords / 100));
    const estimatedTime =
      estimatedSeconds < 60
        ? `${estimatedSeconds} seconds`
        : `${Math.ceil(estimatedSeconds / 60)} minutes`;

    return {
      success: true,
      preview: {
        storeName: data.store.name,
        exportDate: data.store.exportDate,
        version: data.store.version,
        drugsCount: data.drugs.length,
        salesCount: data.sales.length,
        suppliersCount: data.suppliers.length,
        orderListsCount: data.orderLists.length,
        historyCount: data.history.length,
        totalRecords: totalRecords,
        estimatedImportTime: estimatedTime,
      },
    };
  } catch (error: any) {
    console.error("❌ Preview failed:", error);

    return {
      success: false,
      errors: [error.message || "Failed to preview import file"],
    };
  }
};
