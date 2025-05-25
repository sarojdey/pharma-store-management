import * as SQLite from "expo-sqlite";

// Use the modern synchronous API
const database = SQLite.openDatabaseSync("pharma_store.db");

export { database };
export default database;
