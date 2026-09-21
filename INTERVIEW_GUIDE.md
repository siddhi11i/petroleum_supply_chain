# Petroleum Supply Chain Integrity System — Complete Interview Guide

Use this document to prepare for your technical interview. It covers the core idea, problem statement, architecture, tech stack justification, complete project flow, functionalities, SQL queries, blockchain-inspired ledger logic, limitations, and likely interview questions with model answers.

---

## 1. The Core Idea & 60-Second Pitch

### 60-Second Interview Pitch
> "I built a full-stack **Petroleum Supply Chain Integrity System** designed to ensure end-to-end transparency and combat fuel theft, dilution, and log tampering across the oil lifecycle—from crude extraction all the way to retail gas station pumps.
>
> The fundamental problem in oil logistics is that each stage—drilling, maritime or pipeline transit, storage tank farms, refineries, regional tankers, and retail stations—operates in data silos. Malicious actors exploit this to siphon fuel, alter volume records, or dilute refined fuels with solvents.
>
> To solve this, I designed a React and Express/TypeScript system backed by a dual-engine database (MySQL with automatic SQLite fallback). Crucially, it incorporates a **blockchain-inspired cryptographic hash chain**: every transaction written to any stage is hashed with SHA-256 and chained to the previous transaction's hash in an immutable ledger. 
>
> The system features 8-role RBAC, 6-stage bidirectional provenance tracing (allowing an auditor to trace any pump batch back to its extraction crude lot), dynamic stakeholder Trust Scores (0–100%), and a secure OTP password reset flow."

---

## 2. The Problem It Solves & Why It Matters

In traditional petroleum supply chains:
1. **Fuel Adulteration & Chemical Dilution**: Finished gasoline is often blended with low-grade kerosene or industrial solvents during regional distribution.
2. **Transit Siphoning & Inventory Shrinkage**: Drivers or terminal operators siphon fuel and alter database records to cover the volumetric discrepancy.
3. **Siloed Databases & Lack of Provenance**: When bad fuel damages vehicle engines at a pump, oil companies cannot easily determine whether the issue occurred at the refinery, during pipeline transit, or inside the gas station's storage tank.
4. **Data Tampering & Unaudited Edits**: Traditional CRUD systems allow database administrators or compromised accounts to run silent `UPDATE` or `DELETE` queries without leaving a verifiable audit trail.
5. **Environmental Accountability**: Regulations demand tracking of CO2 emissions at refining and transit stages, but these logs are disconnected from operational fuel batches.

---

## 3. Tech Stack & Engineering Justification

| Technology | Role | Why This Was Chosen | Alternatives Considered & Why Rejected |
| :--- | :--- | :--- | :--- |
| **TypeScript** | Language (Full-Stack) | Strict type contracts across database entities, API requests, and UI state prevent runtime type mismatches. | **Plain JavaScript**: High risk of runtime bugs with complex multi-stage payloads. |
| **Node.js + Express** | Backend Engine | Lightweight, non-blocking asynchronous event loop with native support for cryptographic modules and REST APIs. | **Python/Django**: Too heavy and opinionated; Express gave direct control over custom cryptographic middlewares. |
| **React 18 + Vite** | Frontend UI | Single-page reactive dashboard with instant HMR and dynamic state updates across complex multi-stage forms. | **Next.js**: SSR was unnecessary for an internal operations/auditing portal; client SPA with Vite is faster and simpler to deploy. |
| **Tailwind CSS** | Styling System | Utility-first styling enabling high-contrast, clean dark/light UI with consistent spacing and zero CSS overhead. | **CSS Modules / Bootstrap**: Slower development velocity and bloated stylesheets. |
| **Dual DB (MySQL + SQLite)** | Data Persistence | MySQL for enterprise connection pooling; automatic silent fallback to `better-sqlite3` for zero-config local runs. | **Pure MySQL**: Fails immediately if DB service is down. **Pure SQLite**: Can suffer file lock contention at scale. |
| **Node Crypto (`crypto`)** | Cryptography | Native C++ implementation of SHA-256 for fast hash calculation without external dependencies. | **Custom JS hash functions**: Slower and cryptographically insecure. |
| **JWT (`jsonwebtoken`)** | Authentication | Stateless authorization tokens containing user claims (`username`, `role`), eliminating server session memory. | **Server sessions (cookies)**: Harder to scale horizontally across multiple backend instances. |
| **Bcrypt (`bcrypt`)** | Password Security | Adaptive one-way salt hashing (cost factor 10) prevents rainbow table and brute-force password recovery. | **Plain SHA-256 for passwords**: Vulnerable to fast dictionary attacks. |

---

## 4. Blockchain-Inspired vs. Real Blockchain (Critical Interview Topic)

### Is it a real blockchain?
**No. It is a "Blockchain-Inspired Cryptographic Audit Ledger".**

### The Core Differences:
1. **Centralized vs. Decentralized**:
   - A real blockchain (Ethereum, Hyperledger) runs on thousands of independent peer-to-peer nodes with consensus algorithms (Proof of Work, Proof of Stake, Raft, PBFT).
   - This project runs on a centralized relational database (MySQL/SQLite) and Express server.
2. **Consensus vs. Application Logic**:
   - Blockchain uses consensus protocols to agree on block validity.
   - This system uses application-level RBAC and database transactions.
3. **What was borrowed from Blockchain**:
   - **SHA-256 Hash Chaining**: Every transaction row stores `Transaction_Data_Hash` and `Previous_Transaction_Hash`.
   - **Formula**: `Hash[n] = SHA-256(TableName + RecordID + Operation + OldData + NewData + Hash[n-1])`.
   - **Tamper Evidence**: If anyone modifies row 3 in MySQL directly, its hash changes, breaking the link to row 4. An auditor can instantly detect database tampering.
   - **Append-Only Immutability**: No rows are deleted. Modifications write an `UPDATE` block and archive old state in `Correction_Snapshots`.

### Real-World Parallel:
- **Amazon QLDB (Quantum Ledger Database)**: Centralized database with a verifiable SHA-256 journal.
- **Git**: Uses a DAG of SHA-1/SHA-256 hashes to track commit history without being a cryptocurrency.

---

## 5. System Architecture & End-to-End Project Flow

### Architecture Overview
```
[ Browser / React SPA ]
         │
         ▼  HTTP REST + Bearer JWT
[ Express Backend (server.ts) ]
    ├── Authentication Middleware (JWT verification + Role check)
    ├── Cryptographic Engine (SHA-256 block hash computation)
    └── Business Handlers (CRUD, Provenance, Trust Score)
         │
         ▼  Unified Query Abstraction
[ Database Layer (db.ts) ]
    ├── Primary: MySQL Connection Pool
    └── Fallback: SQLite (better-sqlite3)
```

### Complete End-to-End Operational Flow
1. **Authentication**:
   - User logs in specifying username, password, and their specific role (e.g. `CRUDE_MANAGER`, `STORAGE_MANAGER`).
   - Server checks `bcrypt.compare()`. On match, issues a signed JWT containing `{ username, role }`.
2. **Logging a Stage Record (e.g., Terminal Storage Batch)**:
   - Client sends `POST /api/storage` with `Transit_ID`, `Tank_Number`, `Current_Capacity`, and `Threshold`.
   - Backend `authenticateToken` middleware checks role permission.
   - Server executes `INSERT INTO Storage_Batch ...`.
   - Backend immediately calls `recordLedgerTransaction()`:
     - Fetches latest block hash from `Transaction_Ledger`.
     - Computes: `SHA256("Storage_Batch" + BatchID + "INSERT" + "" + NewDataJSON + PrevHash)`.
     - Appends row to `Transaction_Ledger` with user signature.
3. **Provenance Traversal**:
   - User enters a Retail ID (e.g. `RT-101`) into the Provenance page.
   - Backend traces foreign keys recursively upstream:
     `Retail -> Distribution -> Refining_Process -> Storage_Batch -> Transportation_Log -> Crude_Purchase`.
   - Returns a connected lifecycle object rendered as a 7-stage visual pipeline.
4. **Data Correction & Audit Snapshots**:
   - If a record was entered incorrectly, an authorized manager submits a correction.
   - Server writes the original state into `Correction_Snapshots` with the reason and username.
   - Server updates the stage table and writes an `UPDATE` block to `Transaction_Ledger`.
   - The user's **Trust Score** is dynamically penalized (-15%).

---

## 6. Core Functionalities

1. **8-Role Role-Based Access Control (RBAC)**:
   - `CRUDE_MANAGER`, `TRANSPORT_MANAGER`, `STORAGE_MANAGER`, `REFINING_MANAGER`, `DISTRIBUTION_MANAGER`, `RETAIL_MANAGER`, `ENVIRONMENT_MANAGER`, and `ADMIN`.
2. **Cryptographic SHA-256 Audit Trail**:
   - Every creation or update across all tables appends an immutable block to `Transaction_Ledger`.
3. **End-to-End Provenance Graph**:
   - Bidirectional supply chain tracing linking retail fuel back to the crude extraction lot.
4. **Dynamic Trust Score Engine**:
   - Computes integrity rating (0–100%) for every manager:
     `Trust Score = min(100, max(0, 100 - (Overrides * 15) + (Valid Transactions * 2)))`.
5. **Self-Service OTP Password Reset**:
   - 6-digit random code, 10-minute expiration window, validated against database timestamps.
6. **Safety & Environmental Auditing**:
   - Storage safety thresholds (< 5,000 bbl alerts), adulteration test logging, and CO2 emission monitoring.

---

## 7. Essential SQL Queries

### Table Creation (DDL)
```sql
-- 1. Users & RBAC
CREATE TABLE IF NOT EXISTS Users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'USER',
  otp VARCHAR(10),
  otp_expiry DATETIME
);

-- 2. Supply Chain Core Stages
CREATE TABLE IF NOT EXISTS Crude_Purchase (
  Purchase_ID VARCHAR(255) PRIMARY KEY,
  Volume INT NOT NULL,
  Price INT NOT NULL,
  Grade VARCHAR(255) NOT NULL,
  Purchased_Date VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Transportation_Log (
  Transit_ID VARCHAR(255) PRIMARY KEY,
  Vehicle_ID VARCHAR(255) NOT NULL,
  Driver_ID VARCHAR(255),
  Quantity INT,
  Route_Type VARCHAR(50) NOT NULL,
  Distance INT DEFAULT 500,
  Departure_Time VARCHAR(255) NOT NULL,
  Arrival_Time VARCHAR(255),
  Fuel_Quality VARCHAR(255) NOT NULL,
  Purchase_ID VARCHAR(255),
  FOREIGN KEY (Purchase_ID) REFERENCES Crude_Purchase(Purchase_ID)
);

CREATE TABLE IF NOT EXISTS Storage_Batch (
  Batch_ID VARCHAR(255) PRIMARY KEY,
  Tank_Number INT NOT NULL,
  Current_Capacity INT NOT NULL,
  Threshold INT DEFAULT 5000,
  Last_Inspection_Date VARCHAR(255),
  Transit_ID VARCHAR(255),
  FOREIGN KEY (Transit_ID) REFERENCES Transportation_Log(Transit_ID)
);

CREATE TABLE IF NOT EXISTS Refining_Process (
  Refine_ID VARCHAR(255) PRIMARY KEY,
  Input_Volume INT NOT NULL,
  Output_Volume INT NOT NULL,
  Refining_Date VARCHAR(255) NOT NULL,
  Additive_Chemical_Fingerprint TEXT,
  Throughput_Efficiency DOUBLE,
  Batch_ID VARCHAR(255),
  FOREIGN KEY (Batch_ID) REFERENCES Storage_Batch(Batch_ID)
);

CREATE TABLE IF NOT EXISTS Distribution (
  Distribution_ID VARCHAR(255) PRIMARY KEY,
  Dispatch_Volume INT NOT NULL,
  Distance INT DEFAULT 200,
  Delivery_Status VARCHAR(50) NOT NULL,
  Adulteration_Test_Result TEXT,
  Final_Consumer_Hash TEXT,
  Refine_ID VARCHAR(255),
  FOREIGN KEY (Refine_ID) REFERENCES Refining_Process(Refine_ID)
);

CREATE TABLE IF NOT EXISTS Retail (
  Retail_ID VARCHAR(255) PRIMARY KEY,
  Station_ID VARCHAR(255) NOT NULL,
  Receive_Volume INT NOT NULL,
  Storage_Tank_Condition INT,
  Distribution_ID VARCHAR(255),
  FOREIGN KEY (Distribution_ID) REFERENCES Distribution(Distribution_ID)
);

-- 3. Cryptographic Ledger
CREATE TABLE IF NOT EXISTS Transaction_Ledger (
  Transaction_ID INT PRIMARY KEY AUTO_INCREMENT,
  TableName VARCHAR(255) NOT NULL,
  Record_ID VARCHAR(255) NOT NULL,
  Operation VARCHAR(50) NOT NULL DEFAULT 'INSERT',
  Old_Data TEXT,
  New_Data TEXT NOT NULL,
  Transaction_Data_Hash VARCHAR(255) NOT NULL,
  Previous_Transaction_Hash VARCHAR(255),
  Digital_Signature_Sender VARCHAR(255) NOT NULL,
  Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Full Provenance JOIN Query (Pump back to Crude Lot)
```sql
SELECT 
    rt.Retail_ID, rt.Station_ID, rt.Receive_Volume,
    d.Distribution_ID, d.Dispatch_Volume, d.Adulteration_Test_Result,
    rp.Refine_ID, rp.Throughput_Efficiency, rp.Additive_Chemical_Fingerprint,
    sb.Batch_ID, sb.Tank_Number, sb.Current_Capacity,
    tl.Transit_ID, tl.Vehicle_ID, tl.Route_Type, tl.Fuel_Quality,
    cp.Purchase_ID, cp.Volume AS Extraction_Volume, cp.Grade AS Crude_Grade
FROM Retail rt
INNER JOIN Distribution d ON rt.Distribution_ID = d.Distribution_ID
INNER JOIN Refining_Process rp ON d.Refine_ID = rp.Refine_ID
INNER JOIN Storage_Batch sb ON rp.Batch_ID = sb.Batch_ID
INNER JOIN Transportation_Log tl ON sb.Transit_ID = tl.Transit_ID
INNER JOIN Crude_Purchase cp ON tl.Purchase_ID = cp.Purchase_ID
WHERE rt.Retail_ID = 'RT-101';
```

### Manager Trust Score Calculation Query
```sql
SELECT 
    u.username,
    u.role,
    COALESCE(ledger.valid_count, 0) AS signed_transactions,
    COALESCE(err.error_count, 0) AS override_penalties,
    CASE 
        WHEN (COALESCE(ledger.valid_count, 0) + COALESCE(err.error_count, 0)) = 0 THEN 100
        ELSE ROUND(
            (COALESCE(ledger.valid_count, 0) * 100.0) / 
            (COALESCE(ledger.valid_count, 0) + COALESCE(err.error_count, 0))
        )
    END AS trust_percentage
FROM Users u
LEFT JOIN (
    SELECT Digital_Signature_Sender, COUNT(*) AS valid_count 
    FROM Transaction_Ledger GROUP BY Digital_Signature_Sender
) ledger ON u.username = ledger.Digital_Signature_Sender
LEFT JOIN (
    SELECT Triggered_By_Username, COUNT(*) AS error_count 
    FROM Correction_Snapshots GROUP BY Triggered_By_Username
) err ON u.username = err.Triggered_By_Username
ORDER BY trust_percentage DESC;
```

---

## 8. Limitations & Trade-offs (What to Say When Asked)

1. **Centralized Database Bottleneck**:
   - *Limitation*: The ledger runs on a centralized relational DB. A rogue DBA with root server access could theoretically alter data and recompute hashes.
   - *Improvement*: In production, replicate the ledger asynchronously to AWS S3 Object Lock (WORM storage) or an external distributed ledger node.
2. **SQLite Concurrency in Fallback Mode**:
   - *Limitation*: SQLite uses file-level locking during writes. Under high concurrent write load, it can encounter busy locks.
   - *Improvement*: Use PostgreSQL with read replicas for high-throughput enterprise deployments.
3. **Symmetric Signatures vs. Asymmetric Cryptography**:
   - *Limitation*: Digital signatures currently store the authenticated user's `username` string rather than verifying private-key ECDSA signatures.
   - *Improvement*: Add client-side Web Crypto API key-pair generation where each manager signs transactions using their private key.

---

## 9. Top 10 Technical Interview Questions & Model Answers

### Q1: "Walk me through this project."
> "I built an end-to-end Petroleum Supply Chain Integrity System to tackle fuel theft, adulteration, and log tampering. It uses React on the frontend, Express and TypeScript on the backend, and a dual-engine database (MySQL with SQLite fallback). Every transaction logged across the 7 supply chain stages is cryptographically hashed with SHA-256 and chained into an immutable ledger table. The platform includes 8-role RBAC, bidirectional provenance tracing from pump to crude oil lot, and dynamic manager Trust Scores."

### Q2: "Why use SHA-256 hash chaining instead of a full blockchain like Ethereum?"
> "A decentralized blockchain introduces gas fees, 5–15 second block finality times, and immense operational complexity. For petroleum logistics, companies need sub-millisecond write speeds and complex relational SQL JOIN queries. By implementing a SHA-256 hash chain directly within the database, we get the cryptographic tamper-evidence of a blockchain with the speed, relational integrity, and cost efficiency of standard web architecture."

### Q3: "What happens if someone directly alters a record in the database?"
> "If a rogue operator runs an `UPDATE` directly in SQL to alter volumes, the data will no longer match its recorded SHA-256 hash. Even if they re-hash that row, the *next* block in `Transaction_Ledger` points to the old hash in its `Previous_Transaction_Hash` column. An audit check recalculating hashes sequentially immediately pinpoints the exact row where the chain was broken."

### Q4: "How does the Provenance feature work?"
> "Our relational schema links stages via foreign keys: `Retail` references `Distribution`, which references `Refining`, which references `Storage`, which references `Transport`, which references `Crude Purchase`. When given any ID, the `/api/provenance/:id` endpoint traverses these references upstream and downstream to reconstruct the full custody chain as a single JSON graph."

### Q5: "How does the dual-database architecture work in `db.ts`?"
> "When the server starts, `initializeDatabase()` attempts to establish a connection pool to MySQL. If MySQL is unreachable (like in an offline demo, local test, or container environment), it catches the error and instantiates a local SQLite database via `better-sqlite3`. A unified `query()` abstraction handles both drivers seamlessly so API routes require no code changes."

### Q6: "How do you calculate Trust Scores?"
> "The `/api/trust-scores` endpoint tracks two metrics per user: total successful transactions signed in `Transaction_Ledger`, and total correction/override events in `Correction_Snapshots`. Each valid signature adds +2% to their score, while each error correction docks -15%. The score is clamped between 0% and 100%, giving auditors a real-time reliability index."

### Q7: "How is authentication implemented?"
> "We use salted bcrypt password hashing (cost factor 10) and stateless JSON Web Tokens. On login, the server issues a JWT containing the user's username and role. The `authenticateToken` middleware verifies the token signature on protected routes and validates stage-specific permissions before letting the request proceed."

### Q8: "How does the password reset OTP feature work?"
> "When a user requests a reset, the backend generates a cryptographically secure 6-digit OTP and computes an expiration timestamp 10 minutes out. These are stored in the user's row in `Users`. When the user submits the OTP with their new password, the server checks both code equality and that `NOW() <= otp_expiry` before updating the bcrypt password hash."

### Q9: "How do you handle volumetric losses across stages?"
> "Petroleum naturally undergoes minor volumetric shrinkage during refining and transit (thermal expansion, evaporation). Our schema tracks both `Input_Volume` and `Output_Volume` alongside `Throughput_Efficiency` in `Refining_Process`. If the loss exceeds normal thresholds (e.g. > 3%), the system can flag it as an alert in `System_Alerts`."

### Q10: "If you had two more weeks, what would you add?"
> "First, I'd implement asymmetric public-key cryptography (ECDSA) in the browser so managers sign transactions with private keys. Second, I'd integrate real-time WebSockets for instant threshold breach notifications. Third, I'd replicate ledger hashes to an append-only cloud storage service like AWS S3 Object Lock for zero-trust offsite verification."
