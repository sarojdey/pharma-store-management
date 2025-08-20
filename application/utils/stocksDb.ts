import { AddDrug, Drug, UpdateDrug } from "@/types";
import { database as db } from "../db/index";

import mockData from "../assets/mock/stocks.json";

export const bulkInsertMockDrugsWithTransaction = async (storeId: number) => {
  try {
    console.log(
      `Starting transaction-based bulk insert of ${mockData.length} drugs...`
    );

    await db.withTransactionAsync(async () => {
      const insertQuery = `
        INSERT INTO drugs (
          store_id,
          medicineName,
          price,
          mrp,
          quantity,
          unitPerPackage,
          expiryDate,
          medicineType,
          rackNo,
          batchNo,
          distributorName,
          purchaseInvoiceNumber,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      for (const drug of mockData) {
        await db.runAsync(insertQuery, [
          storeId,
          drug.medicineName,
          drug.price,
          drug.mrp,
          drug.quantity,
          drug.unitPerPackage,
          drug.expiryDate,
          drug.medicineType,
          drug.rackNo || null,
          drug.batchNo || null,
          drug.distributorName || null,
          drug.purchaseInvoiceNumber || null,
        ]);
      }
    });

    console.log(
      `✓ Successfully inserted all ${mockData.length} drugs using transaction`
    );
    return {
      success: true,
      count: mockData.length,
      message: `Successfully added all ${mockData.length} drugs`,
    };
  } catch (error) {
    console.error("Transaction failed, rolling back:", error);
    return {
      success: false,
      error: error,
      message: "Bulk insert failed, transaction rolled back",
    };
  }
};

export const seedDatabase = async (storeId: number) => {
  try {
    const drugCount = (await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM drugs WHERE store_id = ?",
      [storeId]
    )) as { count: number };

    if (drugCount.count > 0) {
      console.log(
        `Store ${storeId} already has ${drugCount.count} drugs. Skipping seed.`
      );
      return {
        success: false,
        message: `Store already has ${drugCount.count} drugs`,
      };
    }
    const result = await bulkInsertMockDrugsWithTransaction(storeId);
    return result;
  } catch (error) {
    console.error("Error seeding database:", error);
    return {
      success: false,
      error: error,
      message: "Database seeding failed",
    };
  }
};

interface GroupedStock {
  medicineName: string;
  price: number;
  mrp: number;
  unitPerPackage: number;
  quantity: number;
}

export const createStocksDb = (): void => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS drugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        medicineName TEXT NOT NULL,
        price REAL NOT NULL,
        mrp REAL NOT NULL,
        quantity INTEGER NOT NULL,
        unitPerPackage INTEGER NOT NULL DEFAULT 1,
        expiryDate TEXT NOT NULL,
        medicineType TEXT NOT NULL,
        rackNo TEXT,
        batchNo TEXT,
        distributorName TEXT,
        purchaseInvoiceNumber TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );
    `);
    console.log("Drugs table created or already exists.");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export const getAllDrugs = async (storeId: number) => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM drugs WHERE store_id = ? ORDER BY createdAt ASC",
      [storeId]
    );
    return result;
  } catch (error) {
    console.error("Error fetching drugs:", error);
    return [];
  }
};

export const getDrugById = async (
  id: number,
  storeId: number
): Promise<Drug | null> => {
  try {
    const result = await db.getFirstAsync(
      "SELECT * FROM drugs WHERE id = ? AND store_id = ?",
      [id, storeId]
    );
    return result as Drug;
  } catch (error) {
    console.error("Error fetching drug:", error);
    return null;
  }
};

export const addDrug = async (drugData: AddDrug, storeId: number) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO drugs (
        store_id,
        medicineName,
        price,
        mrp,
        quantity,
        unitPerPackage,
        expiryDate,
        medicineType,
        rackNo,
        batchNo,
        distributorName,
        purchaseInvoiceNumber,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        storeId,
        drugData.medicineName,
        drugData.price,
        drugData.mrp,
        drugData.quantity,
        drugData.unitPerPackage,
        drugData.expiryDate,
        drugData.medicineType,
        drugData.rackNo ?? null,
        drugData.batchNo ?? null,
        drugData.distributorName ?? null,
        drugData.purchaseInvoiceNumber ?? null,
      ]
    );
    console.log("Drug added successfully with ID:", result.lastInsertRowId);
    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error("Error adding drug:", error);
    return { success: false, error };
  }
};

export const updateDrug = async (
  id: number,
  drugData: UpdateDrug,
  storeId: number
) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(drugData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return { success: false, error: "No fields to update" };
    }

    fields.push("updatedAt = datetime('now')");
    values.push(id, storeId);

    const result = await db.runAsync(
      `UPDATE drugs SET ${fields.join(", ")} WHERE id = ? AND store_id = ?`,
      values
    );
    console.log("Drug updated successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error updating drug:", error);
    return { success: false, error };
  }
};

export const deleteDrug = async (id: number, storeId: number) => {
  try {
    const result = await db.runAsync(
      "DELETE FROM drugs WHERE id = ? AND store_id = ?",
      [id, storeId]
    );
    console.log("Drug deleted successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error deleting drug:", error);
    return { success: false, error };
  }
};

export const searchDrugs = async ({
  storeId,
  searchTerm = "",
  mode = "inventory",
  filterBy,
  filterValue,
  sortBy,
}: {
  storeId: number;
  searchTerm?: string;
  mode?:
    | "inventory"
    | "noStockAlert"
    | "lowStockAlert"
    | "expiringAlert"
    | "expiredAlert";
  filterBy?: "expiryDate" | "quantity";
  filterValue?: string | number | [string | number, string | number];
  sortBy?: string;
}) => {
  try {
    const conditions: string[] = ["store_id = ?"];
    const values: any[] = [storeId];

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const futureDateStr = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Handle date filtering based on mode and user filters
    const hasDateFilter = filterBy === "expiryDate" && filterValue !== undefined;

    switch (mode) {
      case "noStockAlert":
        conditions.push("quantity = 0");
        break;
      case "lowStockAlert":
        conditions.push("quantity > 0 AND quantity <= 30");
        break;
      case "expiredAlert":
        if (hasDateFilter) {
          // For expired mode with filter: apply filter but only on expired items
          if (Array.isArray(filterValue) && filterValue.length === 2) {
            conditions.push("expiryDate < ? AND expiryDate BETWEEN ? AND ?");
            values.push(todayStr, filterValue[0], filterValue[1]);
          } else {
            conditions.push("expiryDate < ? AND expiryDate = ?");
            values.push(todayStr, filterValue);
          }
        } else {
          // Default: return only expired items
          conditions.push("expiryDate < ?");
          values.push(todayStr);
        }
        break;
      case "expiringAlert":
        if (hasDateFilter) {
          // For expiring mode with filter: apply filter but ensure no expired items
          if (Array.isArray(filterValue) && filterValue.length === 2) {
            conditions.push("expiryDate >= ? AND expiryDate BETWEEN ? AND ?");
            values.push(todayStr, filterValue[0], filterValue[1]);
          } else {
            conditions.push("expiryDate >= ? AND expiryDate = ?");
            values.push(todayStr, filterValue);
          }
        } else {
          // Default: return only expiring items (30 days from today)
          conditions.push("expiryDate BETWEEN ? AND ?");
          values.push(todayStr, futureDateStr);
        }
        break;
    }

    if (searchTerm) {
      conditions.push("(medicineName LIKE ?)");
      values.push(`%${searchTerm}%`);
    }

    // Handle non-date filters (like quantity)
    if (filterBy && filterValue !== undefined && filterBy !== "expiryDate") {
      const validFilterColumns = ["quantity"];
      if (!validFilterColumns.includes(filterBy)) {
        throw new Error(`Invalid filterBy value: ${filterBy}`);
      }

      if (Array.isArray(filterValue) && filterValue.length === 2) {
        conditions.push(`${filterBy} BETWEEN ? AND ?`);
        values.push(filterValue[0], filterValue[1]);
      } else {
        conditions.push(`${filterBy} = ?`);
        values.push(filterValue);
      }
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const validSortColumns = [
      "id",
      "medicineName",
      "quantity",
      "expiryDate",
      "price",
    ];
    const safeSortBy =
      sortBy && validSortColumns.includes(sortBy) ? sortBy : "id";
    const orderByClause = `ORDER BY ${safeSortBy}`;

    const query = `SELECT * FROM drugs ${whereClause} ${orderByClause}`;
    const result = await db.getAllAsync(query, values);

    return result;
  } catch (error) {
    console.error("Error in drug search:", error);
    return [];
  }
};

export const resetStocksDb = (): void => {
  try {
    db.execSync("DROP TABLE IF EXISTS drugs");
    createStocksDb();
    console.log("Database reset successfully.");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
};

export const getDrugCountByStore = async (storeId: number): Promise<number> => {
  try {
    const result = (await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM drugs WHERE store_id = ?",
      [storeId]
    )) as { count: number };
    return result.count;
  } catch (error) {
    console.error("Error getting drug count:", error);
    return 0;
  }
};

export const getStockReport = async (
  storeId: number,
  startDate?: string,
  endDate?: string
): Promise<GroupedStock[]> => {
  try {
    let query = `SELECT 
      medicineName,
      price,
      mrp,
      unitPerPackage,
      SUM(quantity) as quantity
    FROM drugs 
    WHERE store_id = ?`;

    const params: any[] = [storeId];

    if (startDate && endDate) {
      query += " AND DATE(createdAt) BETWEEN DATE(?) AND DATE(?)";
      params.push(startDate, endDate);
    } else if (startDate) {
      query += " AND DATE(createdAt) >= DATE(?)";
      params.push(startDate);
    } else if (endDate) {
      query += " AND DATE(createdAt) <= DATE(?)";
      params.push(endDate);
    }

    query += ` GROUP BY medicineName, price, mrp, unitPerPackage
    ORDER BY medicineName`;

    const result = await db.getAllAsync(query, params);

    return result as GroupedStock[];
  } catch (error) {
    console.error("Error fetching stock report:", error);
    return [];
  }
};

export const getStockForExport = async (
  storeId: number
): Promise<{ medicineName: string; rackNo: string | null }[]> => {
  try {
    const query = `SELECT 
      medicineName,
      rackNo
    FROM drugs 
    WHERE store_id = ?
    GROUP BY medicineName, rackNo
    ORDER BY medicineName, rackNo`;

    const result = await db.getAllAsync(query, [storeId]);
    return result as { medicineName: string; rackNo: string | null }[];
  } catch (error) {
    console.error("Error fetching stock for export:", error);
    return [];
  }
};
