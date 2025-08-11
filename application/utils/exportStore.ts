import { Store } from "@/types";
import { getAllDrugs } from "@/utils/stocksDb";
import { getAllSales } from "@/utils/salesDb";
import { getAllSuppliers } from "@/utils/supplierDb";
import { getAllOrderLists } from "@/utils/orderListDb";
import { getAllHistory } from "@/utils/historyDb";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

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

    const exportData: StoreExportData = {
      store: {
        name: store.name,
        exportDate: new Date().toISOString(),
        version: "1.0.0",
        originalStoreId: store.id,
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
        appVersion: "1.0.0",
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
    const exportResult = await exportStoreData(store, options);

    if (!exportResult.success || !exportResult.data) {
      return {
        success: false,
        error: exportResult.error || "Failed to prepare export data",
      };
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const fileName =
      options.customFileName ||
      `${store.name.replace(/[^a-zA-Z0-9]/g, "_")}_export_${timestamp}.json`;

    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      return {
        success: false,
        error: "Storage permission denied. Cannot save to Downloads folder.",
      };
    }

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName,
      "application/json"
    );

    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(exportResult.data, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    console.log(`✅ Export file created in Downloads: ${fileName}`);

    return {
      success: true,
      filePath: fileUri,
    };
  } catch (error) {
    console.error("❌ Error creating export file:", error);
    return {
      success: false,
      error: error,
    };
  }
};

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
    const fileResult = await exportStoreToFile(store, options);

    if (!fileResult.success || !fileResult.filePath) {
      return {
        success: false,
        error: fileResult.error || "Failed to create export file",
      };
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.log("⚠️ Sharing not available on this device");
      return {
        success: true,
        shared: false,
        error: "Sharing not available on this device, but file was created",
      };
    }

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

    const estimatedSizeKB = Math.ceil(totalRecords * 1.2);
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
