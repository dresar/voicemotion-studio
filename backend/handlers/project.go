package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"voicemotion/middleware"
	"voicemotion/models"
)

type createProjectRequest struct {
	Title  string          `json:"title"`
	Config json.RawMessage `json:"config"`
}

func (h *Handler) ListProjects(c echo.Context) error {
	rows, err := h.DB.Query(projectSelect+" WHERE p.user_id = ? ORDER BY p.updated_at DESC", middleware.UserID(c))
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat proyek.")
	}
	defer rows.Close()
	projects := make([]models.Project, 0)
	for rows.Next() {
		project, scanErr := scanProject(rows)
		if scanErr != nil {
			return writeError(c, http.StatusInternalServerError, "Gagal membaca proyek.")
		}
		projects = append(projects, project)
	}
	return c.JSON(http.StatusOK, projects)
}

func (h *Handler) CreateProject(c echo.Context) error {
	userID := middleware.UserID(c)
	var payload createProjectRequest
	if err := bindJSON(c, &payload); err != nil {
		return err
	}
	title := strings.TrimSpace(payload.Title)
	if title == "" {
		title = "Proyek Baru"
	}
	if len([]rune(title)) > 120 {
		title = string([]rune(title)[:120])
	}
	configText := normalizeConfig(payload.Config)
	projectID := uuid.NewString()
	now := nowRFC3339()
	_, err := h.DB.Exec(
		"INSERT INTO projects (id, user_id, title, stage, config, selected_idea_id, selected_idea, created_at, updated_at) VALUES (?, ?, ?, 'idea', ?, NULL, NULL, ?, ?)",
		projectID,
		userID,
		title,
		configText,
		now,
		now,
	)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal membuat proyek.")
	}
	project, err := h.projectByID(userID, projectID)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Proyek dibuat tetapi gagal dimuat.")
	}
	return c.JSON(http.StatusCreated, project)
}

func (h *Handler) GetProject(c echo.Context) error {
	project, err := h.projectByID(middleware.UserID(c), c.Param("id"))
	if err == sql.ErrNoRows {
		return writeError(c, http.StatusNotFound, "Proyek tidak ditemukan.")
	}
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat proyek.")
	}
	return c.JSON(http.StatusOK, project)
}

func (h *Handler) UpdateProject(c echo.Context) error {
	userID := middleware.UserID(c)
	projectID := c.Param("id")
	existing, err := h.projectByID(userID, projectID)
	if err == sql.ErrNoRows {
		return writeError(c, http.StatusNotFound, "Proyek tidak ditemukan.")
	}
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat proyek.")
	}
	var payload map[string]json.RawMessage
	if err := c.Bind(&payload); err != nil {
		return writeError(c, http.StatusBadRequest, "Format permintaan tidak valid.")
	}
	sets := make([]string, 0)
	args := make([]any, 0)
	if raw, exists := payload["title"]; exists {
		var title string
		if json.Unmarshal(raw, &title) == nil {
			title = strings.TrimSpace(title)
			if title == "" {
				title = existing.Title
			}
			if len([]rune(title)) > 120 {
				title = string([]rune(title)[:120])
			}
			sets = append(sets, "title = ?")
			args = append(args, title)
		}
	}
	if raw, exists := payload["stage"]; exists {
		var stage string
		if json.Unmarshal(raw, &stage) == nil && isValidStage(stage) {
			sets = append(sets, "stage = ?")
			args = append(args, stage)
		}
	}
	if raw, exists := payload["config"]; exists {
		sets = append(sets, "config = ?")
		args = append(args, normalizeConfig(raw))
	}
	if raw, exists := payload["selectedIdeaId"]; exists {
		if strings.TrimSpace(string(raw)) == "null" {
			sets = append(sets, "selected_idea_id = NULL")
		} else {
			var selectedID string
			if json.Unmarshal(raw, &selectedID) == nil {
				sets = append(sets, "selected_idea_id = ?")
				args = append(args, nullableString(selectedID))
			}
		}
	}
	if raw, exists := payload["selectedIdea"]; exists {
		if strings.TrimSpace(string(raw)) == "null" {
			sets = append(sets, "selected_idea = NULL")
		} else if json.Valid(raw) {
			sets = append(sets, "selected_idea = ?")
			args = append(args, string(raw))
		}
	}
	if len(sets) == 0 {
		return c.JSON(http.StatusOK, existing)
	}
	sets = append(sets, "updated_at = ?")
	args = append(args, nowRFC3339(), projectID, userID)
	query := "UPDATE projects SET " + strings.Join(sets, ", ") + " WHERE id = ? AND user_id = ?"
	if _, err := h.DB.Exec(query, args...); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menyimpan proyek.")
	}
	project, err := h.projectByID(userID, projectID)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Proyek tersimpan tetapi gagal dimuat.")
	}
	return c.JSON(http.StatusOK, project)
}

func (h *Handler) DeleteProject(c echo.Context) error {
	result, err := h.DB.Exec("DELETE FROM projects WHERE id = ? AND user_id = ?", c.Param("id"), middleware.UserID(c))
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menghapus proyek.")
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return writeError(c, http.StatusNotFound, "Proyek tidak ditemukan.")
	}
	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) DuplicateProject(c echo.Context) error {
	userID := middleware.UserID(c)
	source, err := h.projectByID(userID, c.Param("id"))
	if err == sql.ErrNoRows {
		return writeError(c, http.StatusNotFound, "Proyek tidak ditemukan.")
	}
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat proyek.")
	}
	newID := uuid.NewString()
	now := nowRFC3339()
	title := source.Title + " (Salin)"
	if len([]rune(title)) > 120 {
		title = string([]rune(title)[:120])
	}
	transaction, err := h.DB.Begin()
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menduplikat proyek.")
	}
	defer transaction.Rollback()
	_, err = transaction.Exec(
		"INSERT INTO projects (id, user_id, title, stage, config, selected_idea_id, selected_idea, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		newID,
		userID,
		title,
		source.Stage,
		string(source.Config),
		source.SelectedIdeaID,
		nullableString(string(source.SelectedIdea)),
		now,
		now,
	)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menduplikat proyek.")
	}
	rows, err := transaction.Query(sceneSelect+" WHERE project_id = ? ORDER BY idx ASC", source.ID)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menyalin scene.")
	}
	scenes := make([]models.Scene, 0)
	for rows.Next() {
		scene, scanErr := scanScene(rows)
		if scanErr != nil {
			rows.Close()
			return writeError(c, http.StatusInternalServerError, "Gagal membaca scene.")
		}
		scenes = append(scenes, scene)
	}
	rows.Close()
	for _, scene := range scenes {
		_, err = transaction.Exec(
			`INSERT INTO scenes (id, project_id, idx, narration, visual, theme, duration_sec, audio_path, audio_ms, word_timings, code, code_status, code_error, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			uuid.NewString(),
			newID,
			scene.Idx,
			scene.Narration,
			scene.Visual,
			scene.Theme,
			scene.DurationSec,
			scene.AudioPath,
			scene.AudioMs,
			scene.WordTimings,
			scene.Code,
			scene.CodeStatus,
			scene.CodeError,
			now,
		)
		if err != nil {
			return writeError(c, http.StatusInternalServerError, "Gagal menyalin scene.")
		}
	}
	if err := transaction.Commit(); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menyelesaikan duplikat.")
	}
	project, err := h.projectByID(userID, newID)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Proyek diduplikat tetapi gagal dimuat.")
	}
	return c.JSON(http.StatusCreated, project)
}

func (h *Handler) projectByID(userID string, projectID string) (models.Project, error) {
	return scanProject(h.DB.QueryRow(projectSelect+" WHERE p.id = ? AND p.user_id = ?", projectID, userID))
}

func normalizeConfig(raw json.RawMessage) string {
	if len(raw) == 0 || !json.Valid(raw) {
		return "{}"
	}
	var object map[string]any
	if json.Unmarshal(raw, &object) != nil {
		return "{}"
	}
	return string(raw)
}
