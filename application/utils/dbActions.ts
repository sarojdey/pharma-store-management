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
        medicineType TEXT NOT NULL,
        batchNo TEXT,
        distributorName TEXT,
        purchaseInvoiceNumber TEXT,
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
      "SELECT * FROM drugs ORDER BY createdAt ASC"
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
  medicineType: string;
  batchNo?: string | null;
  distributorName?: string | null;
  purchaseInvoiceNumber?: string | null;
}) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO drugs (
        medicineName,
        idCode,
        price,
        mrp,
        quantity,
        expiryDate,
        medicineType,
        batchNo,
        distributorName,
        purchaseInvoiceNumber,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        drugData.medicineName,
        drugData.idCode,
        drugData.price,
        drugData.mrp,
        drugData.quantity,
        drugData.expiryDate,
        drugData.medicineType,
        drugData.batchNo ?? null,
        drugData.distributorName ?? null,
        drugData.purchaseInvoiceNumber ?? null,
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
    medicineType?: string;
    batchNo?: string;
    distributorName?: string;
    purchaseInvoiceNumber?: string;
  }
) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];

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
        medicineType TEXT NOT NULL,
        batchNo TEXT,
        distributorName TEXT,
        purchaseInvoiceNumber TEXT,
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

export const dynamicSearchDrugs = async ({
  searchTerm = "",
  page = "inventory",
  filterBy,
  filterValue,
  sortBy,
}: {
  searchTerm?: string;
  page?:
    | "inventory"
    | "nostockalert"
    | "lowstockalert"
    | "expiringalert"
    | "expiredalert";
  filterBy?: "expiryDate" | "quantity";
  filterValue?: string | number | [string | number, string | number];
  sortBy?: string;
}) => {
  try {
    const conditions: string[] = [];
    const values: any[] = [];

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const futureDateStr = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    switch (page) {
      case "nostockalert":
        conditions.push("quantity = 0");
        break;
      case "lowstockalert":
        conditions.push("quantity > 0 AND quantity <= 30");
        break;
      case "expiredalert":
        conditions.push("expiryDate <= ?");
        values.push(todayStr);
        break;
      case "expiringalert":
        conditions.push("expiryDate BETWEEN ? AND ?");
        values.push(todayStr, futureDateStr);
        break;
    }

    if (searchTerm) {
      conditions.push("(medicineName LIKE ?)");
      values.push(`%${searchTerm}%`);
    }

    if (filterBy && filterValue !== undefined) {
      const validFilterColumns = ["expiryDate", "quantity"];
      if (!validFilterColumns.includes(filterBy)) {
        throw new Error(`Invalid filterBy value: ${filterBy}`);
      }

      if (Array.isArray(filterValue) && filterValue.length === 2) {
        conditions.push(`${filterBy} BETWEEN ? AND ?`);
        values.push(filterValue[0], filterValue[1]);
      } else {
        conditions.push(`${filterBy} = ?`);
        values.push(filterValue);
      }
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const validSortColumns = [
      "id",
      "medicineName",
      "quantity",
      "expiryDate",
      "price",
    ];
    const safeSortBy =
      sortBy && validSortColumns.includes(sortBy) ? sortBy : "id";
    const orderByClause = `ORDER BY ${safeSortBy}`;

    const query = `SELECT * FROM drugs ${whereClause} ${orderByClause}`;
    const result = await db.getAllAsync(query, values);

    return result;
  } catch (error) {
    console.error("Error in dynamic drug search:", error);
    return [];
  }
};
