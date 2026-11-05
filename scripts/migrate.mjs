import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

// Read .env.local manually
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
} catch (e) {
  console.warn("Could not read .env.local", e);
}

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

async function run() {
  console.log("Connecting to Neon Postgres...");
  const version = await sql`SELECT version();`;
  console.log("Postgres version:", version[0].version);

  console.log("Applying schema...");
  const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  provider TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TEXT,
  credits INTEGER NOT NULL DEFAULT 2,
  project_quota INTEGER NOT NULL DEFAULT 1,
  role TEXT NOT NULL DEFAULT 'user',
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TEXT NOT NULL,
  password_hash TEXT,
  disabled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Proyek Baru',
  stage TEXT NOT NULL DEFAULT 'idea',
  config TEXT,
  selected_idea_id TEXT,
  selected_idea TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  narration TEXT,
  visual TEXT,
  theme TEXT DEFAULT 'paper',
  duration_sec REAL DEFAULT 7.5,
  audio_path TEXT,
  audio_ms INTEGER,
  word_timings TEXT,
  code TEXT,
  code_status TEXT DEFAULT 'empty',
  code_error TEXT,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scenes_project_idx ON scenes(project_id, idx);

CREATE TABLE IF NOT EXISTS idea_sets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ideas TEXT NOT NULL,
  raw_answer TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  delta INTEGER NOT NULL,
  reason TEXT,
  ref TEXT UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  format TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL
);
  `;

  const statements = schemaSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.query(statement);
  }

  console.log("Schema applied successfully!");

  const existing = await sql`SELECT id FROM users WHERE email = 'admin@example.com'`;
  if (existing.length === 0) {
    const now = new Date().toISOString();
    await sql`
      INSERT INTO users (id, email, name, avatar, provider, plan, credits, project_quota, role, referral_code, created_at, disabled)
      VALUES ('admin-01', 'admin@example.com', 'Admin VoiceMotion', '', 'email', 'pro', 100, 999, 'admin', 'VMADMIN', ${now}, 0)
    `;
    console.log("Admin user seeded in Neon Postgres!");
  } else {
    console.log("Admin user already exists in Neon Postgres.");
  }

  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  console.log("Tables in database:", tables.map((t) => t.table_name));
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
