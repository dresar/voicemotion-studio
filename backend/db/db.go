package db

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"log"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"

	"voicemotion/config"
)

const schema = `
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

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`

func Open(cfg config.Config) (*sql.DB, error) {
	dsn := strings.TrimSpace(cfg.DatabaseURL)
	if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
		connection, err := sql.Open("neonsql", dsn)
		if err != nil {
			return nil, err
		}
		connection.SetMaxOpenConns(10)
		connection.SetMaxIdleConns(5)
		connection.SetConnMaxLifetime(15 * time.Minute)
		if err := connection.Ping(); err != nil {
			connection.Close()
			return nil, err
		}
		log.Printf("Berhasil terhubung ke Neon Serverless PostgreSQL Database.")
		return connection, nil
	}

	if !strings.HasPrefix(dsn, "file:") {
		dsn = "file:" + dsn
	}
	separator := "?"
	if strings.Contains(dsn, "?") {
		separator = "&"
	}
	dsn += separator + "_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)"
	connection, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	connection.SetMaxOpenConns(1)
	if err := connection.Ping(); err != nil {
		connection.Close()
		return nil, err
	}
	log.Printf("Terhubung ke SQLite Database.")
	return connection, nil
}

func Migrate(connection *sql.DB) error {
	statements := strings.Split(schema, ";")
	for _, statement := range statements {
		trimmed := strings.TrimSpace(statement)
		if trimmed == "" {
			continue
		}
		if _, err := connection.Exec(trimmed); err != nil {
			return err
		}
	}
	return nil
}

func SeedAdmin(connection *sql.DB, cfg config.Config) error {
	if strings.TrimSpace(cfg.AdminEmail) == "" || strings.TrimSpace(cfg.AdminPassword) == "" {
		return nil
	}
	if strings.HasPrefix(cfg.AdminPassword, "change-this") {
		log.Printf("ADMIN_PASSWORD masih placeholder; seed admin dilewati")
		return nil
	}
	email := strings.ToLower(strings.TrimSpace(cfg.AdminEmail))
	var existingID string
	err := connection.QueryRow("SELECT id FROM users WHERE email = ?", email).Scan(&existingID)
	if err == nil {
		return nil
	}
	if err != sql.ErrNoRows {
		return err
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	code := randomCode(4)
	_, err = connection.Exec(
		`INSERT INTO users (id, email, name, avatar, provider, plan, trial_ends_at, credits, project_quota, role, referral_code, created_at, password_hash, disabled)
		 VALUES (?, ?, ?, '', 'email', 'pro', NULL, 100, 999, 'admin', ?, ?, ?, 0)`,
		randomID(), email, "Admin", code, now, string(passwordHash),
	)
	if err != nil {
		return err
	}
	log.Printf("Akun admin dibuat untuk %s", email)
	return nil
}

func randomID() string {
	buffer := make([]byte, 16)
	if _, err := rand.Read(buffer); err != nil {
		return time.Now().UTC().Format("20060102150405.000000000")
	}
	buffer[6] = (buffer[6] & 0x0f) | 0x40
	buffer[8] = (buffer[8] & 0x3f) | 0x80
	return hex.EncodeToString(buffer[:4]) + "-" + hex.EncodeToString(buffer[4:6]) + "-" + hex.EncodeToString(buffer[6:8]) + "-" + hex.EncodeToString(buffer[8:10]) + "-" + hex.EncodeToString(buffer[10:16])
}

func randomCode(length int) string {
	buffer := make([]byte, length)
	if _, err := rand.Read(buffer); err != nil {
		return "voicemotion"
	}
	return hex.EncodeToString(buffer)
}
