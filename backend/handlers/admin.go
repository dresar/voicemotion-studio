package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"

	"voicemotion/middleware"
	"voicemotion/models"
)

var hexAudioRegex = regexp.MustCompile(`^[a-f0-9]{64}\.mp3$`)

type createUserRequest struct {
	Email        string `json:"email"`
	Name         string `json:"name"`
	Password     string `json:"password"`
	Plan         string `json:"plan"`
	Credits      int    `json:"credits"`
	ProjectQuota int    `json:"projectQuota"`
	Role         string `json:"role"`
}

type addCreditsRequest struct {
	Amount int    `json:"amount"`
	Reason string `json:"reason"`
}

func (h *Handler) AdminListUsers(c echo.Context) error {
	rows, err := h.DB.Query("SELECT " + userColumns + ", (SELECT COUNT(*) FROM projects p WHERE p.user_id = users.id) FROM users ORDER BY created_at DESC")
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat pengguna.")
	}
	defer rows.Close()
	users := make([]models.AdminUser, 0)
	for rows.Next() {
		user, scanErr := scanAdminUser(rows)
		if scanErr != nil {
			return writeError(c, http.StatusInternalServerError, "Gagal membaca pengguna.")
		}
		users = append(users, user)
	}
	return c.JSON(http.StatusOK, users)
}

func (h *Handler) AdminCreateUser(c echo.Context) error {
	var payload createUserRequest
	if err := bindJSON(c, &payload); err != nil {
		return err
	}
	email := strings.ToLower(strings.TrimSpace(payload.Email))
	if len(email) < 5 || !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		return writeError(c, http.StatusBadRequest, "Email tidak valid.")
	}
	if len([]rune(payload.Password)) < 8 {
		return writeError(c, http.StatusBadRequest, "Password minimal 8 karakter.")
	}
	plan := payload.Plan
	if plan == "" {
		plan = "trial"
	}
	if !isValidPlan(plan) {
		return writeError(c, http.StatusBadRequest, "Plan tidak valid.")
	}
	role := payload.Role
	if role == "" {
		role = "user"
	}
	if !isValidRole(role) {
		return writeError(c, http.StatusBadRequest, "Peran tidak valid.")
	}
	defaultCredits, defaultQuota := planDefaults(plan)
	credits := payload.Credits
	if credits < 0 {
		credits = defaultCredits
	}
	quota := payload.ProjectQuota
	if quota <= 0 {
		quota = defaultQuota
	}
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		name = strings.Split(email, "@")[0]
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal mengamankan password.")
	}
	userID := uuid.NewString()
	now := time.Now().UTC()
	var trialEndsAt any
	if plan == "trial" {
		trialEndsAt = now.AddDate(0, 0, h.Config.TrialDays).Format(time.RFC3339)
	}
	_, err = h.DB.Exec(
		`INSERT INTO users (id, email, name, avatar, provider, plan, trial_ends_at, credits, project_quota, role, referral_code, created_at, password_hash, disabled)
		 VALUES (?, ?, ?, '', 'email', ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
		userID,
		email,
		name,
		plan,
		trialEndsAt,
		credits,
		quota,
		role,
		randomState(4),
		now.Format(time.RFC3339),
		string(passwordHash),
	)
	if err != nil {
		if isUniqueViolation(err) {
			return writeError(c, http.StatusConflict, "Email sudah terdaftar.")
		}
		return writeError(c, http.StatusInternalServerError, "Gagal membuat akun.")
	}
	user, err := h.adminUserByID(userID)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Akun dibuat tetapi gagal dimuat.")
	}
	return c.JSON(http.StatusCreated, user)
}

func (h *Handler) AdminUpdateUser(c echo.Context) error {
	targetID := c.Param("id")
	target, err := h.adminUserByID(targetID)
	if err == sql.ErrNoRows {
		return writeError(c, http.StatusNotFound, "Pengguna tidak ditemukan.")
	}
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat pengguna.")
	}
	var payload map[string]json.RawMessage
	if err := c.Bind(&payload); err != nil {
		return writeError(c, http.StatusBadRequest, "Format permintaan tidak valid.")
	}
	sets := make([]string, 0)
	args := make([]any, 0)
	nextRole := target.Role
	nextDisabled := target.Disabled
	if raw, exists := payload["name"]; exists {
		var name string
		if json.Unmarshal(raw, &name) == nil {
			name = strings.TrimSpace(name)
			if len([]rune(name)) > 120 {
				name = string([]rune(name)[:120])
			}
			sets = append(sets, "name = ?")
			args = append(args, name)
		}
	}
	if raw, exists := payload["plan"]; exists {
		var plan string
		if json.Unmarshal(raw, &plan) == nil && isValidPlan(plan) {
			sets = append(sets, "plan = ?")
			args = append(args, plan)
			if plan == "trial" {
				sets = append(sets, "trial_ends_at = ?")
				args = append(args, time.Now().UTC().AddDate(0, 0, h.Config.TrialDays).Format(time.RFC3339))
			} else {
				sets = append(sets, "trial_ends_at = NULL")
			}
		}
	}
	if raw, exists := payload["credits"]; exists {
		var credits int
		if json.Unmarshal(raw, &credits) == nil && credits >= 0 {
			sets = append(sets, "credits = ?")
			args = append(args, credits)
		}
	}
	if raw, exists := payload["projectQuota"]; exists {
		var quota int
		if json.Unmarshal(raw, &quota) == nil && quota >= 1 {
			sets = append(sets, "project_quota = ?")
			args = append(args, quota)
		}
	}
	if raw, exists := payload["role"]; exists {
		var role string
		if json.Unmarshal(raw, &role) == nil && isValidRole(role) {
			nextRole = role
			sets = append(sets, "role = ?")
			args = append(args, role)
		}
	}
	if raw, exists := payload["disabled"]; exists {
		var disabled bool
		if json.Unmarshal(raw, &disabled) == nil {
			nextDisabled = disabled
			value := 0
			if disabled {
				value = 1
			}
			sets = append(sets, "disabled = ?")
			args = append(args, value)
		}
	}
	if targetID == middleware.UserID(c) && (nextRole != "admin" || nextDisabled) {
		return writeError(c, http.StatusBadRequest, "Admin tidak bisa menurunkan atau menonaktifkan akunnya sendiri.")
	}
	if len(sets) == 0 {
		return c.JSON(http.StatusOK, target)
	}
	args = append(args, targetID)
	query := "UPDATE users SET " + strings.Join(sets, ", ") + " WHERE id = ?"
	if _, err := h.DB.Exec(query, args...); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memperbarui pengguna.")
	}
	user, err := h.adminUserByID(targetID)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Pengguna diperbarui tetapi gagal dimuat.")
	}
	return c.JSON(http.StatusOK, user)
}

func (h *Handler) AdminAddCredits(c echo.Context) error {
	targetID := c.Param("id")
	var payload addCreditsRequest
	if err := bindJSON(c, &payload); err != nil {
		return err
	}
	if payload.Amount < 1 || payload.Amount > 100000 {
		return writeError(c, http.StatusBadRequest, "Jumlah kredit tidak valid.")
	}
	if _, err := h.adminUserByID(targetID); err == sql.ErrNoRows {
		return writeError(c, http.StatusNotFound, "Pengguna tidak ditemukan.")
	}
	reason := strings.TrimSpace(payload.Reason)
	if reason == "" {
		reason = "tambahan admin"
	}
	transaction, err := h.DB.Begin()
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menambah kredit.")
	}
	defer transaction.Rollback()
	if _, err := transaction.Exec("UPDATE users SET credits = credits + ? WHERE id = ?", payload.Amount, targetID); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menambah kredit.")
	}
	if _, err := transaction.Exec(
		"INSERT INTO credit_ledger (id, user_id, delta, reason, ref, created_at) VALUES (?, ?, ?, ?, ?, ?)",
		uuid.NewString(),
		targetID,
		payload.Amount,
		reason,
		"admin-"+uuid.NewString(),
		nowRFC3339(),
	); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal mencatat kredit.")
	}
	if err := transaction.Commit(); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menyelesaikan kredit.")
	}
	user, err := h.adminUserByID(targetID)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Kredit ditambahkan tetapi gagal dimuat.")
	}
	return c.JSON(http.StatusOK, user)
}

func (h *Handler) adminUserByID(userID string) (models.AdminUser, error) {
	return scanAdminUser(h.DB.QueryRow(
		"SELECT "+userColumns+", (SELECT COUNT(*) FROM projects p WHERE p.user_id = users.id) FROM users WHERE id = ?",
		userID,
	))
}

func scanAdminUser(scanner rowScanner) (models.AdminUser, error) {
	var admin models.AdminUser
	var trialEndsAt sql.NullString
	var name sql.NullString
	var avatar sql.NullString
	var referralCode sql.NullString
	var passwordHash sql.NullString
	var disabled int
	err := scanner.Scan(
		&admin.ID,
		&admin.Email,
		&name,
		&avatar,
		&admin.Provider,
		&admin.Plan,
		&trialEndsAt,
		&admin.Credits,
		&admin.ProjectQuota,
		&admin.Role,
		&referralCode,
		&admin.CreatedAt,
		&passwordHash,
		&disabled,
		&admin.ProjectCount,
	)
	if err != nil {
		return admin, err
	}
	admin.Name = name.String
	admin.Avatar = avatar.String
	admin.ReferralCode = referralCode.String
	admin.PasswordHash = passwordHash.String
	admin.Disabled = disabled != 0
	if trialEndsAt.Valid {
		value := trialEndsAt.String
		admin.TrialEndsAt = &value
	}
	return admin, nil
}

func (h *Handler) AdminGetOverview(c echo.Context) error {
	var stats models.AdminOverviewStats
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&stats.UsersCount)
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM projects").Scan(&stats.ProjectsCount)
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM scenes").Scan(&stats.ScenesCount)
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM exports").Scan(&stats.ExportsCount)

	ttsDir := filepath.Clean(filepath.Join(h.Config.UploadDir, "tts"))
	_ = os.MkdirAll(ttsDir, 0o755)
	entries, err := os.ReadDir(ttsDir)
	if err == nil {
		for _, entry := range entries {
			if entry.IsDir() || !strings.HasSuffix(strings.ToLower(entry.Name()), ".mp3") {
				continue
			}
			if info, err := entry.Info(); err == nil {
				stats.AudioFilesCount++
				stats.StorageBytes += info.Size()
			}
		}
	}

	return c.JSON(http.StatusOK, stats)
}

func (h *Handler) AdminListAssets(c echo.Context) error {
	ttsDir := filepath.Clean(filepath.Join(h.Config.UploadDir, "tts"))
	_ = os.MkdirAll(ttsDir, 0o755)

	referenced := make(map[string]bool)
	rows, err := h.DB.Query("SELECT DISTINCT audio_path FROM scenes WHERE audio_path IS NOT NULL AND audio_path != ''")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var p string
			if err := rows.Scan(&p); err == nil {
				referenced[p] = true
				referenced[filepath.Base(p)] = true
				referenced[strings.TrimPrefix(p, "/api/tts/audio/")] = true
			}
		}
	}

	entries, err := os.ReadDir(ttsDir)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal membaca direktori aset audio.")
	}

	assets := make([]models.AdminAssetItem, 0)
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(strings.ToLower(entry.Name()), ".mp3") {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		name := entry.Name()
		assets = append(assets, models.AdminAssetItem{
			Filename:     name,
			SizeBytes:    info.Size(),
			UpdatedAt:    info.ModTime().UTC().Format(time.RFC3339),
			IsReferenced: referenced[name] || referenced["/api/tts/audio/"+name],
			URL:          "/api/tts/audio/" + name,
		})
	}

	sort.Slice(assets, func(i, j int) bool {
		return assets[i].UpdatedAt > assets[j].UpdatedAt
	})

	return c.JSON(http.StatusOK, assets)
}

func (h *Handler) AdminDeleteAsset(c echo.Context) error {
	filename := c.Param("filename")
	if !hexAudioRegex.MatchString(filename) {
		return writeError(c, http.StatusBadRequest, "Nama file audio tidak valid.")
	}

	ttsDir := filepath.Clean(filepath.Join(h.Config.UploadDir, "tts"))
	targetPath := filepath.Clean(filepath.Join(ttsDir, filename))
	if filepath.Dir(targetPath) != ttsDir {
		return writeError(c, http.StatusBadRequest, "Akses file tidak diizinkan.")
	}

	if err := os.Remove(targetPath); err != nil {
		if os.IsNotExist(err) {
			return writeError(c, http.StatusNotFound, "File audio tidak ditemukan.")
		}
		return writeError(c, http.StatusInternalServerError, "Gagal menghapus file audio.")
	}

	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) AdminCleanupAssets(c echo.Context) error {
	ttsDir := filepath.Clean(filepath.Join(h.Config.UploadDir, "tts"))
	_ = os.MkdirAll(ttsDir, 0o755)

	referenced := make(map[string]bool)
	rows, err := h.DB.Query("SELECT DISTINCT audio_path FROM scenes WHERE audio_path IS NOT NULL AND audio_path != ''")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var p string
			if err := rows.Scan(&p); err == nil {
				referenced[p] = true
				referenced[filepath.Base(p)] = true
				referenced[strings.TrimPrefix(p, "/api/tts/audio/")] = true
			}
		}
	}

	entries, err := os.ReadDir(ttsDir)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal membaca direktori aset audio.")
	}

	var deletedCount int
	var freedBytes int64

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(strings.ToLower(entry.Name()), ".mp3") {
			continue
		}
		name := entry.Name()
		if referenced[name] || referenced["/api/tts/audio/"+name] {
			continue
		}

		info, err := entry.Info()
		size := int64(0)
		if err == nil {
			size = info.Size()
		}

		targetPath := filepath.Clean(filepath.Join(ttsDir, name))
		if err := os.Remove(targetPath); err == nil {
			deletedCount++
			freedBytes += size
		}
	}

	return c.JSON(http.StatusOK, map[string]any{
		"deletedCount": deletedCount,
		"freedBytes":   freedBytes,
	})
}

func (h *Handler) AdminListProjects(c echo.Context) error {
	query := `SELECT p.id, p.user_id, u.email, p.title, p.stage, p.created_at, p.updated_at, (SELECT COUNT(*) FROM scenes s WHERE s.project_id = p.id) as scene_count FROM projects p JOIN users u ON p.user_id = u.id ORDER BY p.updated_at DESC`
	rows, err := h.DB.Query(query)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat daftar proyek.")
	}
	defer rows.Close()

	projects := make([]models.AdminProjectItem, 0)
	for rows.Next() {
		var item models.AdminProjectItem
		var title sql.NullString
		if err := rows.Scan(&item.ID, &item.UserID, &item.UserEmail, &title, &item.Stage, &item.CreatedAt, &item.UpdatedAt, &item.SceneCount); err != nil {
			return writeError(c, http.StatusInternalServerError, "Gagal membaca data proyek.")
		}
		item.Title = title.String
		projects = append(projects, item)
	}

	return c.JSON(http.StatusOK, projects)
}

func (h *Handler) AdminDeleteProject(c echo.Context) error {
	projectID := c.Param("id")
	if projectID == "" {
		return writeError(c, http.StatusBadRequest, "ID proyek tidak valid.")
	}

	result, err := h.DB.Exec("DELETE FROM projects WHERE id = ?", projectID)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menghapus proyek.")
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return writeError(c, http.StatusNotFound, "Proyek tidak ditemukan.")
	}

	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) AdminListLedger(c echo.Context) error {
	query := `SELECT l.id, l.user_id, u.email, l.delta, l.reason, l.ref, l.created_at FROM credit_ledger l JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 200`
	rows, err := h.DB.Query(query)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat log transaksi kredit.")
	}
	defer rows.Close()

	items := make([]models.AdminLedgerItem, 0)
	for rows.Next() {
		var item models.AdminLedgerItem
		var reason sql.NullString
		var ref sql.NullString
		if err := rows.Scan(&item.ID, &item.UserID, &item.UserEmail, &item.Delta, &reason, &ref, &item.CreatedAt); err != nil {
			return writeError(c, http.StatusInternalServerError, "Gagal membaca log kredit.")
		}
		item.Reason = reason.String
		item.Ref = ref.String
		items = append(items, item)
	}

	return c.JSON(http.StatusOK, items)
}

func (h *Handler) defaultSystemSettings() models.SystemSettingsPayload {
	return models.SystemSettingsPayload{
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
				APIKey:       h.Config.ByNaraAPIKey,
				SecondaryKey: h.Config.ByNaraSecondaryKey,
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
				APIKey:       h.Config.SumopodAPIKey,
				DefaultModel: "deepseek-v4.1-flash:netra",
			},
			Gemini: models.GeminiConfig{
				Enabled:      true,
				APIKeys:      h.Config.GeminiAPIKeys,
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
			TTSTimeoutSeconds:  h.Config.TTSTimeoutSeconds,
			TrialDays:          h.Config.TrialDays,
			TrialCredits:       2,
			TrialQuota:         1,
			StarterCredits:     60,
			ProCredits:         200,
			AutoCleanupOrphan:  false,
			JWTExpiryHours:     h.Config.JWTExpiryHours,
			MaintenanceMode:    false,
			GoogleClientID:     h.Config.GoogleClientID,
			GoogleClientSecret: h.Config.GoogleClientSecret,
		},
	}
}

func (h *Handler) loadSystemSettings() models.SystemSettingsPayload {
	defaults := h.defaultSystemSettings()
	var raw string
	err := h.DB.QueryRow("SELECT value FROM system_settings WHERE key = 'main_settings'").Scan(&raw)
	if err != nil || raw == "" {
		return defaults
	}

	var stored models.SystemSettingsPayload
	if err := json.Unmarshal([]byte(raw), &stored); err != nil {
		return defaults
	}

	if stored.AIRouter.ByNara.BaseURL == "" {
		stored.AIRouter.ByNara = defaults.AIRouter.ByNara
	}
	if len(stored.AIRouter.ByNara.Models) == 0 {
		stored.AIRouter.ByNara.Models = defaults.AIRouter.ByNara.Models
	}
	if stored.AIRouter.Sumopod.BaseURL == "" {
		stored.AIRouter.Sumopod = defaults.AIRouter.Sumopod
	}
	if stored.AIRouter.ActiveProvider == "" {
		stored.AIRouter.ActiveProvider = defaults.AIRouter.ActiveProvider
	}
	return stored
}

func (h *Handler) AdminGetSettings(c echo.Context) error {
	settings := h.loadSystemSettings()
	return c.JSON(http.StatusOK, settings)
}

func (h *Handler) AdminSaveSettings(c echo.Context) error {
	var payload models.SystemSettingsPayload
	if err := c.Bind(&payload); err != nil {
		return writeError(c, http.StatusBadRequest, "Format pengaturan tidak valid.")
	}

	encoded, err := json.Marshal(payload)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal mengemas pengaturan sistem.")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	_, err = h.DB.Exec(
		`INSERT INTO system_settings (key, value, updated_at) 
		 VALUES ('main_settings', ?, ?) 
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
		string(encoded), now,
	)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menyimpan ke database.")
	}

	return c.JSON(http.StatusOK, payload)
}

func (h *Handler) AdminTestAI(c echo.Context) error {
	var req models.AITestRequest
	if err := c.Bind(&req); err != nil {
		return writeError(c, http.StatusBadRequest, "Permintaan tes AI tidak valid.")
	}

	prompt := strings.TrimSpace(req.Prompt)
	if prompt == "" {
		prompt = "Tes koneksi Voicemotion AI Router. Berikan respon 1 kalimat salam kreatif."
	}

	settings := h.loadSystemSettings()

	var (
		baseURL string
		apiKey  string
		model   string
	)

	switch req.Provider {
	case "sumopod":
		baseURL = settings.AIRouter.Sumopod.BaseURL
		apiKey = settings.AIRouter.Sumopod.APIKey
		model = settings.AIRouter.Sumopod.DefaultModel
	case "gemini":
		model = settings.AIRouter.Gemini.DefaultModel
		if len(settings.AIRouter.Gemini.APIKeys) > 0 {
			apiKey = settings.AIRouter.Gemini.APIKeys[0]
		}
	case "custom":
		baseURL = settings.AIRouter.Custom.BaseURL
		apiKey = settings.AIRouter.Custom.APIKey
		model = settings.AIRouter.Custom.DefaultModel
	default: // bynara
		baseURL = settings.AIRouter.ByNara.BaseURL
		apiKey = settings.AIRouter.ByNara.APIKey
		model = settings.AIRouter.ByNara.DefaultModel
	}

	if req.BaseURL != "" {
		baseURL = req.BaseURL
	}
	if req.APIKey != "" {
		apiKey = req.APIKey
	}
	if req.Model != "" {
		model = req.Model
	}

	start := time.Now()

	if req.Provider == "gemini" {
		if apiKey == "" {
			return c.JSON(http.StatusOK, models.AITestResponse{
				OK:        false,
				LatencyMs: time.Since(start).Milliseconds(),
				Provider:  req.Provider,
				Model:     model,
				Error:     "API Key Gemini belum diatur.",
			})
		}

		url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)
		payload := map[string]any{
			"contents": []map[string]any{
				{
					"parts": []map[string]string{
						{"text": prompt},
					},
				},
			},
		}
		data, _ := json.Marshal(payload)
		httpReq, _ := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(data))
		httpReq.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 15 * time.Second}
		resp, err := client.Do(httpReq)
		latency := time.Since(start).Milliseconds()
		if err != nil {
			return c.JSON(http.StatusOK, models.AITestResponse{
				OK:        false,
				LatencyMs: latency,
				Provider:  req.Provider,
				Model:     model,
				Error:     err.Error(),
			})
		}
		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)

		if resp.StatusCode >= 400 {
			return c.JSON(http.StatusOK, models.AITestResponse{
				OK:        false,
				LatencyMs: latency,
				Provider:  req.Provider,
				Model:     model,
				Error:     fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(bodyBytes)),
			})
		}

		var geminiRes geminiResponse
		_ = json.Unmarshal(bodyBytes, &geminiRes)
		reply := "Tes berhasil."
		if len(geminiRes.Candidates) > 0 && len(geminiRes.Candidates[0].Content.Parts) > 0 {
			reply = geminiRes.Candidates[0].Content.Parts[0].Text
		}

		return c.JSON(http.StatusOK, models.AITestResponse{
			OK:        true,
			Reply:     strings.TrimSpace(reply),
			LatencyMs: latency,
			Provider:  req.Provider,
			Model:     model,
		})
	}

	// OpenAI-compatible Chat Completions endpoint (ByNara, Sumopod, Custom)
	targetURL := strings.TrimRight(baseURL, "/") + "/chat/completions"
	payload := map[string]any{
		"model": model,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature": 0.7,
		"max_tokens":  200,
	}
	data, _ := json.Marshal(payload)
	httpReq, err := http.NewRequest(http.MethodPost, targetURL, bytes.NewBuffer(data))
	if err != nil {
		return c.JSON(http.StatusOK, models.AITestResponse{
			OK:        false,
			LatencyMs: time.Since(start).Milliseconds(),
			Provider:  req.Provider,
			Model:     model,
			Error:     err.Error(),
		})
	}
	httpReq.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	}

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(httpReq)
	latency := time.Since(start).Milliseconds()
	if err != nil {
		return c.JSON(http.StatusOK, models.AITestResponse{
			OK:        false,
			LatencyMs: latency,
			Provider:  req.Provider,
			Model:     model,
			Error:     err.Error(),
		})
	}
	defer resp.Body.Close()
	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		return c.JSON(http.StatusOK, models.AITestResponse{
			OK:        false,
			LatencyMs: latency,
			Provider:  req.Provider,
			Model:     model,
			Error:     fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(bodyBytes)),
		})
	}

	var chatRes struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	_ = json.Unmarshal(bodyBytes, &chatRes)
	reply := "Tes berhasil terkoneksi."
	if len(chatRes.Choices) > 0 {
		reply = chatRes.Choices[0].Message.Content
	}

	return c.JSON(http.StatusOK, models.AITestResponse{
		OK:        true,
		Reply:     strings.TrimSpace(reply),
		LatencyMs: latency,
		Provider:  req.Provider,
		Model:     model,
	})
}
