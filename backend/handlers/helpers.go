package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"

	"voicemotion/models"
)

const maxPasteSize = 200000

const userColumns = "id, email, COALESCE(name,''), COALESCE(avatar,''), provider, plan, trial_ends_at, credits, project_quota, role, COALESCE(referral_code,''), created_at, COALESCE(password_hash,''), disabled"

const projectSelect = `SELECT p.id, p.user_id, p.title, p.stage, COALESCE(p.config,'{}'), p.selected_idea_id, COALESCE(p.selected_idea,''), COALESCE(p.created_at,''), COALESCE(p.updated_at,''), (SELECT COUNT(*) FROM scenes s WHERE s.project_id = p.id), (SELECT COALESCE(SUM(s.duration_sec),0) FROM scenes s WHERE s.project_id = p.id) FROM projects p`

const sceneSelect = `SELECT id, project_id, idx, COALESCE(narration,''), COALESCE(visual,''), COALESCE(theme,'paper'), COALESCE(duration_sec,7.5), audio_path, audio_ms, word_timings, COALESCE(code,''), COALESCE(code_status,'empty'), code_error, COALESCE(updated_at,'') FROM scenes`

type rowScanner interface {
	Scan(dest ...any) error
}

func nowRFC3339() string {
	return time.Now().UTC().Format(time.RFC3339)
}

func writeError(c echo.Context, status int, message string) error {
	return c.JSON(status, map[string]string{"error": message})
}

func bindJSON(c echo.Context, target any) error {
	if err := c.Bind(target); err != nil {
		return writeError(c, http.StatusBadRequest, "Format permintaan tidak valid.")
	}
	return nil
}

func scanUser(scanner rowScanner) (models.User, error) {
	var user models.User
	var trialEndsAt sql.NullString
	var name sql.NullString
	var avatar sql.NullString
	var referralCode sql.NullString
	var passwordHash sql.NullString
	var disabled int
	err := scanner.Scan(
		&user.ID,
		&user.Email,
		&name,
		&avatar,
		&user.Provider,
		&user.Plan,
		&trialEndsAt,
		&user.Credits,
		&user.ProjectQuota,
		&user.Role,
		&referralCode,
		&user.CreatedAt,
		&passwordHash,
		&disabled,
	)
	if err != nil {
		return user, err
	}
	user.Name = name.String
	user.Avatar = avatar.String
	user.ReferralCode = referralCode.String
	user.PasswordHash = passwordHash.String
	user.Disabled = disabled != 0
	if trialEndsAt.Valid {
		value := trialEndsAt.String
		user.TrialEndsAt = &value
	}
	return user, nil
}

func scanProject(scanner rowScanner) (models.Project, error) {
	var project models.Project
	var configText string
	var selectedIdeaID sql.NullString
	var selectedIdea string
	err := scanner.Scan(
		&project.ID,
		&project.UserID,
		&project.Title,
		&project.Stage,
		&configText,
		&selectedIdeaID,
		&selectedIdea,
		&project.CreatedAt,
		&project.UpdatedAt,
		&project.SceneCount,
		&project.TotalDuration,
	)
	if err != nil {
		return project, err
	}
	if json.Valid([]byte(configText)) && configText != "" {
		project.Config = json.RawMessage(configText)
	} else {
		project.Config = json.RawMessage("{}")
	}
	if selectedIdeaID.Valid && selectedIdeaID.String != "" {
		value := selectedIdeaID.String
		project.SelectedIdeaID = &value
	}
	if json.Valid([]byte(selectedIdea)) && selectedIdea != "" {
		project.SelectedIdea = json.RawMessage(selectedIdea)
	}
	return project, nil
}

func scanScene(scanner rowScanner) (models.Scene, error) {
	var scene models.Scene
	var audioPath sql.NullString
	var audioMs sql.NullInt64
	var wordTimings sql.NullString
	var codeError sql.NullString
	err := scanner.Scan(
		&scene.ID,
		&scene.ProjectID,
		&scene.Idx,
		&scene.Narration,
		&scene.Visual,
		&scene.Theme,
		&scene.DurationSec,
		&audioPath,
		&audioMs,
		&wordTimings,
		&scene.Code,
		&scene.CodeStatus,
		&codeError,
		&scene.UpdatedAt,
	)
	if err != nil {
		return scene, err
	}
	if audioPath.Valid {
		value := audioPath.String
		scene.AudioPath = &value
	}
	if audioMs.Valid {
		value := int(audioMs.Int64)
		scene.AudioMs = &value
	}
	if wordTimings.Valid {
		value := wordTimings.String
		scene.WordTimings = &value
	}
	if codeError.Valid {
		value := codeError.String
		scene.CodeError = &value
	}
	return scene, nil
}

func userByID(connection *sql.DB, userID string) (models.User, error) {
	return scanUser(connection.QueryRow("SELECT "+userColumns+" FROM users WHERE id = ?", userID))
}

func userByEmail(connection *sql.DB, email string) (models.User, error) {
	return scanUser(connection.QueryRow("SELECT "+userColumns+" FROM users WHERE email = ?", email))
}

func userByEmailOrUsername(connection *sql.DB, identifier string) (models.User, error) {
	trimmed := strings.ToLower(strings.TrimSpace(identifier))
	return scanUser(connection.QueryRow(
		"SELECT "+userColumns+" FROM users WHERE LOWER(email) = ? OR LOWER(name) = ? OR LOWER(referral_code) = ? OR LOWER(email) LIKE ? || '@%' LIMIT 1",
		trimmed, trimmed, trimmed, trimmed,
	))
}

func nullableString(value string) any {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return trimmed
}

func randomState(length int) string {
	buffer := make([]byte, length)
	if _, err := rand.Read(buffer); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(buffer)
}

func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	message := strings.ToLower(err.Error())
	return strings.Contains(message, "unique constraint") || strings.Contains(message, "constraint failed")
}

func isValidPlan(plan string) bool {
	return plan == "trial" || plan == "starter" || plan == "pro"
}

func isValidRole(role string) bool {
	return role == "user" || role == "admin"
}

func isValidStage(stage string) bool {
	return stage == "idea" || stage == "narration" || stage == "voice" || stage == "animation"
}

func isValidTheme(theme string) bool {
	return theme == "paper" || theme == "dusk" || theme == "night"
}

func isValidCodeStatus(status string) bool {
	return status == "empty" || status == "ok" || status == "error"
}

func planDefaults(plan string) (int, int) {
	switch plan {
	case "starter":
		return 20, 10
	case "pro":
		return 100, 999
	default:
		return 2, 1
	}
}
