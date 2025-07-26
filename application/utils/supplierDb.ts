import { Supplier } from "@/types";
import { database as db } from "../db/index";

export const createSupplierDb = (): void => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        supplierName TEXT NOT NULL,
        location TEXT NOT NULL,
        phone TEXT NOT NULL CHECK(length(phone) = 10),
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );
    `);

    console.log("Supplier table created or already exists.");
  } catch (error) {
    console.error("Error creating suppliers table:", error);
    throw error;
  }
};

export const getAllSuppliers = async (storeId: number): Promise<Supplier[]> => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM suppliers WHERE store_id = ? ORDER BY supplierName ASC",
      [storeId]
    );
    return result as Supplier[];
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
};

export const getSupplierById = async (
  id: number,
  storeId: number
): Promise<Supplier | null> => {
  try {
    const result = await db.getFirstAsync(
      "SELECT * FROM suppliers WHERE id = ? AND store_id = ?",
      [id, storeId]
    );
    return result as Supplier | null;
  } catch (error) {
    console.error("Error fetching supplier by ID:", error);
    return null;
  }
};

export const addSupplier = async (
  supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">,
  storeId: number
) => {
  try {
    if (supplier.phone.length !== 10) {
      return {
        success: false,
        error: "Phone number must be exactly 10 digits",
      };
    }

    const result = await db.runAsync(
      `INSERT INTO suppliers (store_id, supplierName, location, phone, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [storeId, supplier.supplierName, supplier.location, supplier.phone]
    );

    console.log("Supplier added successfully with ID:", result.lastInsertRowId);
    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error("Error adding supplier:", error);
    return { success: false, error };
  }
};

export const updateSupplier = async (
  id: number,
  supplier: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>,
  storeId: number
) => {
  try {
    if (supplier.phone && supplier.phone.length !== 10) {
      return {
        success: false,
        error: "Phone number must be exactly 10 digits",
      };
    }

    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(supplier).forEach(([key, value]) => {
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
      `UPDATE suppliers SET ${fields.join(", ")} WHERE id = ? AND store_id = ?`,
      values
    );

    console.log("Supplier updated successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error };
  }
};

export const deleteSupplier = async (id: number, storeId: number) => {
  try {
    const result = await db.runAsync(
      "DELETE FROM suppliers WHERE id = ? AND store_id = ?",
      [id, storeId]
    );

    console.log("Supplier deleted successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return { success: false, error };
  }
};

export const searchSuppliers = async (
  searchTerm: string,
  storeId: number
): Promise<Supplier[]> => {
  try {
    const searchPattern = `%${searchTerm}%`;
    const result = await db.getAllAsync(
      `SELECT * FROM suppliers 
       WHERE store_id = ? AND (supplierName LIKE ? OR location LIKE ? OR phone LIKE ?)
       ORDER BY supplierName ASC`,
      [storeId, searchPattern, searchPattern, searchPattern]
    );

    return result as Supplier[];
  } catch (error) {
    console.error("Error searching suppliers:", error);
    return [];
  }
};

export const resetSuppliersDb = (): void => {
  try {
    db.execSync("DROP TABLE IF EXISTS suppliers");
    createSupplierDb();
    console.log("Suppliers table reset successfully.");
  } catch (error) {
    console.error("Error resetting suppliers table:", error);
    throw error;
  }
};

export const getSuppliersCountByStore = async (
  storeId: number
): Promise<number> => {
  try {
    const result = (await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM suppliers WHERE store_id = ?",
      [storeId]
    )) as { count: number };
    return result.count;
  } catch (error) {
    console.error("Error getting suppliers count:", error);
    return 0;
  }
};
