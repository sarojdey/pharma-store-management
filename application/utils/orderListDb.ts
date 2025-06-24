import { OrderList } from "@/types";
import { database as db } from "../db/index";

export const createOrderListDatabase = (): void => {
  try {
    // Create order_lists table - now each entry is one supplier + one medicine
    db.execSync(`
      CREATE TABLE IF NOT EXISTS order_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplierName TEXT,
        medicineName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Drop the old order_items table since we no longer need it
    db.execSync(`DROP TABLE IF EXISTS order_items;`);

    console.log("Order list table created or already exist.");
  } catch (error) {
    console.error("Error creating order list table:", error);
    throw error;
  }
};

export const getAllOrderLists = async (): Promise<OrderList[]> => {
  try {
    const orderLists = await db.getAllAsync(
      "SELECT * FROM order_lists ORDER BY createdAt ASC"
    );

    return orderLists as OrderList[];
  } catch (error) {
    console.error("Error fetching order lists:", error);
    return [];
  }
};

export const getOrderListById = async (
  id: number
): Promise<OrderList | null> => {
  try {
    const orderList = await db.getFirstAsync(
      "SELECT * FROM order_lists WHERE id = ?",
      [id]
    );

    return orderList as OrderList | null;
  } catch (error) {
    console.error("Error fetching order list by ID:", error);
    return null;
  }
};

export const addOrderList = async (orderListData: {
  supplierName?: string;
  medicineName: string;
  quantity: number;
  createdAt?: string;
}) => {
  try {
    if (!orderListData.medicineName || !orderListData.quantity) {
      return {
        success: false,
        error: "Medicine name and quantity are required",
      };
    }

    const result = await db.runAsync(
      `INSERT INTO order_lists (supplierName, medicineName, quantity, createdAt, updatedAt) 
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      [
        orderListData.supplierName || null,
        orderListData.medicineName,
        orderListData.quantity,
      ]
    );

    const orderListId = result.lastInsertRowId;
    console.log("Order list added successfully with ID:", orderListId);
    return { success: true, id: orderListId };
  } catch (error) {
    console.error("Error adding order list:", error);
    return { success: false, error };
  }
};

export const updateOrderList = async (
  id: number,
  orderListData: {
    supplierName?: string;
    medicineName?: string;
    quantity?: number;
  }
) => {
  try {
    const updateFields = [];
    const values = [];

    if (orderListData.supplierName !== undefined) {
      updateFields.push("supplierName = ?");
      values.push(orderListData.supplierName || null);
    }

    if (orderListData.medicineName) {
      updateFields.push("medicineName = ?");
      values.push(orderListData.medicineName);
    }

    if (orderListData.quantity !== undefined) {
      updateFields.push("quantity = ?");
      values.push(orderListData.quantity);
    }

    if (updateFields.length === 0) {
      return { success: false, error: "No fields to update" };
    }

    // Always update the updatedAt timestamp
    updateFields.push("updatedAt = datetime('now')");
    values.push(id);

    const query = `UPDATE order_lists SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;

    await db.runAsync(query, values);

    console.log("Order list updated successfully");
    return { success: true };
  } catch (error) {
    console.error("Error updating order list:", error);
    return { success: false, error };
  }
};

export const deleteOrderList = async (id: number) => {
  try {
    const result = await db.runAsync("DELETE FROM order_lists WHERE id = ?", [
      id,
    ]);

    console.log("Order list deleted successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error deleting order list:", error);
    return { success: false, error };
  }
};

export const searchOrderLists = async (
  searchTerm: string
): Promise<OrderList[]> => {
  try {
    const searchPattern = `%${searchTerm}%`;
    const orderLists = await db.getAllAsync(
      `SELECT * FROM order_lists
       WHERE supplierName LIKE ? OR medicineName LIKE ?
       ORDER BY createdAt DESC`,
      [searchPattern, searchPattern]
    );

    return orderLists as OrderList[];
  } catch (error) {
    console.error("Error searching order lists:", error);
    return [];
  }
};

export const getOrderListsBySupplier = async (
  supplierName: string
): Promise<OrderList[]> => {
  try {
    const orderLists = await db.getAllAsync(
      "SELECT * FROM order_lists WHERE supplierName = ? ORDER BY createdAt DESC",
      [supplierName]
    );

    return orderLists as OrderList[];
  } catch (error) {
    console.error("Error fetching order lists by supplier:", error);
    return [];
  }
};

export const getOrderListsByMedicine = async (
  medicineName: string
): Promise<OrderList[]> => {
  try {
    const orderLists = await db.getAllAsync(
      "SELECT * FROM order_lists WHERE medicineName = ? ORDER BY createdAt DESC",
      [medicineName]
    );

    return orderLists as OrderList[];
  } catch (error) {
    console.error("Error fetching order lists by medicine:", error);
    return [];
  }
};

export const resetOrderLists = async () => {
  try {
    const result = await db.runAsync("DELETE FROM order_lists");

    console.log("Reset completed. All order lists removed.");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error resetting order lists:", error);
    return { success: false, error };
  }
};

export const resetOrderListTables = (): void => {
  try {
    db.execSync("DROP TABLE IF EXISTS order_lists");
    db.execSync("DROP TABLE IF EXISTS order_items"); // Clean up old table if exists
    createOrderListDatabase();
    console.log("Order list table reset successfully.");
  } catch (error) {
    console.error("Error resetting order list table:", error);
    throw error;
  }
};

export const getOrderListsCount = async (): Promise<number> => {
  try {
    const result = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM order_lists"
    );
    return (result as { count: number }).count;
  } catch (error) {
    console.error("Error getting order lists count:", error);
    return 0;
  }
};

export const getMedicineUsageStats = async (): Promise<
  { medicineName: string; totalQuantity: number; orderCount: number }[]
> => {
  try {
    const result = await db.getAllAsync(
      `SELECT 
        medicineName,
        SUM(quantity) as totalQuantity,
        COUNT(*) as orderCount
       FROM order_lists 
       GROUP BY medicineName 
       ORDER BY totalQuantity DESC`
    );
    return result as {
      medicineName: string;
      totalQuantity: number;
      orderCount: number;
    }[];
  } catch (error) {
    console.error("Error getting medicine usage stats:", error);
    return [];
  }
};

export const getSupplierStats = async (): Promise<
  { supplierName: string | null; totalQuantity: number; orderCount: number }[]
> => {
  try {
    const result = await db.getAllAsync(
      `SELECT 
        supplierName,
        SUM(quantity) as totalQuantity,
        COUNT(*) as orderCount
       FROM order_lists 
       GROUP BY supplierName 
       ORDER BY totalQuantity DESC`
    );
    return result as {
      supplierName: string | null;
      totalQuantity: number;
      orderCount: number;
    }[];
  } catch (error) {
    console.error("Error getting supplier stats:", error);
    return [];
  }
};

export const getOrderListsWithoutSupplier = async (): Promise<OrderList[]> => {
  try {
    const orderLists = await db.getAllAsync(
      "SELECT * FROM order_lists WHERE supplierName IS NULL ORDER BY createdAt DESC"
    );

    return orderLists as OrderList[];
  } catch (error) {
    console.error("Error fetching order lists without supplier:", error);
    return [];
  }
};
