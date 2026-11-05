package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"voicemotion/middleware"
	"voicemotion/models"
)

type exportRequest struct {
	ProjectID string `json:"projectId"`
	Status    string `json:"status"`
	Format    string `json:"format"`
	SizeBytes int64  `json:"sizeBytes"`
}

func (h *Handler) CreateExport(c echo.Context) error {
	var payload exportRequest
	if err := bindJSON(c, &payload); err != nil {
		return err
	}
	if strings.TrimSpace(payload.ProjectID) == "" {
		return writeError(c, http.StatusBadRequest, "Proyek wajib diisi.")
	}
	if _, err := h.projectByID(middleware.UserID(c), payload.ProjectID); err == sql.ErrNoRows {
		return writeError(c, http.StatusNotFound, "Proyek tidak ditemukan.")
	} else if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memeriksa proyek.")
	}
	status := strings.TrimSpace(payload.Status)
	if status == "" {
		status = "done"
	}
	format := strings.TrimSpace(payload.Format)
	if format == "" {
		format = "mp4"
	}
	sizeBytes := payload.SizeBytes
	if sizeBytes < 0 {
		sizeBytes = 0
	}
	exportID := uuid.NewString()
	now := nowRFC3339()
	_, err := h.DB.Exec(
		"INSERT INTO exports (id, project_id, user_id, status, format, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		exportID,
		payload.ProjectID,
		middleware.UserID(c),
		status,
		format,
		sizeBytes,
		now,
	)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal mencatat export.")
	}
	return c.JSON(http.StatusCreated, models.ExportLog{
		ID:        exportID,
		ProjectID: payload.ProjectID,
		UserID:    middleware.UserID(c),
		Status:    status,
		Format:    format,
		SizeBytes: sizeBytes,
		CreatedAt: now,
	})
}
