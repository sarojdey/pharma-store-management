import { database as db } from "../db/index";

const drugs = [
  {
    drugName: "Zetramyline Velmoracil 500mg",
    inStock: 100,
    price: 19.99,
    expiry: "2025-12-31",
    drugType: "pills",
  },
  {
    drugName: "Xentoril Dapsomine 250mg",
    inStock: 54,
    price: 12.49,
    expiry: "2026-03-15",
    drugType: "syrup",
  },
  {
    drugName: "Lortrazil Monohydrate 100mg",
    inStock: 210,
    price: 9.99,
    expiry: "2025-08-20",
    drugType: "pills",
  },
  {
    drugName: "Vemotrazol Citrine 75mg",
    inStock: 30,
    price: 7.45,
    expiry: "2024-11-10",
    drugType: "syringe",
  },
  {
    drugName: "Tetravine Hydrex 150mg",
    inStock: 120,
    price: 14.25,
    expiry: "2026-01-01",
    drugType: "pills",
  },
  {
    drugName: "Remorinax Plus 600mg",
    inStock: 65,
    price: 22.75,
    expiry: "2026-06-30",
    drugType: "syrup",
  },
  {
    drugName: "Carbotran Aezuline 50mg",
    inStock: 98,
    price: 5.99,
    expiry: "2025-04-12",
    drugType: "pills",
  },
  {
    drugName: "Dextroquil Phenate 200mg",
    inStock: 17,
    price: 18.5,
    expiry: "2024-09-05",
    drugType: "syringe",
  },
  {
    drugName: "Nortazidine Omephex 400mg",
    inStock: 300,
    price: 27.3,
    expiry: "2026-10-10",
    drugType: "pills",
  },
  {
    drugName: "Flumetox Ardanol 80mg",
    inStock: 45,
    price: 11.0,
    expiry: "2025-07-07",
    drugType: "syrup",
  },
];

export const seedDatabase = (): void => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS drugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        drugName TEXT,
        inStock INTEGER,
        price REAL,
        expiry TEXT,
        drugType TEXT
      );
    `);

    console.log("✅ Table created or already exists.");

    const insertStmt = db.prepareSync(
      `INSERT INTO drugs ( drugName, inStock, price, expiry, drugType)
       VALUES ( ?, ?, ?, ?, ?)`
    );

    for (const drug of drugs) {
      insertStmt.executeSync([
        drug.drugName,
        drug.inStock,
        drug.price,
        drug.expiry,
        drug.drugType,
      ]);
      console.log(`✅ Inserted drug: ${drug.drugName}`);
    }

    insertStmt.finalizeSync();
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

export const seedDatabaseAsync = async (): Promise<void> => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS drugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        drugName TEXT,
        inStock INTEGER,
        price REAL,
        expiry TEXT,
        drugType TEXT
      );
    `);

    console.log("✅ Table created or already exists.");

    const insertStmt = await db.prepareAsync(
      `INSERT INTO drugs ( drugName, inStock, price, expiry, drugType)
       VALUES ( ?, ?, ?, ?, ?)`
    );

    for (const drug of drugs) {
      await insertStmt.executeAsync([
        drug.drugName,
        drug.inStock,
        drug.price,
        drug.expiry,
        drug.drugType,
      ]);
      console.log(`✅ Inserted drug: ${drug.drugName}`);
    }

    await insertStmt.finalizeAsync();
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

export const getAllDrugs = () => {
  try {
    const result = db.getAllSync("SELECT * FROM drugs");
    return result;
  } catch (error) {
    console.error("❌ Error fetching drugs:", error);
    return [];
  }
};

export const getDrugById = (id: number) => {
  try {
    const result = db.getFirstSync("SELECT * FROM drugs WHERE id = ?", [id]);
    return result;
  } catch (error) {
    console.error("❌ Error fetching drug:", error);
    return null;
  }
};
