package middleware

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"

	"voicemotion/models"
)

const (
	ContextUserID = "user_id"
	ContextRole   = "user_role"
	ContextEmail  = "user_email"
)

func JWT(secret string, connection *sql.DB) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			header := c.Request().Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				return unauthorized(c)
			}
			rawToken := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
			if rawToken == "" {
				return unauthorized(c)
			}
			claims := &models.Claims{}
			token, err := jwt.ParseWithClaims(rawToken, claims, func(token *jwt.Token) (any, error) {
				if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(secret), nil
			})
			if err != nil || !token.Valid || claims.UserID == "" {
				return unauthorized(c)
			}
			var role string
			var disabled int
			err = connection.QueryRow("SELECT role, disabled FROM users WHERE id = ?", claims.UserID).Scan(&role, &disabled)
			if err == sql.ErrNoRows {
				return unauthorized(c)
			}
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal memeriksa sesi."})
			}
			if disabled != 0 {
				return c.JSON(http.StatusForbidden, map[string]string{"error": "Akun ini sedang dinonaktifkan."})
			}
			c.Set(ContextUserID, claims.UserID)
			c.Set(ContextRole, role)
			c.Set(ContextEmail, claims.Email)
			return next(c)
		}
	}
}

func AdminOnly() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if Role(c) != "admin" {
				return c.JSON(http.StatusForbidden, map[string]string{"error": "Halaman ini hanya untuk admin."})
			}
			return next(c)
		}
	}
}

func UserID(c echo.Context) string {
	value, _ := c.Get(ContextUserID).(string)
	return value
}

func Role(c echo.Context) string {
	value, _ := c.Get(ContextRole).(string)
	return value
}

func Email(c echo.Context) string {
	value, _ := c.Get(ContextEmail).(string)
	return value
}

func unauthorized(c echo.Context) error {
	return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Sesi tidak valid. Silakan masuk lagi."})
}
