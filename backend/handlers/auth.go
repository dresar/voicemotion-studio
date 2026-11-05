package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"voicemotion/middleware"
	"voicemotion/models"
)

const oauthStateCookie = "voicemotion_oauth_state"

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type googleProfile struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func (h *Handler) issueToken(user models.User) (string, error) {
	expiryHours := h.Config.JWTExpiryHours
	if expiryHours <= 0 {
		expiryHours = 168
	}
	now := time.Now().UTC()
	claims := models.Claims{
		UserID: user.ID,
		Role:   user.Role,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(expiryHours) * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.Config.JWTSecret))
}

func (h *Handler) Login(c echo.Context) error {
	var payload loginRequest
	if err := bindJSON(c, &payload); err != nil {
		return err
	}
	email := strings.ToLower(strings.TrimSpace(payload.Email))
	if email == "" || payload.Password == "" {
		return writeError(c, http.StatusBadRequest, "Email dan password wajib diisi.")
	}
	user, err := userByEmailOrUsername(h.DB, email)
	if err == sql.ErrNoRows {
		return writeError(c, http.StatusUnauthorized, "Email atau password belum benar.")
	}
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memeriksa akun.")
	}
	if user.PasswordHash == "" {
		return writeError(c, http.StatusUnauthorized, "Akun ini masuk lewat Google.")
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(payload.Password)) != nil {
		return writeError(c, http.StatusUnauthorized, "Email atau password belum benar.")
	}
	if user.Disabled {
		return writeError(c, http.StatusForbidden, "Akun ini sedang dinonaktifkan.")
	}
	token, err := h.issueToken(user)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal membuat sesi.")
	}
	return c.JSON(http.StatusOK, map[string]any{"token": token, "user": user})
}

func (h *Handler) Me(c echo.Context) error {
	user, err := userByID(h.DB, middleware.UserID(c))
	if err == sql.ErrNoRows {
		return writeError(c, http.StatusUnauthorized, "Sesi tidak valid.")
	}
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat akun.")
	}
	if user.Disabled {
		return writeError(c, http.StatusForbidden, "Akun ini sedang dinonaktifkan.")
	}
	return c.JSON(http.StatusOK, user)
}

func (h *Handler) Logout(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) oauthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     h.Config.GoogleClientID,
		ClientSecret: h.Config.GoogleClientSecret,
		RedirectURL:  h.Config.GoogleRedirectURL,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
}

func (h *Handler) GoogleLogin(c echo.Context) error {
	if h.Config.GoogleClientID == "" || h.Config.GoogleClientSecret == "" {
		if h.Config.AppURL != "" {
			return c.Redirect(http.StatusFound, h.frontendURL("/masuk/?error=google_config"))
		}
		return writeError(c, http.StatusServiceUnavailable, "Login Google belum dikonfigurasi di server ini.")
	}
	state := randomState(24)
	c.SetCookie(&http.Cookie{
		Name:     oauthStateCookie,
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.Config.IsProduction(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   600,
	})
	return c.Redirect(http.StatusFound, h.oauthConfig().AuthCodeURL(state, oauth2.AccessTypeOffline))
}

func (h *Handler) GoogleCallback(c echo.Context) error {
	stateCookie, err := c.Cookie(oauthStateCookie)
	if err != nil || stateCookie.Value == "" || c.QueryParam("state") != stateCookie.Value {
		h.clearOAuthState(c)
		return h.redirectAuthError(c, "state")
	}
	h.clearOAuthState(c)
	code := c.QueryParam("code")
	if code == "" {
		return h.redirectAuthError(c, "oauth")
	}
	ctx, cancel := context.WithTimeout(c.Request().Context(), 20*time.Second)
	defer cancel()
	token, err := h.oauthConfig().Exchange(ctx, code)
	if err != nil {
		c.Logger().Errorf("oauth exchange failed: %v", err)
		return h.redirectAuthError(c, "oauth")
	}
	client := h.oauthConfig().Client(ctx, token)
	response, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.Logger().Errorf("google userinfo failed: %v", err)
		return h.redirectAuthError(c, "oauth")
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return h.redirectAuthError(c, "oauth")
	}
	var profile googleProfile
	if err := json.NewDecoder(response.Body).Decode(&profile); err != nil {
		return h.redirectAuthError(c, "oauth")
	}
	email := strings.ToLower(strings.TrimSpace(profile.Email))
	if email == "" {
		return h.redirectAuthError(c, "email")
	}
	user, err := userByEmailOrUsername(h.DB, email)
	if err == sql.ErrNoRows {
		user, err = h.createGoogleUser(profile, email)
		if err != nil {
			c.Logger().Errorf("google user create failed: %v", err)
			return h.redirectAuthError(c, "oauth")
		}
	} else if err != nil {
		c.Logger().Errorf("google user lookup failed: %v", err)
		return h.redirectAuthError(c, "oauth")
	} else {
		_, updateErr := h.DB.Exec(
			"UPDATE users SET name = COALESCE(NULLIF(?, ''), name), avatar = COALESCE(NULLIF(?, ''), avatar) WHERE id = ?",
			profile.Name,
			profile.Picture,
			user.ID,
		)
		if updateErr != nil {
			c.Logger().Errorf("google user update failed: %v", updateErr)
		}
		user, err = userByID(h.DB, user.ID)
		if err != nil {
			return h.redirectAuthError(c, "oauth")
		}
	}
	if user.Disabled {
		return h.redirectAuthError(c, "disabled")
	}
	sessionToken, err := h.issueToken(user)
	if err != nil {
		return h.redirectAuthError(c, "oauth")
	}
	return c.Redirect(http.StatusFound, h.frontendURL("/app/?token="+url.QueryEscape(sessionToken)))
}

func (h *Handler) createGoogleUser(profile googleProfile, email string) (models.User, error) {
	now := time.Now().UTC()
	trialEndsAt := now.AddDate(0, 0, h.Config.TrialDays).Format(time.RFC3339)
	name := strings.TrimSpace(profile.Name)
	if name == "" {
		name = strings.Split(email, "@")[0]
	}
	userID := uuid.NewString()
	_, err := h.DB.Exec(
		`INSERT INTO users (id, email, name, avatar, provider, plan, trial_ends_at, credits, project_quota, role, referral_code, created_at, password_hash, disabled)
		 VALUES (?, ?, ?, ?, 'google', 'trial', ?, 2, 1, 'user', ?, ?, NULL, 0)`,
		userID,
		email,
		name,
		profile.Picture,
		trialEndsAt,
		randomState(4),
		now.Format(time.RFC3339),
	)
	if err != nil {
		if isUniqueViolation(err) {
			return userByEmail(h.DB, email)
		}
		return models.User{}, err
	}
	return userByID(h.DB, userID)
}

func (h *Handler) frontendURL(path string) string {
	if h.Config.AppURL == "" {
		return path
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return h.Config.AppURL + path
}

func (h *Handler) redirectAuthError(c echo.Context, code string) error {
	if h.Config.AppURL != "" {
		return c.Redirect(http.StatusFound, h.frontendURL("/masuk/?error="+url.QueryEscape(code)))
	}
	return writeError(c, http.StatusUnauthorized, "Login Google gagal. Coba lagi.")
}

func (h *Handler) clearOAuthState(c echo.Context) {
	c.SetCookie(&http.Cookie{
		Name:     oauthStateCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   h.Config.IsProduction(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}
