import { Store } from "@/types";
import { getAllDrugs } from "@/utils/stocksDb";
import { getAllSales } from "@/utils/salesDb";
import { getAllSuppliers } from "@/utils/supplierDb";
import { getAllOrderLists } from "@/utils/orderListDb";
import { getAllHistory } from "@/utils/historyDb";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// Define the export data structure
interface StoreExportData {
  store: {
    name: string;
    exportDate: string;
    version: string;
    originalStoreId: number;
  };
  drugs: any[];
  sales: any[];
  suppliers: any[];
  orderLists: any[];
  history: any[];
  metadata: {
    totalRecords: number;
    exportedBy: string;
    appVersion?: string;
  };
}

/**
 * Export all data for a specific store to JSON format
 */
export const exportStoreData = async (
  store: Store,
  options: {
    includeHistory?: boolean;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  } = {}
): Promise<{
  success: boolean;
  data?: StoreExportData;
  error?: any;
  filePath?: string;
}> => {
  try {
    console.log(
      `🔄 Starting export for store: ${store.name} (ID: ${store.id})`
    );

    const { includeHistory = true, dateRange } = options;

    // Fetch all data in parallel for better performance
    const [drugs, sales, suppliers, orderLists, history] = await Promise.all([
      getAllDrugs(store.id),
      getAllSales(store.id),
      getAllSuppliers(store.id),
      getAllOrderLists(store.id),
      includeHistory
        ? dateRange
          ? getAllHistory(
              store.id,
              "desc",
              dateRange.startDate,
              dateRange.endDate
            )
          : getAllHistory(store.id, "desc")
        : [],
    ]);

    // Clean the data - remove store_id from records since it will be reassigned on import
    const cleanedDrugs = (drugs as any[]).map(({ store_id, ...drug }) => drug);
    const cleanedSales = (sales as any[]).map(({ store_id, ...sale }) => sale);
    const cleanedSuppliers = (suppliers as any[]).map(
      ({ store_id, ...supplier }) => supplier
    );
    const cleanedOrderLists = (orderLists as any[]).map(
      ({ store_id, ...orderList }) => orderList
    );
    const cleanedHistory = (history as any[]).map(
      ({ store_id, ...historyItem }) => historyItem
    );

    // Create export data structure
    const exportData: StoreExportData = {
      store: {
        name: store.name,
        exportDate: new Date().toISOString(),
        version: "1.0.0", // Schema version for future compatibility
        originalStoreId: store.id, // Keep reference to original ID
      },
      drugs: cleanedDrugs,
      sales: cleanedSales,
      suppliers: cleanedSuppliers,
      orderLists: cleanedOrderLists,
      history: cleanedHistory,
      metadata: {
        totalRecords:
          cleanedDrugs.length +
          cleanedSales.length +
          cleanedSuppliers.length +
          cleanedOrderLists.length +
          cleanedHistory.length,
        exportedBy: "Medicine Stockist App",
        appVersion: "1.0.0", // You can get this from app.json or package.json
      },
    };

    console.log(`✅ Export data prepared:`, {
      drugs: cleanedDrugs.length,
      sales: cleanedSales.length,
      suppliers: cleanedSuppliers.length,
      orderLists: cleanedOrderLists.length,
      history: cleanedHistory.length,
      totalRecords: exportData.metadata.totalRecords,
    });

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    console.error("❌ Error exporting store data:", error);
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * Export store data and save as JSON file
 */
export const exportStoreToFile = async (
  store: Store,
  options: {
    includeHistory?: boolean;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    customFileName?: string;
  } = {}
): Promise<{ success: boolean; filePath?: string; error?: any }> => {
  try {
    // Get export data
    const exportResult = await exportStoreData(store, options);

    if (!exportResult.success || !exportResult.data) {
      return {
        success: false,
        error: exportResult.error || "Failed to prepare export data",
      };
    }

    // Generate filename
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const fileName =
      options.customFileName ||
      `${store.name.replace(/[^a-zA-Z0-9]/g, "_")}_export_${timestamp}.json`;

    // Create file path
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // Write JSON to file
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(exportResult.data, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    console.log(`✅ Export file created: ${filePath}`);

    return {
      success: true,
      filePath: filePath,
    };
  } catch (error) {
    console.error("❌ Error creating export file:", error);
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * Export store data and share the file
 */
export const exportAndShareStoreData = async (
  store: Store,
  options: {
    includeHistory?: boolean;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    customFileName?: string;
  } = {}
): Promise<{ success: boolean; shared?: boolean; error?: any }> => {
  try {
    // Export to file
    const fileResult = await exportStoreToFile(store, options);

    if (!fileResult.success || !fileResult.filePath) {
      return {
        success: false,
        error: fileResult.error || "Failed to create export file",
      };
    }

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.log("⚠️ Sharing not available on this device");
      return {
        success: true,
        shared: false,
        error: "Sharing not available on this device, but file was created",
      };
    }

    // Share the file
    await Sharing.shareAsync(fileResult.filePath, {
      mimeType: "application/json",
      dialogTitle: `Export: ${store.name}`,
    });

    console.log("✅ File shared successfully");

    return {
      success: true,
      shared: true,
    };
  } catch (error) {
    console.error("❌ Error sharing export file:", error);
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * Get export preview/summary without creating file
 */
export const getExportPreview = async (
  storeId: number
): Promise<{
  success: boolean;
  preview?: {
    drugs: number;
    sales: number;
    suppliers: number;
    orderLists: number;
    history: number;
    totalRecords: number;
    estimatedFileSize: string;
  };
  error?: any;
}> => {
  try {
    // Get counts from each table
    const [drugs, sales, suppliers, orderLists, history] = await Promise.all([
      getAllDrugs(storeId),
      getAllSales(storeId),
      getAllSuppliers(storeId),
      getAllOrderLists(storeId),
      getAllHistory(storeId, "desc"),
    ]);

    const totalRecords =
      drugs.length +
      sales.length +
      suppliers.length +
      orderLists.length +
      history.length;

    // Rough estimate of file size (each record ~1KB JSON)
    const estimatedSizeKB = Math.ceil(totalRecords * 1.2); // 20% overhead for JSON structure
    const estimatedFileSize =
      estimatedSizeKB > 1024
        ? `${(estimatedSizeKB / 1024).toFixed(1)} MB`
        : `${estimatedSizeKB} KB`;

    return {
      success: true,
      preview: {
        drugs: drugs.length,
        sales: sales.length,
        suppliers: suppliers.length,
        orderLists: orderLists.length,
        history: history.length,
        totalRecords,
        estimatedFileSize,
      },
    };
  } catch (error) {
    console.error("❌ Error getting export preview:", error);
    return {
      success: false,
      error: error,
    };
  }
};
