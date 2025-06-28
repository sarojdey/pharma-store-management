import { Supplier } from "@/types";
import { database as db } from "../db/index";

export const createSupplierDb = (): void => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplierName TEXT NOT NULL,
        location TEXT NOT NULL,
        phone TEXT NOT NULL CHECK(length(phone) = 10),
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Supplier table created or already exists.");
  } catch (error) {
    console.error("Error creating suppliers table:", error);
    throw error;
  }
};

export const getAllSuppliers = async (): Promise<Supplier[]> => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM suppliers ORDER BY supplierName ASC"
    );
    return result as Supplier[];
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
};

export const getSupplierById = async (id: number): Promise<Supplier | null> => {
  try {
    const result = await db.getFirstAsync(
      "SELECT * FROM suppliers WHERE id = ?",
      [id]
    );
    return result as Supplier | null;
  } catch (error) {
    console.error("Error fetching supplier by ID:", error);
    return null;
  }
};

export const addSupplier = async (
  supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">
) => {
  try {
    if (supplier.phone.length !== 10) {
      return {
        success: false,
        error: "Phone number must be exactly 10 digits",
      };
    }

    const result = await db.runAsync(
      `INSERT INTO suppliers (supplierName, location, phone, createdAt, updatedAt) 
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      [supplier.supplierName, supplier.location, supplier.phone]
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
  supplier: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>
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
    values.push(id);

    const result = await db.runAsync(
      `UPDATE suppliers SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    console.log("Supplier updated successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error };
  }
};

export const deleteSupplier = async (id: number) => {
  try {
    const result = await db.runAsync("DELETE FROM suppliers WHERE id = ?", [
      id,
    ]);

    console.log("Supplier deleted successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return { success: false, error };
  }
};

export const searchSuppliers = async (
  searchTerm: string
): Promise<Supplier[]> => {
  try {
    const searchPattern = `%${searchTerm}%`;
    const result = await db.getAllAsync(
      `SELECT * FROM suppliers 
       WHERE supplierName LIKE ? OR location LIKE ? OR phone LIKE ?
       ORDER BY supplierName ASC`,
      [searchPattern, searchPattern, searchPattern]
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

export const getSuppliersCount = async (): Promise<number> => {
  try {
    const result = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM suppliers"
    );
    return (result as { count: number }).count;
  } catch (error) {
    console.error("Error getting suppliers count:", error);
    return 0;
  }
};
