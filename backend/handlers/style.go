package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"

	"voicemotion/models"
)

func LoadStyles(path string) ([]models.StylePack, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var styles []models.StylePack
	if err := json.Unmarshal(content, &styles); err != nil {
		return nil, err
	}
	return styles, nil
}

func (h *Handler) ListStyles(c echo.Context) error {
	c.Response().Header().Set("Cache-Control", "public, max-age=3600")
	return c.JSON(http.StatusOK, h.Styles)
}

func (h *Handler) GetStyle(c echo.Context) error {
	slug := c.Param("slug")
	for _, style := range h.Styles {
		if style.Slug == slug {
			c.Response().Header().Set("Cache-Control", "public, max-age=3600")
			return c.JSON(http.StatusOK, style)
		}
	}
	return writeError(c, http.StatusNotFound, "Gaya tidak ditemukan.")
}
