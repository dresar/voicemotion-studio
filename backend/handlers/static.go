package handlers

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v4"
)

func (h *Handler) ServeStatic(c echo.Context) error {
	requestPath := c.Request().URL.Path
	if strings.HasPrefix(requestPath, "/api/") {
		return writeError(c, http.StatusNotFound, "Endpoint tidak ditemukan.")
	}
	if c.Request().Method != http.MethodGet && c.Request().Method != http.MethodHead {
		return c.NoContent(http.StatusMethodNotAllowed)
	}
	cleanPath := filepath.ToSlash(filepath.Clean("/" + requestPath))
	relativePath := strings.TrimPrefix(cleanPath, "/")
	staticRoot, err := filepath.Abs(h.Config.StaticDir)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Folder statis tidak valid.")
	}
	filePath := filepath.Join(staticRoot, filepath.FromSlash(relativePath))
	if filePath != staticRoot && !strings.HasPrefix(filePath, staticRoot+string(os.PathSeparator)) {
		return writeError(c, http.StatusNotFound, "File tidak ditemukan.")
	}
	if info, statErr := os.Stat(filePath); statErr == nil {
		if !info.IsDir() {
			setStaticCacheHeader(c, cleanPath)
			return c.File(filePath)
		}
		indexInDir := filepath.Join(filePath, "index.html")
		if idxInfo, idxErr := os.Stat(indexInDir); idxErr == nil && !idxInfo.IsDir() {
			setStaticCacheHeader(c, cleanPath)
			return c.File(indexInDir)
		}
	}
	if path.Ext(cleanPath) != "" {
		return writeError(c, http.StatusNotFound, "File tidak ditemukan.")
	}
	indexPath := filepath.Join(staticRoot, "index.html")
	if _, statErr := os.Stat(indexPath); statErr != nil {
		return c.String(http.StatusServiceUnavailable, "Frontend belum dibangun. Jalankan npm run build di folder frontend.")
	}
	c.Response().Header().Set("Cache-Control", "no-cache")
	return c.File(indexPath)
}

func setStaticCacheHeader(c echo.Context, cleanPath string) {
	if cleanPath == "/" || strings.HasSuffix(cleanPath, ".html") {
		c.Response().Header().Set("Cache-Control", "no-cache")
		return
	}
	if strings.Contains(cleanPath, "/_next/static/") {
		c.Response().Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		return
	}
	if cleanPath == "/sw.js" || cleanPath == "/manifest.json" {
		c.Response().Header().Set("Cache-Control", "no-cache")
		return
	}
	c.Response().Header().Set("Cache-Control", "public, max-age=3600")
}
