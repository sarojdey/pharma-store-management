import * as SQLite from "expo-sqlite";

const database = SQLite.openDatabaseSync("pharma_store.db");

export { database };
export default database;
