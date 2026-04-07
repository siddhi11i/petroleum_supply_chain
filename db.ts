import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'petroleum_supply_chain',
  port: Number(process.env.MYSQL_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const query = async (sql: string, params?: any[]) => {
  console.log('\n--- EXECUTING MYSQL QUERY ---');
  console.log('SQL:', sql);
  if (params) console.log('Params:', JSON.stringify(params));
  console.log('-----------------------------\n');
  
  const [results] = await pool.execute(sql, params);
  return results;
};

export async function initializeDatabase() {
  try {
    console.log('Initializing MySQL Database...');

    // Users Table
    await query(`CREATE TABLE IF NOT EXISTS Users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'USER'
    )`);

    // Crude_Purchase
    await query(`CREATE TABLE IF NOT EXISTS Crude_Purchase (
      Purchase_ID VARCHAR(255) PRIMARY KEY,
      Volume INT NOT NULL,
      Price INT NOT NULL,
      Grade VARCHAR(255) NOT NULL,
      Purchased_Date VARCHAR(255) NOT NULL
    )`);

    // Transportation_Log
    await query(`CREATE TABLE IF NOT EXISTS Transportation_Log (
      Transit_ID VARCHAR(255) PRIMARY KEY,
      Vehicle_ID VARCHAR(255) NOT NULL,
      Driver_ID VARCHAR(255),
      Quantity INT,
      Route_Type VARCHAR(50) NOT NULL,
      Departure_Time VARCHAR(255) NOT NULL,
      Arrival_Time VARCHAR(255),
      Fuel_Quality VARCHAR(255) NOT NULL,
      Purchase_ID VARCHAR(255),
      FOREIGN KEY (Purchase_ID) REFERENCES Crude_Purchase(Purchase_ID)
    )`);

    // Storage_Batch
    await query(`CREATE TABLE IF NOT EXISTS Storage_Batch (
      Batch_ID VARCHAR(255) PRIMARY KEY,
      Tank_Number INT NOT NULL,
      Current_Capacity INT NOT NULL,
      Last_Inspection_Date VARCHAR(255),
      Transit_ID VARCHAR(255),
      FOREIGN KEY (Transit_ID) REFERENCES Transportation_Log(Transit_ID)
    )`);

    // Refining_Process
    await query(`CREATE TABLE IF NOT EXISTS Refining_Process (
      Refine_ID VARCHAR(255) PRIMARY KEY,
      Input_Volume INT NOT NULL,
      Output_Volume INT NOT NULL,
      Refining_Date VARCHAR(255) NOT NULL,
      Additive_Chemical_Fingerprint TEXT,
      Throughput_Efficiency DOUBLE,
      Batch_ID VARCHAR(255),
      FOREIGN KEY (Batch_ID) REFERENCES Storage_Batch(Batch_ID)
    )`);

    // Distribution
    await query(`CREATE TABLE IF NOT EXISTS Distribution (
      Distribution_ID VARCHAR(255) PRIMARY KEY,
      Dispatch_Volume INT NOT NULL,
      Delivery_Status VARCHAR(50) NOT NULL,
      Adulteration_Test_Result TEXT,
      Final_Consumer_Hash TEXT,
      Refine_ID VARCHAR(255),
      FOREIGN KEY (Refine_ID) REFERENCES Refining_Process(Refine_ID)
    )`);

    // Retail
    await query(`CREATE TABLE IF NOT EXISTS Retail (
      Retail_ID VARCHAR(255) PRIMARY KEY,
      Station_ID VARCHAR(255) NOT NULL,
      Receive_Volume INT NOT NULL,
      Storage_Tank_Condition INT,
      Distribution_ID VARCHAR(255),
      FOREIGN KEY (Distribution_ID) REFERENCES Distribution(Distribution_ID)
    )`);

    // Transaction_Ledger
    await query(`CREATE TABLE IF NOT EXISTS Transaction_Ledger (
      Transaction_ID INT PRIMARY KEY AUTO_INCREMENT,
      TableName VARCHAR(255) NOT NULL,
      Record_ID VARCHAR(255) NOT NULL,
      Operation VARCHAR(50) NOT NULL DEFAULT 'INSERT',
      Old_Data TEXT,
      New_Data TEXT NOT NULL,
      Transaction_Data_Hash VARCHAR(255) NOT NULL,
      Previous_Transaction_Hash VARCHAR(255),
      Digital_Signature_Sender VARCHAR(255) NOT NULL,
      Digital_Signature_Receiver VARCHAR(255),
      Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('MySQL Database Initialized Successfully.');
  } catch (err) {
    console.error('Error initializing MySQL database:', err);
    console.log('Make sure your MySQL server is running and the database exists.');
  }
}

export default pool;
