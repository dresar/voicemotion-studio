package config

import (
	"bufio"
	"crypto/rand"
	"encoding/hex"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type Config struct {
	Port               string
	JWTSecret          string
	JWTExpiryHours     int
	TrialDays          int
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	DatabaseURL        string
	EdgeTTSCmd         string
	TTSTimeoutSeconds  int
	GoogleTTSAPIKey    string
	StaticDir          string
	UploadDir          string
	StylesPath         string
	AdminEmail         string
	AdminPassword      string
	AppEnv             string
	AppURL             string
	CORSOrigins        []string
	GeminiAPIKeys      []string
	ByNaraAPIKey       string
	ByNaraSecondaryKey string
	SumopodAPIKey      string
}

func Load() Config {
	// Try loading .env from current dir, backend/, or parent dir
	for _, envPath := range []string{".env", "./backend/.env", "../.env"} {
		if fileExists(envPath) {
			loadDotEnv(envPath)
			break
		}
	}

	secret := getenv("JWT_SECRET", "")
	if secret == "" || strings.HasPrefix(secret, "change-this") {
		generated := make([]byte, 32)
		if _, err := rand.Read(generated); err == nil {
			secret = hex.EncodeToString(generated)
		}
	}

	databaseURL := resolveDatabaseURL()
	staticDir := resolvePath("STATIC_DIR", "./static", "../static", "./backend/static")
	uploadDir := resolvePath("UPLOAD_DIR", "./uploads", "../uploads", "./backend/uploads")
	stylesPath := resolvePath("STYLES_PATH", "./data/styles.json", "./backend/data/styles.json", "../data/styles.json")

	return Config{
		Port:               getenv("PORT", "3000"),
		JWTSecret:          secret,
		JWTExpiryHours:     envInt("JWT_EXPIRY_HOURS", 168),
		TrialDays:          envInt("TRIAL_DAYS", 4),
		GoogleClientID:     getenv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getenv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getenv("GOOGLE_REDIRECT_URL", "http://localhost:3000/api/auth/google/callback"),
		DatabaseURL:        databaseURL,
		EdgeTTSCmd:         getenv("EDGE_TTS_CMD", "edge-tts"),
		TTSTimeoutSeconds:  envInt("TTS_TIMEOUT_SECONDS", 30),
		GoogleTTSAPIKey:    getenv("GOOGLE_TTS_API_KEY", ""),
		StaticDir:          staticDir,
		UploadDir:          uploadDir,
		StylesPath:         stylesPath,
		AdminEmail:         getenv("ADMIN_EMAIL", "admin@example.com"),
		AdminPassword:      getenv("ADMIN_PASSWORD", ""),
		AppEnv:             getenv("APP_ENV", "development"),
		AppURL:             strings.TrimRight(getenv("APP_URL", ""), "/"),
		CORSOrigins:        splitCSV(getenv("CORS_ORIGINS", "http://localhost:3001,http://localhost:3000")),
		GeminiAPIKeys:      splitCSV(getenv("GEMINI_API_KEYS", "")),
		ByNaraAPIKey:       getenv("BYNARA_API_KEY", ""),
		ByNaraSecondaryKey: getenv("BYNARA_SECONDARY_KEY", ""),
		SumopodAPIKey:      getenv("SUMOPOD_API_KEY", ""),
	}
}

func (c Config) IsProduction() bool {
	return strings.EqualFold(c.AppEnv, "production")
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func pathExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func resolvePath(envKey string, candidates ...string) string {
	if val := os.Getenv(envKey); strings.TrimSpace(val) != "" {
		val = strings.TrimSpace(val)
		if pathExists(val) {
			return filepath.Clean(val)
		}
		if pathExists(filepath.Join("backend", val)) {
			return filepath.Clean(filepath.Join("backend", val))
		}
		if pathExists(filepath.Join("..", val)) {
			return filepath.Clean(filepath.Join("..", val))
		}
	}
	for _, c := range candidates {
		if pathExists(c) {
			return filepath.Clean(c)
		}
	}
	if len(candidates) > 0 {
		return candidates[0]
	}
	return ""
}

func resolveDatabaseURL() string {
	if val := os.Getenv("DATABASE_URL"); strings.TrimSpace(val) != "" {
		val = strings.TrimSpace(val)
		if strings.HasPrefix(val, "postgres://") || strings.HasPrefix(val, "postgresql://") {
			return val
		}
		cleanVal := strings.TrimPrefix(val, "file:")
		if fileExists(cleanVal) {
			return val
		}
		if fileExists(filepath.Join("backend", cleanVal)) {
			if strings.HasPrefix(val, "file:") {
				return "file:" + filepath.Clean(filepath.Join("backend", cleanVal))
			}
			return filepath.Clean(filepath.Join("backend", cleanVal))
		}
		if fileExists(filepath.Join("..", cleanVal)) {
			if strings.HasPrefix(val, "file:") {
				return "file:" + filepath.Clean(filepath.Join("..", cleanVal))
			}
			return filepath.Clean(filepath.Join("..", cleanVal))
		}
		return val
	}
	for _, candidate := range []string{
		"./voicemotion.db",
		"./backend/voicemotion.db",
		"../backend/voicemotion.db",
		"../voicemotion.db",
	} {
		if fileExists(candidate) {
			return filepath.Clean(candidate)
		}
	}
	return "./voicemotion.db"
}

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, found := strings.Cut(line, "=")
		if !found {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		value = strings.Trim(value, `"'`)
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); exists {
			continue
		}
		os.Setenv(key, value)
	}
}

func getenv(key, fallback string) string {
	value, exists := os.LookupEnv(key)
	if !exists || strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func envInt(key string, fallback int) int {
	value, exists := os.LookupEnv(key)
	if !exists {
		return fallback
	}
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		return fallback
	}
	return parsed
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
