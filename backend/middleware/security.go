package middleware

import (
	"github.com/labstack/echo/v4"

	"voicemotion/config"
)

func SecurityHeaders(cfg config.Config) echo.MiddlewareFunc {
	connectSources := "'self'"
	if !cfg.IsProduction() {
		connectSources = "'self' http://localhost:3000 http://localhost:3001"
	}
	policy := "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; worker-src 'self' blob:; connect-src " + connectSources + "; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			headers := c.Response().Header()
			headers.Set("X-Content-Type-Options", "nosniff")
			headers.Set("X-Frame-Options", "DENY")
			headers.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			headers.Set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()")
			headers.Set("Content-Security-Policy", policy)
			return next(c)
		}
	}
}
