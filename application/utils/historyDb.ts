import { History } from "@/types";
import { database as db } from "../db/index";

export type SortOrder = "asc" | "desc";

export const createHistoryDb = (): void => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("History table created or already exists.");
  } catch (error) {
    console.error("Error creating history table:", error);
    throw error;
  }
};

export const getAllHistory = async (
  sortOrder: SortOrder = "desc",
  startDate?: string,
  endDate?: string
): Promise<History[]> => {
  try {
    let query = "SELECT * FROM history";
    const params: string[] = [];

    if (startDate && endDate) {
      query += " WHERE DATE(createdAt) BETWEEN DATE(?) AND DATE(?)";
      params.push(startDate, endDate);
    } else if (startDate) {
      query += " WHERE DATE(createdAt) >= DATE(?)";
      params.push(startDate);
    } else if (endDate) {
      query += " WHERE DATE(createdAt) <= DATE(?)";
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
  startDate: string,
  endDate: string,
  sortOrder: SortOrder = "desc"
): Promise<History[]> => {
  try {
    const query = `
      SELECT * FROM history 
      WHERE DATE(createdAt) BETWEEN DATE(?) AND DATE(?)
      ORDER BY createdAt ${sortOrder.toUpperCase()}
    `;

    const result = await db.getAllAsync(query, [startDate, endDate]);
    return result as History[];
  } catch (error) {
    console.error("Error fetching filtered history:", error);
    return [];
  }
};

export const getSortedHistory = async (
  sortOrder: SortOrder = "desc"
): Promise<History[]> => {
  try {
    const query = `SELECT * FROM history ORDER BY createdAt ${sortOrder.toUpperCase()}`;
    const result = await db.getAllAsync(query);
    return result as History[];
  } catch (error) {
    console.error("Error fetching sorted history:", error);
    return [];
  }
};

export const getHistoryByDateRange = async (
  startDate: string,
  endDate: string
): Promise<History[]> => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM history WHERE DATE(createdAt) BETWEEN DATE(?) AND DATE(?) ORDER BY createdAt DESC",
      [startDate, endDate]
    );
    return result as History[];
  } catch (error) {
    console.error("Error fetching history by date range:", error);
    return [];
  }
};

export const getHistoryByDate = async (date: string): Promise<History[]> => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM history WHERE DATE(createdAt) = DATE(?) ORDER BY createdAt DESC",
      [date]
    );
    return result as History[];
  } catch (error) {
    console.error("Error fetching history by date:", error);
    return [];
  }
};

export const addHistory = async (
  history: Omit<History, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO history (operation, createdAt, updatedAt) 
       VALUES (?, datetime('now'), datetime('now'))`,
      [history.operation]
    );

    console.log("History added successfully with ID:", result.lastInsertRowId);
    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error("Error adding history:", error);
    return { success: false, error };
  }
};

export const deleteHistory = async (id: number) => {
  try {
    const result = await db.runAsync("DELETE FROM history WHERE id = ?", [id]);

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
