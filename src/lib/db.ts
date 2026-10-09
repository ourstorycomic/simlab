import Database from "better-sqlite3";
import path from "path";

// Initialize SQLite database
const dbPath = path.resolve(process.cwd(), "simlab.db");
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// Create Users table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        school TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

export default db;
