package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"

	"voicemotion/models"
)

func LoadBgm(path string) ([]models.BgmTrack, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var tracks []models.BgmTrack
	if err := json.Unmarshal(content, &tracks); err != nil {
		return nil, err
	}
	return tracks, nil
}

func (h *Handler) ListBgm(c echo.Context) error {
	c.Response().Header().Set("Cache-Control", "public, max-age=3600")
	return c.JSON(http.StatusOK, h.BgmTracks)
}

func (h *Handler) GetBgm(c echo.Context) error {
	id := c.Param("id")
	for _, track := range h.BgmTracks {
		if track.ID == id {
			c.Response().Header().Set("Cache-Control", "public, max-age=3600")
			return c.JSON(http.StatusOK, track)
		}
	}
	return writeError(c, http.StatusNotFound, "BGM track tidak ditemukan.")
}
