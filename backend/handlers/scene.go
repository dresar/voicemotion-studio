package handlers

import (
	"database/sql"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"voicemotion/middleware"
	"voicemotion/models"
)

type sceneInput struct {
	ID          string  `json:"id"`
	Idx         int     `json:"idx"`
	Narration   string  `json:"narration"`
	Visual      string  `json:"visual"`
	Theme       string  `json:"theme"`
	DurationSec float64 `json:"durationSec"`
	AudioPath   string  `json:"audioPath"`
	AudioMs     *int    `json:"audioMs"`
	WordTimings *string `json:"wordTimings"`
	Code        string  `json:"code"`
	CodeStatus  string  `json:"codeStatus"`
	CodeError   *string `json:"codeError"`
}

type scenesRequest struct {
	Scenes []sceneInput `json:"scenes"`
}

func (h *Handler) ListScenes(c echo.Context) error {
	userID := middleware.UserID(c)
	projectID := c.Param("id")
	if _, err := h.projectByID(userID, projectID); err == sql.ErrNoRows {
		return writeError(c, http.StatusNotFound, "Proyek tidak ditemukan.")
	} else if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memeriksa proyek.")
	}
	rows, err := h.DB.Query(sceneSelect+" WHERE project_id = ? ORDER BY idx ASC", projectID)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat scene.")
	}
	defer rows.Close()
	scenes := make([]models.Scene, 0)
	for rows.Next() {
		scene, scanErr := scanScene(rows)
		if scanErr != nil {
			return writeError(c, http.StatusInternalServerError, "Gagal membaca scene.")
		}
		scenes = append(scenes, scene)
	}
	return c.JSON(http.StatusOK, scenes)
}

func (h *Handler) SaveScenes(c echo.Context) error {
	userID := middleware.UserID(c)
	projectID := c.Param("id")
	if _, err := h.projectByID(userID, projectID); err == sql.ErrNoRows {
		return writeError(c, http.StatusNotFound, "Proyek tidak ditemukan.")
	} else if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memeriksa proyek.")
	}
	var payload scenesRequest
	if err := bindJSON(c, &payload); err != nil {
		return err
	}
	if len(payload.Scenes) > 30 {
		return writeError(c, http.StatusBadRequest, "Maksimal 30 scene per proyek.")
	}
	totalCharacters := 0
	for index := range payload.Scenes {
		payload.Scenes[index].Narration = trimSceneText(payload.Scenes[index].Narration, 5000)
		payload.Scenes[index].Visual = trimSceneText(payload.Scenes[index].Visual, 2000)
		payload.Scenes[index].Code = trimSceneText(payload.Scenes[index].Code, 60000)
		totalCharacters += len(payload.Scenes[index].Narration) + len(payload.Scenes[index].Visual) + len(payload.Scenes[index].Code)
	}
	if totalCharacters > maxPasteSize {
		return writeError(c, http.StatusBadRequest, "Isi scene terlalu besar. Maksimal 200.000 karakter.")
	}
	transaction, err := h.DB.Begin()
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menyimpan scene.")
	}
	defer transaction.Rollback()
	now := nowRFC3339()
	for index, input := range payload.Scenes {
		theme := input.Theme
		if !isValidTheme(theme) {
			theme = "paper"
		}
		codeStatus := input.CodeStatus
		if !isValidCodeStatus(codeStatus) {
			codeStatus = "empty"
		}
		duration := input.DurationSec
		if duration < 2 {
			duration = 7.5
		}
		if duration > 20 {
			duration = 20
		}
		var audioMs any
		if input.AudioMs != nil && *input.AudioMs > 0 {
			audioMs = *input.AudioMs
		}
		sceneID := input.ID
		if sceneID == "" {
			sceneID = uuid.NewString()
		}
		_, err = transaction.Exec(
			`INSERT INTO scenes (id, project_id, idx, narration, visual, theme, duration_sec, audio_path, audio_ms, word_timings, code, code_status, code_error, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(project_id, idx) DO UPDATE SET
			   narration = excluded.narration,
			   visual = excluded.visual,
			   theme = excluded.theme,
			   duration_sec = excluded.duration_sec,
			   audio_path = excluded.audio_path,
			   audio_ms = excluded.audio_ms,
			   word_timings = excluded.word_timings,
			   code = excluded.code,
			   code_status = excluded.code_status,
			   code_error = excluded.code_error,
			   updated_at = excluded.updated_at`,
			sceneID,
			projectID,
			index,
			input.Narration,
			input.Visual,
			theme,
			duration,
			nullableString(input.AudioPath),
			audioMs,
			input.WordTimings,
			input.Code,
			codeStatus,
			input.CodeError,
			now,
		)
		if err != nil {
			return writeError(c, http.StatusInternalServerError, "Gagal menyimpan scene.")
		}
	}
	if _, err := transaction.Exec("DELETE FROM scenes WHERE project_id = ? AND idx >= ?", projectID, len(payload.Scenes)); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal merapikan scene.")
	}
	if _, err := transaction.Exec("UPDATE projects SET updated_at = ? WHERE id = ? AND user_id = ?", now, projectID, userID); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memperbarui proyek.")
	}
	if err := transaction.Commit(); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menyelesaikan penyimpanan scene.")
	}
	return h.ListScenes(c)
}

func trimSceneText(value string, maximum int) string {
	runes := []rune(value)
	if len(runes) > maximum {
		return string(runes[:maximum])
	}
	return value
}
