import { OrderList } from "@/types";
import { database as db } from "../db/index";

export const createOrderListDb = (): void => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS order_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        supplierName TEXT,
        medicineName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );
    `);

    db.execSync(`DROP TABLE IF EXISTS order_items;`);

    console.log("Order list table created or already exist.");
  } catch (error) {
    console.error("Error creating order list table:", error);
    throw error;
  }
};

export const getAllOrderLists = async (
  storeId: number
): Promise<OrderList[]> => {
  try {
    const orderLists = await db.getAllAsync(
      "SELECT * FROM order_lists WHERE store_id = ? ORDER BY createdAt ASC",
      [storeId]
    );

    return orderLists as OrderList[];
  } catch (error) {
    console.error("Error fetching order lists:", error);
    return [];
  }
};

export const getOrderListById = async (
  id: number,
  storeId: number
): Promise<OrderList | null> => {
  try {
    const orderList = await db.getFirstAsync(
      "SELECT * FROM order_lists WHERE id = ? AND store_id = ?",
      [id, storeId]
    );

    return orderList as OrderList | null;
  } catch (error) {
    console.error("Error fetching order list by ID:", error);
    return null;
  }
};

export const addOrderList = async (
  orderListData: {
    supplierName?: string;
    medicineName: string;
    quantity: number;
    createdAt?: string;
  },
  storeId: number
) => {
  try {
    if (!orderListData.medicineName || !orderListData.quantity) {
      return {
        success: false,
        error: "Medicine name and quantity are required",
      };
    }

    const result = await db.runAsync(
      `INSERT INTO order_lists (store_id, supplierName, medicineName, quantity, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        storeId,
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
  },
  storeId: number
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

    updateFields.push("updatedAt = datetime('now')");
    values.push(id, storeId);

    const query = `UPDATE order_lists SET ${updateFields.join(
      ", "
    )} WHERE id = ? AND store_id = ?`;

    await db.runAsync(query, values);

    console.log("Order list updated successfully");
    return { success: true };
  } catch (error) {
    console.error("Error updating order list:", error);
    return { success: false, error };
  }
};

export const deleteOrderList = async (id: number, storeId: number) => {
  try {
    const result = await db.runAsync(
      "DELETE FROM order_lists WHERE id = ? AND store_id = ?",
      [id, storeId]
    );

    console.log("Order list deleted successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error deleting order list:", error);
    return { success: false, error };
  }
};

export const resetOrderListDb = (): void => {
  try {
    db.execSync("DROP TABLE IF EXISTS order_lists");
    db.execSync("DROP TABLE IF EXISTS order_items");
    createOrderListDb();
    console.log("Order list table reset successfully.");
  } catch (error) {
    console.error("Error resetting order list table:", error);
    throw error;
  }
};

export const getOrderListCountByStore = async (
  storeId: number
): Promise<number> => {
  try {
    const result = (await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM order_lists WHERE store_id = ?",
      [storeId]
    )) as { count: number };
    return result.count;
  } catch (error) {
    console.error("Error getting order list count:", error);
    return 0;
  }
};
