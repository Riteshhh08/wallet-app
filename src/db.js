const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../wallet.db.json");

let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const savedData = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    db = new SQL.Database(new Uint8Array(savedData));
  } else {
    db = new SQL.Database();
  }
  initTables();
  return db;
}

function initTables() {
  db.run(`CREATE TABLE IF NOT EXISTS wallets (
    client_id TEXT PRIMARY KEY,
    balance   REAL NOT NULL DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS ledger (
    id         TEXT PRIMARY KEY,
    client_id  TEXT NOT NULL,
    type       TEXT NOT NULL CHECK(type IN ('credit','debit')),
    amount     REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id             TEXT PRIMARY KEY,
    client_id      TEXT NOT NULL,
    amount         REAL NOT NULL,
    status         TEXT NOT NULL DEFAULT 'created',
    fulfillment_id TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  persist();
}

function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, JSON.stringify(Array.from(data)));
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Use exec() inside transactions — does NOT persist on its own
function exec(sql, params = []) {
  db.run(sql, params);
}

// Single write + persist (use outside transactions)
function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

// Atomic block: BEGIN → fn() → COMMIT → persist; on error → ROLLBACK
function transaction(fn) {
  db.run("BEGIN IMMEDIATE");
  try {
    fn();
    db.run("COMMIT");
    persist();
  } catch (err) {
    try { db.run("ROLLBACK"); } catch (_) {}
    throw err;
  }
}

module.exports = { getDb, query, run, exec, transaction };
