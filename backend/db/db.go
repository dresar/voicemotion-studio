package db

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"log"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"

	"voicemotion/config"
	"voicemotion/models"
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

func SeedSettings(connection *sql.DB, cfg config.Config) error {
	var count int
	err := connection.QueryRow("SELECT COUNT(*) FROM system_settings WHERE key = 'main_settings'").Scan(&count)
	if err == nil && count > 0 {
		return nil
	}

	payload := models.SystemSettingsPayload{
		AIRouter: models.AIRouterSettings{
			ActiveProvider: "bynara",
			FallbackAuto:   true,
			Temperature:    0.7,
			TopP:           0.9,
			MaxTokens:      4096,
			SystemPrompt:   "Kamu adalah asisten sutradara dan animator kreatif Voicemotion Studio. Berikan ide narasi dan kode adegan yang padat, menarik, dan sesuai kaidah visual modern.",
			ByNara: models.ByNaraConfig{
				Enabled:      true,
				BaseURL:      "https://router.bynara.id/v1",
				APIKey:       cfg.ByNaraAPIKey,
				SecondaryKey: cfg.ByNaraSecondaryKey,
				DefaultModel: "deepseek-v4-pro",
				Models: []string{
					"deepseek-v4-pro",
					"deepseek-v4-flash",
					"claude-haiku-5.5",
					"claude-opus-5.5",
					"gpt-6-astra",
					"gpt-5.6-luna",
					"kimi-k2.7-code",
					"qwen3.8-max-alibaba",
					"mimo-v2.5-pro",
				},
			},
			Sumopod: models.SumopodConfig{
				Enabled:      true,
				BaseURL:      "https://ai.sumopod.com/v1",
				APIKey:       cfg.SumopodAPIKey,
				DefaultModel: "deepseek-v4.1-flash:netra",
			},
			Gemini: models.GeminiConfig{
				Enabled:      true,
				APIKeys:      cfg.GeminiAPIKeys,
				DefaultModel: "gemini-2.0-flash",
			},
			Custom: models.CustomAIConfig{
				Enabled:      false,
				BaseURL:      "http://localhost:11434/v1",
				APIKey:       "",
				DefaultModel: "llama3",
			},
			TaskRouting: models.TaskRoutingConfig{
				TopicsModel:    "deepseek-v4.1-flash:netra",
				ScriptModel:    "deepseek-v4-pro",
				AnimationModel: "kimi-k2.7-code",
				VoiceModel:     "claude-haiku-5.5",
			},
		},
		Platform: models.PlatformSettings{
			TTSEngine:          "edge-tts",
			DefaultVoice:       "id-ID-GadisNeural",
			TTSTimeoutSeconds:  cfg.TTSTimeoutSeconds,
			TrialDays:          cfg.TrialDays,
			TrialCredits:       2,
			TrialQuota:         1,
			StarterCredits:     60,
			ProCredits:         200,
			AutoCleanupOrphan:  false,
			JWTExpiryHours:     cfg.JWTExpiryHours,
			MaintenanceMode:    false,
			GoogleClientID:     cfg.GoogleClientID,
			GoogleClientSecret: cfg.GoogleClientSecret,
		},
	}

	encoded, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	_, err = connection.Exec(
		`INSERT INTO system_settings (key, value, updated_at)
		 VALUES ('main_settings', ?, ?)
		 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
		string(encoded), now,
	)
	if err == nil {
		log.Printf("Pengaturan AI dan Router API Key berhasil disimpan ke database Neon.")
	}
	return err
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
