import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "pawvote.sqlite");

function hasColumn(database: Database.Database, table: string, col: string): boolean {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.some((r) => r.name === col);
}

function init(): Database.Database {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  database.exec(`
    CREATE TABLE IF NOT EXISTS pets (
      id          INTEGER PRIMARY KEY,
      name        TEXT NOT NULL,
      species     TEXT NOT NULL,
      breed       TEXT NOT NULL,
      age         TEXT NOT NULL,
      tagline     TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url   TEXT NOT NULL,
      accent      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS votes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id     INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL,
      choice     TEXT NOT NULL CHECK (choice IN ('yes','no','skip')),
      created_at INTEGER NOT NULL,
      UNIQUE (pet_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_votes_pet    ON votes(pet_id);
    CREATE INDEX IF NOT EXISTS idx_votes_user   ON votes(user_id);
    CREATE INDEX IF NOT EXISTS idx_votes_choice ON votes(choice);

    CREATE TABLE IF NOT EXISTS users (
      user_id      TEXT PRIMARY KEY,
      display_name TEXT,
      first_seen   INTEGER NOT NULL,
      last_seen    INTEGER NOT NULL
    );
  `);

  if (!hasColumn(database, "votes", "decision_ms")) {
    database.exec(`ALTER TABLE votes ADD COLUMN decision_ms INTEGER`);
  }

  return database;
}

declare global {
  // eslint-disable-next-line no-var
  var __pawvote_db: Database.Database | undefined;
}

export const db: Database.Database = global.__pawvote_db ?? init();
if (process.env.NODE_ENV !== "production") global.__pawvote_db = db;
