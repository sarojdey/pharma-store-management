import { database as db } from "../db/index";

export const createDatabase = (): void => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS drugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicineName TEXT NOT NULL,
        idCode TEXT NOT NULL,
        price REAL NOT NULL,
        mrp REAL NOT NULL,
        quantity INTEGER NOT NULL,
        expiryDate TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Table created or already exists.");
  } catch (error) {
    console.error("Error creating database:", error);
    throw error;
  }
};

export const getAllDrugs = async () => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM drugs ORDER BY createdAt DESC"
    );
    return result;
  } catch (error) {
    console.error("Error fetching drugs:", error);
    return [];
  }
};

export const getDrugById = async (id: number) => {
  try {
    const result = await db.getFirstAsync("SELECT * FROM drugs WHERE id = ?", [
      id,
    ]);
    return result;
  } catch (error) {
    console.error("Error fetching drug:", error);
    return null;
  }
};

export const addDrug = async (drugData: {
  medicineName: string;
  idCode: string;
  price: number;
  mrp: number;
  quantity: number;
  expiryDate: string;
}) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO drugs (medicineName, idCode, price, mrp, quantity, expiryDate, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        drugData.medicineName,
        drugData.idCode,
        drugData.price,
        drugData.mrp,
        drugData.quantity,
        drugData.expiryDate,
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
  drugData: {
    medicineName?: string;
    idCode?: string;
    price?: number;
    mrp?: number;
    quantity?: number;
    expiryDate?: string;
  }
) => {
  try {
    const fields = [];
    const values = [];

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
    values.push(id);

    const result = await db.runAsync(
      `UPDATE drugs SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    console.log("Drug updated successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error updating drug:", error);
    return { success: false, error };
  }
};

export const deleteDrug = async (id: number) => {
  try {
    const result = await db.runAsync("DELETE FROM drugs WHERE id = ?", [id]);

    console.log("Drug deleted successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error deleting drug:", error);
    return { success: false, error };
  }
};

export const getDrugByIdCode = async (idCode: string) => {
  try {
    const result = await db.getFirstAsync(
      "SELECT * FROM drugs WHERE idCode = ?",
      [idCode]
    );
    return result;
  } catch (error) {
    console.error("Error fetching drug by ID code:", error);
    return null;
  }
};

export const getLowStockDrugs = async (threshold: number = 10) => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM drugs WHERE quantity <= ? ORDER BY quantity ASC",
      [threshold]
    );
    return result;
  } catch (error) {
    console.error("Error fetching low stock drugs:", error);
    return [];
  }
};

export const getExpiredDrugs = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const result = await db.getAllAsync(
      "SELECT * FROM drugs WHERE expiryDate <= ? ORDER BY expiryDate ASC",
      [today]
    );
    return result;
  } catch (error) {
    console.error("Error fetching expired drugs:", error);
    return [];
  }
};

export const getExpiringDrugs = async (daysAhead: number = 30) => {
  try {
    const today = new Date();
    const futureDate = new Date(
      today.getTime() + daysAhead * 24 * 60 * 60 * 1000
    );
    const futureDateString = futureDate.toISOString().split("T")[0];
    const todayString = today.toISOString().split("T")[0];

    const result = await db.getAllAsync(
      "SELECT * FROM drugs WHERE expiryDate BETWEEN ? AND ? ORDER BY expiryDate ASC",
      [todayString, futureDateString]
    );
    return result;
  } catch (error) {
    console.error("Error fetching expiring drugs:", error);
    return [];
  }
};

export const updateDrugQuantity = async (
  id: number,
  quantityChange: number
) => {
  try {
    const result = await db.runAsync(
      "UPDATE drugs SET quantity = quantity + ?, updatedAt = datetime('now') WHERE id = ?",
      [quantityChange, id]
    );

    console.log("Drug quantity updated successfully");
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Error updating drug quantity:", error);
    return { success: false, error };
  }
};

export const searchDrugs = async (searchTerm: string) => {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM drugs WHERE medicineName LIKE ? OR idCode LIKE ? ORDER BY medicineName ASC",
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );
    return result;
  } catch (error) {
    console.error("Error searching drugs:", error);
    return [];
  }
};

export const resetDatabase = (): void => {
  try {
    db.execSync(`DROP TABLE IF EXISTS drugs;`);

    db.execSync(`
      CREATE TABLE drugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicineName TEXT NOT NULL,
        idCode TEXT NOT NULL,
        price REAL NOT NULL,
        mrp REAL NOT NULL,
        quantity INTEGER NOT NULL,
        expiryDate TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database reset successfully with new structure.");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
};
