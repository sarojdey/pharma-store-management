import { database as db } from "../db/index";

const drugs = [
  {
    id: "5255",
    drugName: "Zetramyline Velmoracil 500mg",
    inStock: 100,
    price: 19.99,
    expiry: "2025-12-31",
    drugType: "pills",
  },
  {
    id: "5256",
    drugName: "Xentoril Dapsomine 250mg",
    inStock: 54,
    price: 12.49,
    expiry: "2026-03-15",
    drugType: "syrup",
  },
  {
    id: "5257",
    drugName: "Lortrazil Monohydrate 100mg",
    inStock: 210,
    price: 9.99,
    expiry: "2025-08-20",
    drugType: "pills",
  },
  {
    id: "5258",
    drugName: "Vemotrazol Citrine 75mg",
    inStock: 30,
    price: 7.45,
    expiry: "2024-11-10",
    drugType: "syringe",
  },
  {
    id: "5259",
    drugName: "Tetravine Hydrex 150mg",
    inStock: 120,
    price: 14.25,
    expiry: "2026-01-01",
    drugType: "pills",
  },
  {
    id: "5260",
    drugName: "Remorinax Plus 600mg",
    inStock: 65,
    price: 22.75,
    expiry: "2026-06-30",
    drugType: "syrup",
  },
  {
    id: "5261",
    drugName: "Carbotran Aezuline 50mg",
    inStock: 98,
    price: 5.99,
    expiry: "2025-04-12",
    drugType: "pills",
  },
  {
    id: "5262",
    drugName: "Dextroquil Phenate 200mg",
    inStock: 17,
    price: 18.5,
    expiry: "2024-09-05",
    drugType: "syringe",
  },
  {
    id: "5263",
    drugName: "Nortazidine Omephex 400mg",
    inStock: 300,
    price: 27.3,
    expiry: "2026-10-10",
    drugType: "pills",
  },
  {
    id: "5264",
    drugName: "Flumetox Ardanol 80mg",
    inStock: 45,
    price: 11.0,
    expiry: "2025-07-07",
    drugType: "syrup",
  },
];

export const seedDatabase = (): void => {
  try {
    // Create table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS drugs (
        id TEXT PRIMARY KEY NOT NULL,
        drugName TEXT,
        inStock INTEGER,
        price REAL,
        expiry TEXT,
        drugType TEXT
      );
    `);
    console.log("✅ Table created or already exists.");

    // Prepare the insert statement
    const insertStmt = db.prepareSync(
      `INSERT OR REPLACE INTO drugs (id, drugName, inStock, price, expiry, drugType)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    // Insert all drugs
    for (const drug of drugs) {
      insertStmt.executeSync([
        drug.id,
        drug.drugName,
        drug.inStock,
        drug.price,
        drug.expiry,
        drug.drugType,
      ]);
      console.log(`✅ Inserted drug: ${drug.drugName}`);
    }

    // Clean up the prepared statement
    insertStmt.finalizeSync();
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

// Alternative: Async version using the async API
export const seedDatabaseAsync = async (): Promise<void> => {
  try {
    // Create table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS drugs (
        id TEXT PRIMARY KEY NOT NULL,
        drugName TEXT,
        inStock INTEGER,
        price REAL,
        expiry TEXT,
        drugType TEXT
      );
    `);
    console.log("✅ Table created or already exists.");

    // Prepare the insert statement
    const insertStmt = await db.prepareAsync(
      `INSERT OR REPLACE INTO drugs (id, drugName, inStock, price, expiry, drugType)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    // Insert all drugs
    for (const drug of drugs) {
      await insertStmt.executeAsync([
        drug.id,
        drug.drugName,
        drug.inStock,
        drug.price,
        drug.expiry,
        drug.drugType,
      ]);
      console.log(`✅ Inserted drug: ${drug.drugName}`);
    }

    // Clean up the prepared statement
    await insertStmt.finalizeAsync();
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

// Helper function to get all drugs
export const getAllDrugs = () => {
  try {
    const result = db.getAllSync("SELECT * FROM drugs");
    return result;
  } catch (error) {
    console.error("❌ Error fetching drugs:", error);
    return [];
  }
};

// Helper function to get drug by ID
export const getDrugById = (id: string) => {
  try {
    const result = db.getFirstSync("SELECT * FROM drugs WHERE id = ?", [id]);
    return result;
  } catch (error) {
    console.error("❌ Error fetching drug:", error);
    return null;
  }
};
