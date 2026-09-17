import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'lifelens.db');
let rawDb: SqlJsDatabase | null = null;

function saveDatabase() {
  if (rawDb) {
    const data = rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

export async function initDatabase() {
  if (rawDb) return;

  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    rawDb = new SQL.Database(fileBuffer);
  } else {
    rawDb = new SQL.Database();
  }

  try { rawDb.exec('PRAGMA foreign_keys = ON;'); } catch (_) {}

  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      age_range TEXT,
      occupation TEXT,
      goals TEXT,
      interests TEXT,
      budget_range TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      deadline TEXT,
      profile TEXT,
      personal_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS options (
      id TEXT PRIMARY KEY,
      decision_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      course_of_interest TEXT,
      short_term_goal TEXT,
      long_term_goal TEXT,
      dream_company TEXT,
      resume_filename TEXT,
      cost REAL DEFAULT 0,
      estimated_months REAL DEFAULT 0,
      difficulty_score REAL DEFAULT 5,
      long_term_growth REAL DEFAULT 5,
      FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS factors (
      id TEXT PRIMARY KEY,
      decision_id TEXT NOT NULL,
      name TEXT NOT NULL,
      weight REAL NOT NULL DEFAULT 1.0,
      category TEXT DEFAULT 'general',
      FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS option_factor_scores (
      id TEXT PRIMARY KEY,
      option_id TEXT NOT NULL,
      factor_id TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 50,
      FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE,
      FOREIGN KEY (factor_id) REFERENCES factors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS constraints (
      id TEXT PRIMARY KEY,
      decision_id TEXT NOT NULL,
      name TEXT NOT NULL,
      constraint_type TEXT NOT NULL,
      limit_value REAL NOT NULL,
      is_hard INTEGER DEFAULT 1,
      FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reality_checks (
      id TEXT PRIMARY KEY,
      decision_id TEXT NOT NULL,
      selected_option_id TEXT NOT NULL,
      actual_cost REAL,
      actual_time_months REAL,
      actual_score REAL,
      problems_notes TEXT,
      satisfaction_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
      FOREIGN KEY (selected_option_id) REFERENCES options(id) ON DELETE CASCADE
    );
  `);

  // Purge all pre-existing decision data as requested by user
  try {
    rawDb.exec(`
      DELETE FROM option_factor_scores;
      DELETE FROM options;
      DELETE FROM factors;
      DELETE FROM constraints;
      DELETE FROM reality_checks;
      DELETE FROM decisions;
    `);
    console.log('🧹 All pre-existing decisions successfully cleared from database.');
  } catch (_) {}

  saveDatabase();
  console.log('✅ SQLite (sql.js WASM) Database initialized at:', dbPath);
}

let isTransactionActive = false;

export const db = {
  exec(sql: string) {
    if (!rawDb) throw new Error('Database not initialized');
    rawDb.exec(sql);
    if (!isTransactionActive) {
      saveDatabase();
    }
  },

  prepare(sql: string) {
    return {
      get(...params: any[]) {
        if (!rawDb) throw new Error('Database not initialized');
        const stmt = rawDb.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        let result: any = undefined;
        if (stmt.step()) {
          result = stmt.getAsObject();
        }
        stmt.free();
        return result;
      },

      all(...params: any[]) {
        if (!rawDb) throw new Error('Database not initialized');
        const stmt = rawDb.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        const results: any[] = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },

      run(...params: any[]) {
        if (!rawDb) throw new Error('Database not initialized');
        const stmt = rawDb.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        stmt.step();
        stmt.free();
        if (!isTransactionActive) {
          saveDatabase();
        }

        const res = rawDb.exec("SELECT changes() as changes, last_insert_rowid() as rowid");
        let changes = 1;
        let lastInsertRowid = 0;
        if (res.length > 0 && res[0].values.length > 0) {
          changes = Number(res[0].values[0][0]);
          lastInsertRowid = Number(res[0].values[0][1]);
        }
        return { changes, lastInsertRowid };
      }
    };
  },

  transaction<T>(fn: (...args: any[]) => T) {
    return (...args: any[]): T => {
      if (!rawDb) throw new Error('Database not initialized');

      if (isTransactionActive) {
        return fn(...args);
      }

      let startedTransactionInSqlite = false;

      try {
        rawDb.exec('BEGIN TRANSACTION');
        isTransactionActive = true;
        startedTransactionInSqlite = true;
      } catch (beginErr) {
        isTransactionActive = false;
        startedTransactionInSqlite = false;
      }

      try {
        const result = fn(...args);
        if (startedTransactionInSqlite && rawDb) {
          try {
            rawDb.exec('COMMIT');
            saveDatabase();
          } catch (commitErr) {
            try { rawDb.exec('ROLLBACK'); } catch (_) {}
            throw commitErr;
          } finally {
            isTransactionActive = false;
          }
        } else {
          isTransactionActive = false;
        }
        return result;
      } catch (originalErr) {
        if (startedTransactionInSqlite && rawDb) {
          try {
            rawDb.exec('ROLLBACK');
          } catch (rollbackErr) {
            // Safely ignore secondary rollback error so originalErr is preserved
          }
        }
        isTransactionActive = false;
        throw originalErr;
      }
    };
  }
};
