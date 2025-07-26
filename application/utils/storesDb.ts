import { AddStore, Store } from "@/types";
import { database as db } from "../db/index";

export const createStoresDb = (): void => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Stores table created or already exists.");
  } catch (error) {
    console.error("Error creating stores table:", error);
    throw error;
  }
};

export const getAllStores = async (): Promise<Store[]> => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM stores ORDER BY createdAt ASC"
    );
    return result as Store[];
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
};

export const getStoreById = async (id: number): Promise<Store | null> => {
  try {
    const result = await db.getFirstAsync("SELECT * FROM stores WHERE id = ?", [
      id,
    ]);
    return result as Store | null;
  } catch (error) {
    console.error("Error fetching store:", error);
    return null;
  }
};

export const addStore = async (storeData: AddStore) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO stores (name, createdAt) VALUES (?, datetime('now'))`,
      [storeData.name]
    );
    console.log("Store added successfully with ID:", result.lastInsertRowId);
    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error("Error adding store:", error);
    return { success: false, error };
  }
};

export const updateStore = async (id: number, storeData: { name: string }) => {
  try {
    const result = await db.runAsync(
      `UPDATE stores SET name = ? WHERE id = ?`,
      [storeData.name, id]
    );
    console.log("Store updated successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error updating store:", error);
    return { success: false, error };
  }
};

export const deleteStore = async (id: number) => {
  try {
    const result = await db.runAsync("DELETE FROM stores WHERE id = ?", [id]);
    console.log("Store deleted successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error deleting store:", error);
    return { success: false, error };
  }
};

export const validateStoreExists = async (
  storeId: number
): Promise<boolean> => {
  try {
    const store = await getStoreById(storeId);
    return store !== null;
  } catch (error) {
    console.error("Error validating store:", error);
    return false;
  }
};
