import { AddSale, UpdateSale } from "@/types";
import { database as db } from "../db/index";

export const createSalesDb = (): void => {
  try {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        medicineId INTEGER NOT NULL,
        medicineName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPerPackage INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (medicineId) REFERENCES drugs(id)
      );
        `);
    console.log("Sales table created or already exists.");
  } catch (error) {
    console.error("Error initializing sales database:", error);
    throw error;
  }
};

export const getAllSales = async (storeId: number) => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM sales WHERE store_id = ? ORDER BY createdAt DESC",
      [storeId]
    );
    return result;
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};

export const getSaleById = async (id: number, storeId: number) => {
  try {
    const result = await db.getFirstAsync(
      "SELECT * FROM sales WHERE id = ? AND store_id = ?",
      [id, storeId]
    );
    return result;
  } catch (error) {
    console.error("Error fetching sale:", error);
    return null;
  }
};

export const addSale = async (saleData: AddSale, storeId: number) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO sales (
        store_id,
        medicineId,
        medicineName,
        quantity,
        unitPerPackage,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        storeId,
        saleData.medicineId,
        saleData.medicineName,
        saleData.quantity,
        saleData.unitPerPackage,
      ]
    );
    console.log("Sale added successfully with ID:", result.lastInsertRowId);
    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error("Error adding sale:", error);
    return { success: false, error };
  }
};

export const updateSale = async (
  id: number,
  saleData: UpdateSale,
  storeId: number
) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(saleData).forEach(([key, value]) => {
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
      `UPDATE sales SET ${fields.join(", ")} WHERE id = ? AND store_id = ?`,
      values
    );
    console.log("Sale updated successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error updating sale:", error);
    return { success: false, error };
  }
};

export const deleteSale = async (id: number, storeId: number) => {
  try {
    const result = await db.runAsync(
      "DELETE FROM sales WHERE id = ? AND store_id = ?",
      [id, storeId]
    );

    console.log("Sale deleted successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error deleting sale:", error);
    return { success: false, error };
  }
};

export const searchSales = async ({
  storeId,
  searchTerm = "",
  sortBy = "createdAt",
  sortOrder = "DESC",
  dateRange,
}: {
  storeId: number;
  searchTerm?: string;
  sortBy?: "id" | "medicineName" | "quantity" | "createdAt";
  sortOrder?: "ASC" | "DESC";
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}) => {
  try {
    const conditions: string[] = ["store_id = ?"];
    const values: any[] = [storeId];

    if (searchTerm) {
      conditions.push("medicineName LIKE ?");
      values.push(`%${searchTerm}%`);
    }

    if (dateRange) {
      conditions.push("date(createdAt) BETWEEN ? AND ?");
      values.push(dateRange.startDate, dateRange.endDate);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const validSortColumns = ["id", "medicineName", "quantity", "createdAt"];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
    const validSortOrder = sortOrder === "ASC" ? "ASC" : "DESC";
    const orderByClause = `ORDER BY ${safeSortBy} ${validSortOrder}`;

    const query = `SELECT * FROM sales ${whereClause} ${orderByClause}`;
    const result = await db.getAllAsync(query, values);

    return result;
  } catch (error) {
    console.error("Error in sales search:", error);
    return [];
  }
};

export const getSalesByMedicine = async (
  medicineId: number,
  storeId: number
) => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM sales WHERE medicineId = ? AND store_id = ? ORDER BY createdAt DESC",
      [medicineId, storeId]
    );
    return result;
  } catch (error) {
    console.error("Error fetching sales by medicine:", error);
    return [];
  }
};

export const resetSalesDb = (): void => {
  try {
    db.execSync("DROP TABLE IF EXISTS sales");
    createSalesDb();
    console.log("Sales table reset successfully.");
  } catch (error) {
    console.error("Error resetting sales table:", error);
    throw error;
  }
};

export const getSalesCountByStore = async (
  storeId: number
): Promise<number> => {
  try {
    const result = (await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM sales WHERE store_id = ?",
      [storeId]
    )) as { count: number };
    return result.count;
  } catch (error) {
    console.error("Error getting sales count:", error);
    return 0;
  }
};
