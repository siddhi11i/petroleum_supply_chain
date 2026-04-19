import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { query, initializeDatabase } from './db.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';

app.use(cors());
app.use(express.json());

// --- Helper Functions ---

const generateHash = (data: any) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const getLatestLedgerHash = async (): Promise<string | null> => {
  const results: any = await query('SELECT Transaction_Data_Hash FROM Transaction_Ledger ORDER BY Transaction_ID DESC LIMIT 1');
  return results.length > 0 ? results[0].Transaction_Data_Hash : '0'.repeat(64);
};

const addToLedger = async (tableName: string, recordId: string, newData: any, signature: string, operation: string = 'INSERT', oldData: any = null) => {
  const previousHash = await getLatestLedgerHash();
  
  const ledgerEntry = {
    tableName,
    recordId,
    operation,
    oldData: oldData ? JSON.stringify(oldData) : null,
    newData: JSON.stringify(newData),
    previousHash,
    timestamp: new Date().toISOString()
  };

  const currentHash = generateHash(ledgerEntry);

  await query(`
    INSERT INTO Transaction_Ledger 
    (TableName, Record_ID, Operation, Old_Data, New_Data, Transaction_Data_Hash, Previous_Transaction_Hash, Digital_Signature_Sender)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [tableName, recordId, operation, ledgerEntry.oldData, ledgerEntry.newData, currentHash, previousHash, signature]);
};

// --- Auth Middleware ---

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    req.user = user;
    next();
  });
};

// --- Auth Routes ---

app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await query('INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)', [username, hashedPassword, role || 'USER']);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const results: any = await query('SELECT * FROM Users WHERE username = ?', [username]);
    const user = results[0];
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username, role: user.role });
  } catch (err: any) {
    console.error('Detailed Login Error:', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// --- CRUD Routes ---

// Generic CRUD helper generator
const createCRUDRoutes = (tableName: string, idField: string) => {
  const roleMapping: Record<string, string> = {
    'Crude_Purchase': 'CRUDE_MANAGER',
    'Transportation_Log': 'TRANSPORT_MANAGER',
    'Storage_Batch': 'STORAGE_MANAGER',
    'Refining_Process': 'REFINING_MANAGER',
    'Distribution': 'DISTRIBUTION_MANAGER',
    'Retail': 'RETAIL_MANAGER',
    'CO2_Emissions': 'SYSTEM_ONLY' // Manual entries disabled, logic handles calculations
  };

  const checkRole = (req: any, res: any, next: any) => {
    const userRole = req.user.role;
    const requiredRole = roleMapping[tableName];
    if (userRole === 'ADMIN' || userRole === requiredRole) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. You do not have permission to edit this section.' });
    }
  };

  const processAlerts = async (data: any) => {
    if (tableName === 'Storage_Batch') {
      const capacity = Number(data.Current_Capacity);
      const threshold = Number(data.Threshold) || 5000;
      if (capacity < threshold) {
        await query(`
          INSERT INTO System_Alerts (Type, Message)
          VALUES (?, ?)
        `, ['CRITICAL_STOCK', `Tank ${data.Tank_Number} (Batch ${data.Batch_ID}) is below threshold: ${capacity}L / ${threshold}L`]);
        
        // Auto Reorder Trigger
        await query(`
          INSERT INTO System_Alerts (Type, Message)
          VALUES (?, ?)
        `, ['AUTO_REORDER', `Auto-reorder initiated for Tank ${data.Tank_Number}. Current stock: ${capacity}L`]);
      }
    }
  };

  const logCorrectionSnapshot = async (id: string, error: string, snapshot: any, user: any = null) => {
    await query(`
      INSERT INTO Correction_Snapshots (Table_Name, Record_ID, Error_Description, JSON_Snapshot, Triggered_By_Username, Triggered_By_Role)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [tableName, id, error, JSON.stringify(snapshot), user?.username || 'SYSTEM', user?.role || 'SYSTEM']);
  };

  // GET all
  app.get(`/api/${tableName.toLowerCase()}`, authenticateToken, async (req, res) => {
    try {
      const rows = await query(`SELECT * FROM ${tableName}`);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST new
  app.post(`/api/${tableName.toLowerCase()}`, authenticateToken, checkRole, async (req, res) => {
    const { signature, ...data } = req.body;
    
    // Throughput Efficiency Calculation
    if (tableName === 'Refining_Process' && data.Input_Volume && data.Output_Volume) {
      data.Throughput_Efficiency = (data.Output_Volume / data.Input_Volume) * 100;
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(',');

    try {
      await query(
        `INSERT INTO ${tableName} (${fields.join(',')}) VALUES (${placeholders})`,
        values
      );
      
      await processAlerts(data);
      await addToLedger(tableName, data[idField], data, signature || 'SYSTEM_GEN');
      res.status(201).json({ message: 'Record created and ledger updated', id: data[idField] });
    } catch (err: any) {
      console.error(`Error adding to ${tableName}:`, err);
      await logCorrectionSnapshot(data[idField] || 'NEW', err.message, data, (req as any).user);
      let errorMessage = err.message;
      if (err.message.includes('foreign key constraint fails')) {
        errorMessage = 'Reference ID not found in the related table. Please verify your IDs.';
      } else if (err.message.includes('Duplicate entry')) {
        errorMessage = 'A record with this ID already exists.';
      }
      res.status(400).json({ error: errorMessage });
    }
  });

  // PUT update (Correction with Snapshot)
  app.put(`/api/${tableName.toLowerCase()}/:id`, authenticateToken, checkRole, async (req, res) => {
    const { id } = req.params;
    const { signature, ...data } = req.body;
    
    try {
      const results: any = await query(`SELECT * FROM ${tableName} WHERE ${idField} = ?`, [id]);
      const oldData = results[0];
      if (!oldData) return res.status(404).json({ error: 'Record not found' });

      const fields = Object.keys(data);
      const values = [...Object.values(data), id];
      const setClause = fields.map(f => `${f} = ?`).join(',');

      await query(`UPDATE ${tableName} SET ${setClause} WHERE ${idField} = ?`, values);
      
      await processAlerts(data);
      await addToLedger(tableName, id, data, signature || 'SYSTEM_CORRECTION', 'UPDATE', oldData);
      res.json({ message: 'Record updated and correction logged' });
    } catch (err: any) {
      console.error(`Error updating ${tableName}:`, err);
      await logCorrectionSnapshot(id, err.message, data, (req as any).user);
      let errorMessage = err.message;
      if (err.message.includes('foreign key constraint fails')) {
        errorMessage = 'Reference ID not found in the related table. Please verify your IDs.';
      }
      res.status(400).json({ error: errorMessage });
    }
  });
};

// Initialize routes for all tables
createCRUDRoutes('Crude_Purchase', 'Purchase_ID');
createCRUDRoutes('Transportation_Log', 'Transit_ID');
createCRUDRoutes('Storage_Batch', 'Batch_ID');
createCRUDRoutes('Refining_Process', 'Refine_ID');
createCRUDRoutes('Distribution', 'Distribution_ID');
createCRUDRoutes('Retail', 'Retail_ID');
createCRUDRoutes('CO2_Emissions', 'Emission_ID');

// Ledger Route
app.get('/api/ledger', authenticateToken, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM Transaction_Ledger ORDER BY Transaction_ID DESC');
    res.json(rows);
  } catch (err: any) {
    console.error('Ledger error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Provenance Tracking
app.get('/api/provenance/:type/:id', authenticateToken, async (req, res) => {
  const { type, id } = req.params;
  let provenance: any = {
    crude: null,
    transport: null,
    storage: null,
    refining: null,
    distribution: null,
    retail: null
  };

  try {
    const row = await getTrace(type, id);
    if (!row[type]) {
      return res.status(404).json({ error: `Record ${id} not found` });
    }
    res.json(row);
  } catch (err: any) {
    console.error('Provenance error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Shared Tracing Logic
async function getTrace(type: string, id: string) {
  const provenance: any = { crude: null, transport: null, storage: null, refining: null, distribution: null, retail: null };
  const tables = ['Crude_Purchase', 'Transportation_Log', 'Storage_Batch', 'Refining_Process', 'Distribution', 'Retail'];
  const idFields = ['Purchase_ID', 'Transit_ID', 'Batch_ID', 'Refine_ID', 'Distribution_ID', 'Retail_ID'];
  const stageKeys = ['crude', 'transport', 'storage', 'refining', 'distribution', 'retail'];
  
  const stageIdx = stageKeys.indexOf(type);
  if (stageIdx === -1) throw new Error('Invalid stage type');

  const currentRes: any = await query(`SELECT * FROM ${tables[stageIdx]} WHERE ${idFields[stageIdx]} = ?`, [id]);
  if (!currentRes[0]) return provenance;
  
  provenance[type] = currentRes[0];
  
  // Trace Backward
  let cursor = currentRes[0];
  for (let i = stageIdx - 1; i >= 0; i--) {
    const fkField = i === 0 ? 'Purchase_ID' : i === 1 ? 'Transit_ID' : i === 2 ? 'Batch_ID' : i === 3 ? 'Refine_ID' : 'Distribution_ID';
    const parentId = cursor[fkField];
    if (!parentId) break;
    const parentRes: any = await query(`SELECT * FROM ${tables[i]} WHERE ${idFields[i]} = ?`, [parentId]);
    if (parentRes[0]) {
      provenance[stageKeys[i]] = parentRes[0];
      cursor = parentRes[0];
    } else break;
  }
  
  // Trace Forward
  cursor = currentRes[0];
  for (let i = stageIdx + 1; i < tables.length; i++) {
    const childIdFieldToMatch = i === 1 ? 'Purchase_ID' : i === 2 ? 'Transit_ID' : i === 3 ? 'Batch_ID' : i === 4 ? 'Refine_ID' : 'Distribution_ID';
    const childRes: any = await query(`SELECT * FROM ${tables[i]} WHERE ${childIdFieldToMatch} = ?`, [cursor[idFields[i-1]]]);
    if (childRes[0]) {
      provenance[stageKeys[i]] = childRes[0];
      cursor = childRes[0];
    } else break;
  }
  return provenance;
}

// Reorder Alerts
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await query("SELECT * FROM System_Alerts WHERE Status = 'ACTIVE' ORDER BY Created_At DESC LIMIT 20");
    const storageAlerts = (alerts as any[]).filter(a => a.Type === 'CRITICAL_STOCK');
    const reorderAlerts = (alerts as any[]).filter(a => a.Type === 'AUTO_REORDER');
    res.json({ stockAlerts: reorderAlerts, storageAlerts: storageAlerts, all: alerts });
  } catch (err: any) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/alerts/history', authenticateToken, async (req, res) => {
  try {
    const alerts = await query("SELECT * FROM System_Alerts WHERE Status != 'ACTIVE' ORDER BY Created_At DESC LIMIT 50");
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/alerts/:id/acknowledge', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await query("UPDATE System_Alerts SET Status = 'ACKNOWLEDGED' WHERE Alert_ID = ?", [id]);
    res.json({ message: 'Alert acknowledged' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Environmental Compliance Report & LCA Tracking
app.get('/api/compliance/:batchId', authenticateToken, async (req, res) => {
  const { batchId } = req.params;

  try {
    // Detect type from prefix
    let type = 'storage';
    const upperId = batchId.toUpperCase();
    if (upperId.startsWith('RT')) type = 'retail';
    else if (upperId.startsWith('D')) type = 'distribution';
    else if (upperId.startsWith('R')) type = 'refining';
    else if (upperId.startsWith('S')) type = 'storage';
    else if (upperId.startsWith('T')) type = 'transport';
    else if (upperId.startsWith('C')) type = 'crude';

    let provenance = await getTrace(type, upperId);
    
    // Exhaustive fallback: If not found by prefix, try every table
    if (!Object.values(provenance).some(v => v !== null)) {
      const stageKeys = ['crude', 'transport', 'storage', 'refining', 'distribution', 'retail'];
      for (const k of stageKeys) {
        if (k === type) continue; // Skip since we already tried it
        const fallback = await getTrace(k, upperId);
        if (Object.values(fallback).some(v => v !== null)) {
          provenance = fallback;
          break;
        }
      }
    }

    if (!Object.values(provenance).some(v => v !== null)) {
      return res.status(404).json({ error: 'Batch journey data not found. System could not locate any records for this ID in any supply chain stage.' });
    }

    // Collect all unique IDs in the journey
    const journeyIds: string[] = [];
    const idFields = ['Purchase_ID', 'Transit_ID', 'Batch_ID', 'Refine_ID', 'Distribution_ID', 'Retail_ID'];
    const stageKeys = ['crude', 'transport', 'storage', 'refining', 'distribution', 'retail'];
    
    stageKeys.forEach((key, idx) => {
      if (provenance[key]) {
        journeyIds.push(provenance[key][idFields[idx]]);
      }
    });

    if (journeyIds.length === 0) return res.json({ error: 'No journey data' });

    // --- LCA CALCULATIONS USING USER FORMULAS ---
    const v_crude = provenance.crude?.Volume || 0;
    const v_transport = provenance.transport?.Quantity || v_crude;
    const d_transport = provenance.transport?.Distance || 500;
    const v_storage = provenance.storage?.Current_Capacity || v_transport;
    const v_refining = provenance.refining?.Input_Volume || v_storage;
    const v_distribution = provenance.distribution?.Dispatch_Volume || v_refining;
    const d_distribution = provenance.distribution?.Distance || 200;
    const v_retail = provenance.retail?.Receive_Volume || v_distribution;

    const e1_crude = (v_crude * 0.15) * 0.4;
    const e2_transport = d_transport * (v_transport * 0.00085) * 0.062;
    const e3_storage = (v_storage * 0.02 * 0.4) + (v_storage * 0.0005 * 2.3);
    const e4_refining = (v_refining * 0.45) * 0.4;
    const e5_distribution = d_distribution * (v_distribution * 0.00085) * 0.062;
    const e6_retail = v_retail * 2.31;

    const stageEmissions = [
      { stage: 'Crude Purchase', value: e1_crude, color: 'blue' },
      { stage: 'Transportation', value: e2_transport, color: 'amber' },
      { stage: 'Storage', value: e3_storage, color: 'teal' },
      { stage: 'Refining', value: e4_refining, color: 'purple' },
      { stage: 'Distribution', value: e5_distribution, color: 'emerald' },
      { stage: 'Retail Point', value: e6_retail, color: 'pink' }
    ];

    const totalEmissions = e1_crude + e2_transport + e3_storage + e4_refining + e5_distribution + e6_retail;
    const carbonIntensity = v_crude > 0 ? totalEmissions / v_crude : 0;

    const hotspot = stageEmissions.reduce((prev, current) => (prev.value > current.value) ? prev : current);

    const breakdown = stageEmissions.map(s => ({
      ...s,
      percentage: totalEmissions > 0 ? (s.value / totalEmissions) * 100 : 0
    }));

    res.json({
      batchId,
      stages: { 
        crude: provenance.crude, 
        transport: provenance.transport, 
        storage: provenance.storage, 
        refining: provenance.refining, 
        distribution: provenance.distribution, 
        retail: provenance.retail 
      },
      totalEmissions,
      carbonIntensity,
      hotspot,
      breakdown,
      complianceStatus: carbonIntensity < 2.5 ? 'COMPLIANT' : 'WARNING: HIGH CARBON INTENSITY',
      lcaReport: {
        footprint: totalEmissions,
        unit: 'kg CO2',
        assessmentDate: new Date().toISOString(),
        boundary: 'Cradle-to-Grave',
        methodology: 'Simplified Process-based LCA (IPCC guidelines)'
      }
    });
  } catch (err: any) {
    console.error('Compliance error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Transporter Trust Scores
app.get('/api/transporters/scores', authenticateToken, async (req, res) => {
  try {
    const logs: any = await query('SELECT * FROM Transportation_Log');
    const scores: Record<string, { total: number, verified: number, qualityTotal: number, count: number }> = {};
    
    logs.forEach((log: any) => {
      const id = log.Vehicle_ID;
      if (!scores[id]) scores[id] = { total: 0, verified: 0, qualityTotal: 0, count: 0 };
      
      scores[id].count++;
      // Integrity: Quantity consistency check (simulated based on Arrival presence)
      if (log.Arrival_Time) scores[id].verified++;
      
      // Quality: Based on Fuel_Quality character mapping
      const qualityScore = log.Fuel_Quality?.toLowerCase().includes('good') || log.Fuel_Quality?.toLowerCase().includes('verified') ? 100 : 70;
      scores[id].qualityTotal += qualityScore;
    });

    const finalScores = Object.entries(scores).map(([id, stats]) => ({
      id,
      integrity: Math.round((stats.verified / stats.count) * 100),
      quality: Math.round(stats.qualityTotal / stats.count),
      rating: Math.round(((stats.verified / stats.count) * 50) + ((stats.qualityTotal / stats.count / 100) * 50))
    })).sort((a, b) => b.rating - a.rating);

    res.json(finalScores);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// JSON Correction Snapshots
app.get('/api/snapshots', authenticateToken, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM Correction_Snapshots ORDER BY Timestamp DESC');
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single Record Fetch for Snapshots Comparison
app.get('/api/record/:tableName/:id', authenticateToken, async (req, res) => {
  const { tableName, id } = req.params;
  const idFields: Record<string, string> = {
    'Crude_Purchase': 'Purchase_ID',
    'Transportation_Log': 'Transit_ID',
    'Storage_Batch': 'Batch_ID',
    'Refining_Process': 'Refine_ID',
    'Distribution': 'Distribution_ID',
    'Retail': 'Retail_ID',
    'CO2_Emissions': 'Emission_ID'
  };

  const idField = idFields[tableName];
  if (!idField) return res.status(400).json({ error: 'Invalid table name' });

  try {
    const results: any = await query(`SELECT * FROM ${tableName} WHERE ${idField} = ?`, [id]);
    res.json(results[0] || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ledger Reconstruction (Historical State)
app.get('/api/ledger/reconstruct/:tableName/:recordId', authenticateToken, async (req, res) => {
  const { tableName, recordId } = req.params;
  try {
    const history = await query('SELECT * FROM Transaction_Ledger WHERE TableName = ? AND Record_ID = ? ORDER BY Timestamp ASC', [tableName, recordId]);
    res.json(history);
  } catch (err: any) {
    console.error('Ledger reconstruction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Available IDs for Workflow Stages
app.get('/api/workflow/available-ids/:stage', authenticateToken, async (req, res) => {
  const { stage } = req.params;
  
  const stageConfig: Record<string, { table: string, idField: string, prefix: string, prevTable: string, prevIdField: string, prevPrefix: string }> = {
    'transport': { 
      table: 'Transportation_Log', idField: 'Transit_ID', prefix: 'T',
      prevTable: 'Crude_Purchase', prevIdField: 'Purchase_ID', prevPrefix: 'C' 
    },
    'storage': { 
      table: 'Storage_Batch', idField: 'Batch_ID', prefix: 'S',
      prevTable: 'Transportation_Log', prevIdField: 'Transit_ID', prevPrefix: 'T' 
    },
    'refining': { 
      table: 'Refining_Process', idField: 'Refine_ID', prefix: 'R',
      prevTable: 'Storage_Batch', prevIdField: 'Batch_ID', prevPrefix: 'S' 
    },
    'distribution': { 
      table: 'Distribution', idField: 'Distribution_ID', prefix: 'D',
      prevTable: 'Refining_Process', prevIdField: 'Refine_ID', prevPrefix: 'R' 
    },
    'retail': { 
      table: 'Retail', idField: 'Retail_ID', prefix: 'RT',
      prevTable: 'Distribution', prevIdField: 'Distribution_ID', prevPrefix: 'D' 
    }
  };

  const config = stageConfig[stage.toLowerCase()];
  if (!config) return res.status(400).json({ error: 'Invalid stage' });

  try {
    // Get all numeric IDs from previous stage
    const prevRows: any = await query(`SELECT ${config.prevIdField} FROM ${config.prevTable}`);
    const prevNumericIds = prevRows.map((row: any) => row[config.prevIdField].replace(config.prevPrefix, ''));

    // Get all numeric IDs from current stage
    const currentRows: any = await query(`SELECT ${config.idField} FROM ${config.table}`);
    const currentNumericIds = new Set(currentRows.map((row: any) => row[config.idField].replace(config.prefix, '')));

    // Filter out IDs already used in current stage
    const availableNumericIds = prevNumericIds.filter((id: string) => !currentNumericIds.has(id));

    res.json(availableNumericIds);
  } catch (err: any) {
    console.error('Workflow IDs error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Stats
app.get('/api/stats', authenticateToken, async (req, res) => {
  const tables = ['Crude_Purchase', 'Transportation_Log', 'Storage_Batch', 'Refining_Process', 'Distribution', 'Retail', 'CO2_Emissions'];
  const stats: any = { counts: {}, growth: {}, inventory: [] };

  try {
    for (const table of tables) {
      // Get current count
      const countResults: any = await query(`SELECT COUNT(*) as count FROM ${table}`);
      stats.counts[table] = countResults[0] ? countResults[0].count : 0;

      let dateField = '';
      if (table === 'Crude_Purchase') dateField = 'Purchased_Date';
      if (table === 'Transportation_Log') dateField = 'Departure_Time';
      if (table === 'Storage_Batch') dateField = 'Last_Inspection_Date';
      if (table === 'Refining_Process') dateField = 'Refining_Date';
      if (table === 'CO2_Emissions') dateField = 'Measurement_Date';
      
      if (dateField) {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

        const recentResults: any = await query(`SELECT COUNT(*) as count FROM ${table} WHERE ${dateField} >= ?`, [sevenDaysAgo]);
        const previousResults: any = await query(`SELECT COUNT(*) as count FROM ${table} WHERE ${dateField} >= ? AND ${dateField} < ?`, [fourteenDaysAgo, sevenDaysAgo]);
        
        const recentCount = recentResults[0] ? recentResults[0].count : 0;
        const previousCount = previousResults[0] ? previousResults[0].count : 0;

        if (previousCount === 0) {
          stats.growth[table] = recentCount > 0 ? 100 : 0;
        } else {
          stats.growth[table] = Math.round(((recentCount - previousCount) / previousCount) * 100);
        }
      } else {
        stats.growth[table] = 0;
      }
    }

    // Calculate Inventory Status
    const crudeVol: any = await query('SELECT SUM(Volume) as total FROM Crude_Purchase');
    const refineVol: any = await query('SELECT SUM(Input_Volume) as total FROM Refining_Process');
    const distVol: any = await query('SELECT SUM(Dispatch_Volume) as total FROM Distribution');
    const retailVol: any = await query('SELECT SUM(Receive_Volume) as total FROM Retail');

    stats.inventory = [
      { label: 'Main Reservoir', value: Math.min(100, Math.round(((crudeVol[0]?.total || 0) / 100000) * 100)), color: 'bg-blue-500' },
      { label: 'Refinery Input', value: Math.min(100, Math.round(((refineVol[0]?.total || 0) / 100000) * 100)), color: 'bg-teal-500' },
      { label: 'Distribution Hub', value: Math.min(100, Math.round(((distVol[0]?.total || 0) / 100000) * 100)), color: 'bg-emerald-500' },
      { label: 'Retail Reserve', value: Math.min(100, Math.round(((retailVol[0]?.total || 0) / 100000) * 100)), color: 'bg-amber-500' },
    ];

    res.json(stats);
  } catch (err: any) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Vite Middleware ---

async function startServer() {
  // Initialize MySQL Database
  await initializeDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
