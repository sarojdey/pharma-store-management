import { OrderList, OrderItem } from "@/types";
import { database as db } from "../db/index";

export const createOrderListDatabase = (): void => {
  try {
    // Create order_lists table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS order_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplierName TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create order_items table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderListId INTEGER NOT NULL,
        medicineName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (orderListId) REFERENCES order_lists (id) ON DELETE CASCADE
      );
    `);

    console.log("Order list tables created or already exist.");
  } catch (error) {
    console.error("Error creating order list tables:", error);
    throw error;
  }
};

export const getAllOrderLists = async (): Promise<OrderList[]> => {
  try {
    const orderLists = await db.getAllAsync(
      "SELECT * FROM order_lists ORDER BY createdAt DESC"
    );

    // Get items for each order list
    const orderListsWithItems = await Promise.all(
      orderLists.map(async (orderList: any) => {
        const items = await db.getAllAsync(
          "SELECT * FROM order_items WHERE orderListId = ? ORDER BY id ASC",
          [orderList.id]
        );
        return {
          ...orderList,
          items: items as OrderItem[],
        };
      })
    );

    return orderListsWithItems as OrderList[];
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

    if (!orderList) {
      return null;
    }

    const items = await db.getAllAsync(
      "SELECT * FROM order_items WHERE orderListId = ? ORDER BY id ASC",
      [id]
    );

    return {
      ...orderList,
      items: items as OrderItem[],
    } as OrderList;
  } catch (error) {
    console.error("Error fetching order list by ID:", error);
    return null;
  }
};

export const addOrderList = async (orderListData: {
  supplierName: string;
  items: { medicineName: string; quantity: string }[];
  createdAt?: string;
}) => {
  try {
    if (!orderListData.items || orderListData.items.length === 0) {
      return {
        success: false,
        error: "Order list must contain at least one item",
      };
    }

    // Start transaction
    await db.execAsync("BEGIN TRANSACTION");

    try {
      // Insert order list
      const orderListResult = await db.runAsync(
        `INSERT INTO order_lists (supplierName, createdAt, updatedAt) 
         VALUES (?, datetime('now'), datetime('now'))`,
        [orderListData.supplierName]
      );

      const orderListId = orderListResult.lastInsertRowId;

      // Insert order items
      for (const item of orderListData.items) {
        await db.runAsync(
          `INSERT INTO order_items (orderListId, medicineName, quantity, createdAt) 
           VALUES (?, ?, ?, datetime('now'))`,
          [orderListId, item.medicineName, parseInt(item.quantity)]
        );
      }

      // Commit transaction
      await db.execAsync("COMMIT");

      console.log("Order list added successfully with ID:", orderListId);
      return { success: true, id: orderListId };
    } catch (error) {
      // Rollback transaction on error
      await db.execAsync("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error adding order list:", error);
    return { success: false, error };
  }
};

export const updateOrderList = async (
  id: number,
  orderListData: {
    supplierName?: string;
    items?: { medicineName: string; quantity: string }[];
  }
) => {
  try {
    // Start transaction
    await db.execAsync("BEGIN TRANSACTION");

    try {
      // Update order list if supplierName is provided
      if (orderListData.supplierName) {
        await db.runAsync(
          `UPDATE order_lists SET supplierName = ?, updatedAt = datetime('now') WHERE id = ?`,
          [orderListData.supplierName, id]
        );
      }

      // Update items if provided
      if (orderListData.items) {
        // Delete existing items
        await db.runAsync("DELETE FROM order_items WHERE orderListId = ?", [
          id,
        ]);

        // Insert new items
        for (const item of orderListData.items) {
          await db.runAsync(
            `INSERT INTO order_items (orderListId, medicineName, quantity, createdAt) 
             VALUES (?, ?, ?, datetime('now'))`,
            [id, item.medicineName, parseInt(item.quantity)]
          );
        }
      }

      // Update the order list's updatedAt timestamp
      await db.runAsync(
        `UPDATE order_lists SET updatedAt = datetime('now') WHERE id = ?`,
        [id]
      );

      // Commit transaction
      await db.execAsync("COMMIT");

      console.log("Order list updated successfully");
      return { success: true };
    } catch (error) {
      // Rollback transaction on error
      await db.execAsync("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error updating order list:", error);
    return { success: false, error };
  }
};

export const deleteOrderList = async (id: number) => {
  try {
    // Start transaction
    await db.execAsync("BEGIN TRANSACTION");

    try {
      // Delete order items first (due to foreign key constraint)
      await db.runAsync("DELETE FROM order_items WHERE orderListId = ?", [id]);

      // Delete order list
      const result = await db.runAsync("DELETE FROM order_lists WHERE id = ?", [
        id,
      ]);

      // Commit transaction
      await db.execAsync("COMMIT");

      console.log("Order list deleted successfully");
      return { success: true, changes: result.changes };
    } catch (error) {
      // Rollback transaction on error
      await db.execAsync("ROLLBACK");
      throw error;
    }
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
      `SELECT DISTINCT ol.* FROM order_lists ol
       LEFT JOIN order_items oi ON ol.id = oi.orderListId
       WHERE ol.supplierName LIKE ? OR oi.medicineName LIKE ?
       ORDER BY ol.createdAt DESC`,
      [searchPattern, searchPattern]
    );

    // Get items for each order list
    const orderListsWithItems = await Promise.all(
      orderLists.map(async (orderList: any) => {
        const items = await db.getAllAsync(
          "SELECT * FROM order_items WHERE orderListId = ? ORDER BY id ASC",
          [orderList.id]
        );
        return {
          ...orderList,
          items: items as OrderItem[],
        };
      })
    );

    return orderListsWithItems as OrderList[];
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

    // Get items for each order list
    const orderListsWithItems = await Promise.all(
      orderLists.map(async (orderList: any) => {
        const items = await db.getAllAsync(
          "SELECT * FROM order_items WHERE orderListId = ? ORDER BY id ASC",
          [orderList.id]
        );
        return {
          ...orderList,
          items: items as OrderItem[],
        };
      })
    );

    return orderListsWithItems as OrderList[];
  } catch (error) {
    console.error("Error fetching order lists by supplier:", error);
    return [];
  }
};

export const resetOrderLists = async () => {
  try {
    // Start transaction
    await db.execAsync("BEGIN TRANSACTION");

    try {
      await db.runAsync("DELETE FROM order_items");
      const result = await db.runAsync("DELETE FROM order_lists");

      // Commit transaction
      await db.execAsync("COMMIT");

      console.log("Reset completed. All order lists and items removed.");
      return { success: true, changes: result.changes };
    } catch (error) {
      // Rollback transaction on error
      await db.execAsync("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error resetting order lists:", error);
    return { success: false, error };
  }
};

export const resetOrderListTables = (): void => {
  try {
    db.execSync("DROP TABLE IF EXISTS order_items");
    db.execSync("DROP TABLE IF EXISTS order_lists");
    createOrderListDatabase();
    console.log("Order list tables reset successfully.");
  } catch (error) {
    console.error("Error resetting order list tables:", error);
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

export const getOrderItemsCount = async (): Promise<number> => {
  try {
    const result = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM order_items"
    );
    return (result as { count: number }).count;
  } catch (error) {
    console.error("Error getting order items count:", error);
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
       FROM order_items 
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
