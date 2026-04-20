import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import path from 'path';
import 'dotenv/config';

let mysqlPool: any = null;
let sqliteDb: any = null;
let isUsingMysql = false;

const dbPath = path.resolve(process.cwd(), 'petroleum_supply_chain.db');

export const query = async (sql: string, params: any[] = []) => {
  console.log('\n--- EXECUTING QUERY ---');
  console.log('SQL:', sql);
  if (params.length > 0) console.log('Params:', JSON.stringify(params));
  console.log('-----------------------\n');

  if (isUsingMysql && mysqlPool) {
    const [results] = await mysqlPool.execute(sql, params);
    return results;
  } else {
    // SQLite uses ? placeholders just like mysql2
    // But better-sqlite3 is synchronous
    const stmt = sqliteDb.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(...params);
    } else {
      return stmt.run(...params);
    }
  }
};

export async function initializeDatabase() {
  // 1. Try MySQL first
  try {
    console.log('Attempting to connect to MySQL...');
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'petroleum_supply_chain',
      port: Number(process.env.MYSQL_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 2000 // Short timeout for fallback
    });

    // Test connection
    await pool.getConnection();
    mysqlPool = pool;
    isUsingMysql = true;
    console.log('✅ Connected to MySQL successfully.');
  } catch (err) {
    console.log('❌ MySQL connection failed (ECONNREFUSED or similar). Falling back to SQLite for Preview.');
    console.log('Note: MySQL will work when you run this app LOCALLY with a running MySQL server.');
    
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('foreign_keys = ON');
    isUsingMysql = false;
  }

  // 2. Initialize Tables (works for both)
  try {
    const tables = [
      // Users Table
      `CREATE TABLE IF NOT EXISTS Users (
        id ${isUsingMysql ? 'INT PRIMARY KEY AUTO_INCREMENT' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        username ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL UNIQUE,
        email ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL UNIQUE,
        password_hash ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        role ${isUsingMysql ? 'VARCHAR(50)' : 'TEXT'} NOT NULL DEFAULT 'USER',
        otp ${isUsingMysql ? 'VARCHAR(10)' : 'TEXT'},
        otp_expiry ${isUsingMysql ? 'DATETIME' : 'TEXT'}
      )`,
      // Crude_Purchase
      `CREATE TABLE IF NOT EXISTS Crude_Purchase (
        Purchase_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} PRIMARY KEY,
        Volume INTEGER NOT NULL,
        Price INTEGER NOT NULL,
        Grade ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Purchased_Date ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL
      )`,
      // Transportation_Log
      `CREATE TABLE IF NOT EXISTS Transportation_Log (
        Transit_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} PRIMARY KEY,
        Vehicle_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Driver_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        Quantity INTEGER,
        Route_Type ${isUsingMysql ? 'VARCHAR(50)' : 'TEXT'} NOT NULL,
        Distance INTEGER DEFAULT 500,
        Departure_Time ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Arrival_Time ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        Fuel_Quality ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Purchase_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        FOREIGN KEY (Purchase_ID) REFERENCES Crude_Purchase(Purchase_ID)
      )`,
      // Storage_Batch
      `CREATE TABLE IF NOT EXISTS Storage_Batch (
        Batch_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} PRIMARY KEY,
        Tank_Number INTEGER NOT NULL,
        Current_Capacity INTEGER NOT NULL,
        Threshold INTEGER DEFAULT 5000,
        Last_Inspection_Date ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        Transit_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        FOREIGN KEY (Transit_ID) REFERENCES Transportation_Log(Transit_ID)
      )`,
      // Refining_Process
      `CREATE TABLE IF NOT EXISTS Refining_Process (
        Refine_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} PRIMARY KEY,
        Input_Volume INTEGER NOT NULL,
        Output_Volume INTEGER NOT NULL,
        Refining_Date ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Additive_Chemical_Fingerprint TEXT,
        Throughput_Efficiency ${isUsingMysql ? 'DOUBLE' : 'REAL'},
        Batch_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        FOREIGN KEY (Batch_ID) REFERENCES Storage_Batch(Batch_ID)
      )`,
      // Distribution
      `CREATE TABLE IF NOT EXISTS Distribution (
        Distribution_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} PRIMARY KEY,
        Dispatch_Volume INTEGER NOT NULL,
        Distance INTEGER DEFAULT 200,
        Delivery_Status ${isUsingMysql ? 'VARCHAR(50)' : 'TEXT'} NOT NULL,
        Adulteration_Test_Result TEXT,
        Final_Consumer_Hash TEXT,
        Refine_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        FOREIGN KEY (Refine_ID) REFERENCES Refining_Process(Refine_ID)
      )`,
      // Retail
      `CREATE TABLE IF NOT EXISTS Retail (
        Retail_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} PRIMARY KEY,
        Station_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Receive_Volume INTEGER NOT NULL,
        Storage_Tank_Condition INTEGER,
        Distribution_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        FOREIGN KEY (Distribution_ID) REFERENCES Distribution(Distribution_ID)
      )`,
      // CO2_Emissions
      `CREATE TABLE IF NOT EXISTS CO2_Emissions (
        Emission_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} PRIMARY KEY,
        Source_Type ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Emission_Amount ${isUsingMysql ? 'DOUBLE' : 'REAL'} NOT NULL,
        Measurement_Date ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Location ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        Reference_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'}
      )`,
      // System_Alerts
      `CREATE TABLE IF NOT EXISTS System_Alerts (
        Alert_ID ${isUsingMysql ? 'INT PRIMARY KEY AUTO_INCREMENT' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        Type ${isUsingMysql ? 'VARCHAR(50)' : 'TEXT'} NOT NULL,
        Message TEXT NOT NULL,
        Status ${isUsingMysql ? 'VARCHAR(20)' : 'TEXT'} DEFAULT 'ACTIVE',
        Created_At DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // Correction_Snapshots (Json correction snapshot)
      `CREATE TABLE IF NOT EXISTS Correction_Snapshots (
        Snapshot_ID ${isUsingMysql ? 'INT PRIMARY KEY AUTO_INCREMENT' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        Table_Name ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Record_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Error_Description TEXT,
        JSON_Snapshot TEXT NOT NULL,
        Triggered_By_Username ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        Triggered_By_Role ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // Transaction_Ledger
      `CREATE TABLE IF NOT EXISTS Transaction_Ledger (
        Transaction_ID ${isUsingMysql ? 'INT PRIMARY KEY AUTO_INCREMENT' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        TableName ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Record_ID ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Operation ${isUsingMysql ? 'VARCHAR(50)' : 'TEXT'} NOT NULL DEFAULT 'INSERT',
        Old_Data TEXT,
        New_Data TEXT NOT NULL,
        Transaction_Data_Hash ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Previous_Transaction_Hash ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        Digital_Signature_Sender ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'} NOT NULL,
        Digital_Signature_Receiver ${isUsingMysql ? 'VARCHAR(255)' : 'TEXT'},
        Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      await query(sql);
    }

    // SQLite Migrations: Ensure newer columns exist
    if (!isUsingMysql && sqliteDb) {
      const migrations = [
        { table: 'Users', column: 'role', sql: "ALTER TABLE Users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER'" },
        { table: 'Users', column: 'email', sql: "ALTER TABLE Users ADD COLUMN email TEXT" },
        { table: 'Users', column: 'otp', sql: "ALTER TABLE Users ADD COLUMN otp TEXT" },
        { table: 'Users', column: 'otp_expiry', sql: "ALTER TABLE Users ADD COLUMN otp_expiry TEXT" },
        { table: 'Storage_Batch', column: 'Threshold', sql: "ALTER TABLE Storage_Batch ADD COLUMN Threshold INTEGER DEFAULT 5000" },
        { table: 'Transportation_Log', column: 'Distance', sql: "ALTER TABLE Transportation_Log ADD COLUMN Distance INTEGER DEFAULT 500" },
        { table: 'Distribution', column: 'Distance', sql: "ALTER TABLE Distribution ADD COLUMN Distance INTEGER DEFAULT 200" },
        { table: 'CO2_Emissions', column: 'Reference_ID', sql: "ALTER TABLE CO2_Emissions ADD COLUMN Reference_ID TEXT" },
        { table: 'Transaction_Ledger', column: 'Old_Data', sql: "ALTER TABLE Transaction_Ledger ADD COLUMN Old_Data TEXT" },
        { table: 'Transaction_Ledger', column: 'Operation', sql: "ALTER TABLE Transaction_Ledger ADD COLUMN Operation TEXT NOT NULL DEFAULT 'INSERT'" },
        { table: 'Correction_Snapshots', column: 'Triggered_By_Username', sql: "ALTER TABLE Correction_Snapshots ADD COLUMN Triggered_By_Username TEXT" },
        { table: 'Correction_Snapshots', column: 'Triggered_By_Role', sql: "ALTER TABLE Correction_Snapshots ADD COLUMN Triggered_By_Role TEXT" }
      ];

      for (const m of migrations) {
        const tableInfo: any = sqliteDb.prepare(`PRAGMA table_info(${m.table})`).all();
        const hasColumn = tableInfo.some((col: any) => col.name === m.column);
        if (!hasColumn) {
          try {
            console.log(`Migrating SQLite: Adding ${m.column} column to ${m.table} table...`);
            sqliteDb.prepare(m.sql).run();
          } catch (migrationErr) {
            console.error(`Migration failed for ${m.table}.${m.column}:`, migrationErr);
          }
        }
      }

      // Automatically migrate any legacy threshold values to the new requirement of 5000
      try {
        sqliteDb.prepare("UPDATE Storage_Batch SET Threshold = 5000").run();
      } catch (e) {
        console.error("Threshold data migration failed:", e);
      }
    }

    console.log('Database Schema Initialized.');
  } catch (err) {
    console.error('Error initializing schema:', err);
  }
}

export default { query, initializeDatabase };
