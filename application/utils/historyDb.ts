import { History } from "@/types";
import { database as db } from "../db/index";

export type SortOrder = "asc" | "desc";

export const createHistoryDb = (): void => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        operation TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );
    `);

    console.log("History table created or already exists.");
  } catch (error) {
    console.error("Error creating history table:", error);
    throw error;
  }
};

export const getAllHistory = async (
  storeId: number,
  sortOrder: SortOrder = "desc",
  startDate?: string,
  endDate?: string
): Promise<History[]> => {
  try {
    let query = "SELECT * FROM history WHERE store_id = ?";
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

    query += ` ORDER BY createdAt ${sortOrder.toUpperCase()}`;

    const result = await db.getAllAsync(query, params);
    return result as History[];
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};

export const getFilteredHistory = async (
  storeId: number,
  startDate: string,
  endDate: string,
  sortOrder: SortOrder = "desc"
): Promise<History[]> => {
  try {
    const query = `
      SELECT * FROM history 
      WHERE store_id = ? AND DATE(createdAt) BETWEEN DATE(?) AND DATE(?)
      ORDER BY createdAt ${sortOrder.toUpperCase()}
    `;

    const result = await db.getAllAsync(query, [storeId, startDate, endDate]);
    return result as History[];
  } catch (error) {
    console.error("Error fetching filtered history:", error);
    return [];
  }
};

export const getSortedHistory = async (
  storeId: number,
  sortOrder: SortOrder = "desc"
): Promise<History[]> => {
  try {
    const query = `SELECT * FROM history WHERE store_id = ? ORDER BY createdAt ${sortOrder.toUpperCase()}`;
    const result = await db.getAllAsync(query, [storeId]);
    return result as History[];
  } catch (error) {
    console.error("Error fetching sorted history:", error);
    return [];
  }
};

export const getHistoryByDateRange = async (
  storeId: number,
  startDate: string,
  endDate: string
): Promise<History[]> => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM history WHERE store_id = ? AND DATE(createdAt) BETWEEN DATE(?) AND DATE(?) ORDER BY createdAt DESC",
      [storeId, startDate, endDate]
    );
    return result as History[];
  } catch (error) {
    console.error("Error fetching history by date range:", error);
    return [];
  }
};

export const getHistoryByDate = async (
  storeId: number,
  date: string
): Promise<History[]> => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM history WHERE store_id = ? AND DATE(createdAt) = DATE(?) ORDER BY createdAt DESC",
      [storeId, date]
    );
    return result as History[];
  } catch (error) {
    console.error("Error fetching history by date:", error);
    return [];
  }
};

export const addHistory = async (
  history: Omit<History, "id" | "createdAt" | "updatedAt">,
  storeId: number
) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO history (store_id, operation, createdAt, updatedAt) 
       VALUES (?, ?, datetime('now'), datetime('now'))`,
      [storeId, history.operation]
    );

    console.log("History added successfully with ID:", result.lastInsertRowId);
    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error("Error adding history:", error);
    return { success: false, error };
  }
};

export const deleteHistory = async (id: number, storeId: number) => {
  try {
    const result = await db.runAsync(
      "DELETE FROM history WHERE id = ? AND store_id = ?",
      [id, storeId]
    );

    console.log("History deleted successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error deleting history:", error);
    return { success: false, error };
  }
};

export const resetHistoryDb = (): void => {
  try {
    db.execSync("DROP TABLE IF EXISTS history");
    createHistoryDb();
    console.log("History table reset successfully.");
  } catch (error) {
    console.error("Error resetting history table:", error);
    throw error;
  }
};

export const getHistoryCountByStore = async (
  storeId: number
): Promise<number> => {
  try {
    const result = (await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM history WHERE store_id = ?",
      [storeId]
    )) as { count: number };
    return result.count;
  } catch (error) {
    console.error("Error getting history count:", error);
    return 0;
  }
};
