import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "proofpulse.db");
export const db = new Database(dbPath);

// Enable Write-Ahead Logging for non-blocking concurrent reads during execution
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    supplier TEXT NOT NULL,
    product TEXT NOT NULL,
    amount REAL NOT NULL,
    country TEXT,
    route TEXT,
    material TEXT,
    deadline TEXT,
    status TEXT NOT NULL,
    current_step TEXT,
    search_total INTEGER DEFAULT 6,
    search_completed INTEGER DEFAULT 0,
    entity_data TEXT,
    raw_results_count INTEGER DEFAULT 0,
    evidence_data TEXT,
    risk_score REAL,
    risk_level TEXT,
    signal_breakdown TEXT,
    confidence_score REAL,
    decision TEXT,
    decision_reasoning TEXT,
    decision_brief TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS human_reviews (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reviewer_notes TEXT,
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(analysis_id) REFERENCES analyses(id)
  );

  CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
`);
