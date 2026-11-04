import fs from "node:fs";
import path from "node:path";
import SQLite from "better-sqlite3";
import pg from "pg";
import { DEFAULT_FORM_SETTINGS, DEFAULT_WIDGET_SETTINGS } from "./defaults.js";

const { Pool } = pg;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    form_settings TEXT NOT NULL,
    widget_settings TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'free',
    accepting INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_role TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    answers TEXT NOT NULL DEFAULT '[]',
    is_approved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS testimonials_profile_created
    ON testimonials(profile_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS testimonials_profile_approved
    ON testimonials(profile_id, is_approved)`,
  `CREATE TABLE IF NOT EXISTS billing_subscriptions (
    razorpay_subscription_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('monthly', 'annual')),
    status TEXT NOT NULL,
    current_start INTEGER,
    current_end INTEGER,
    start_at INTEGER,
    pro_until INTEGER,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS billing_subscriptions_user_updated
    ON billing_subscriptions(user_id, updated_at DESC)`,
];

function sqliteDatabase(databasePath) {
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
  }

  const connection = new SQLite(databasePath);
  connection.pragma("foreign_keys = ON");
  connection.pragma("journal_mode = WAL");
  connection.exec(SCHEMA.join(";"));
  return {
    async get(sql, params = []) {
      return connection.prepare(sql).get(...params);
    },
    async all(sql, params = []) {
      return connection.prepare(sql).all(...params);
    },
    async run(sql, params = []) {
      const result = connection.prepare(sql).run(...params);
      return { rowCount: result.changes, changes: result.changes };
    },
    async close() {
      connection.close();
    },
  };
}

function postgresDatabase(databaseUrl) {
  const pool = new Pool({ connectionString: databaseUrl });
  const placeholders = (sql) => {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  };

  return {
    async initialize() {
      for (const statement of SCHEMA) await pool.query(statement);
    },
    async get(sql, params = []) {
      const result = await pool.query(placeholders(sql), params);
      return result.rows[0];
    },
    async all(sql, params = []) {
      const result = await pool.query(placeholders(sql), params);
      return result.rows;
    },
    async run(sql, params = []) {
      const result = await pool.query(placeholders(sql), params);
      return { rowCount: result.rowCount, changes: result.rowCount };
    },
    async close() {
      await pool.end();
    },
  };
}

export async function createDatabase(databaseConfig) {
  if (typeof databaseConfig === "string") return sqliteDatabase(databaseConfig);

  if (databaseConfig.databaseUrl) {
    const database = postgresDatabase(databaseConfig.databaseUrl);
    try {
      await database.initialize();
      return database;
    } catch (error) {
      await database.close();
      throw error;
    }
  }
  return sqliteDatabase(databaseConfig.databasePath);
}

export function isUniqueConstraintError(error) {
  return error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.code === "23505";
}

export async function createUser(db, { id, email, passwordHash, createdAt }) {
  await db.run(`
    INSERT INTO users (id, email, password_hash, form_settings, widget_settings, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    id,
    email,
    passwordHash,
    JSON.stringify(DEFAULT_FORM_SETTINGS),
    JSON.stringify(DEFAULT_WIDGET_SETTINGS),
    createdAt,
  ]);
}
